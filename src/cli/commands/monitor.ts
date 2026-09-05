/**
 * `tipper monitor` — weekly comp monitor.
 *
 * Ports the scoring core of analysis/weekly-monitor.py into typed,
 * tested TypeScript. Runs backtests for v3 and shadow configs directly
 * (no subprocess), fetches the Squiggle field live, and prints three
 * sections: comp rank, close band, and market column (Punters).
 *
 * Exits 2 when |market_gap| >= 3 (matching the Python's alert contract).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { loadConfig } from "../../config/store.js";
import { runBacktest } from "../../orchestration.js";
import type { MatchPrediction } from "../../types.js";
import { resolveSeasonDataCache } from "../cache.js";
import { getDatabase } from "../db.js";
import { compOption, noCacheOption, seasonOption } from "../flags.js";
import { monitorFailureCode, monitorSeason } from "../monitor/errors.js";
import {
  closeBandSign,
  compRank,
  compTip,
  marketGap,
  type RankEntry,
  sortRankTable,
} from "../monitor/score.js";
import type { SquiggleGame, SquiggleTip } from "../monitor/squiggle.js";
import { fetchSquiggleField } from "../monitor/squiggle.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..", "..");
const LOG_PATH = join(REPO_ROOT, "analysis", "monitor-log.csv");

const LOG_COLUMNS = [
  "run_date",
  "games_complete",
  "v3_tips",
  "v3_rank",
  "field_n",
  "leader",
  "leader_tips",
  "v4_tips",
  "v4_rank",
  "od_tips",
  "od_rank",
  "punters_tips",
  "market_gap",
  "close_n",
  "close_v3",
  "close_v4",
  "close_od",
  "close_punters",
  "close_field_pct",
  "alert",
];

// The three configs the monitor tracks.
const V3 = "predha-080";
const V4 = "v4-shotoff";
const OD = "od-w100-k008";

// ---------------------------------------------------------------------------
// Helpers: pair our predictions with Squiggle games
// ---------------------------------------------------------------------------

/** Build a lookup map from Squiggle games: key = "YYYY-MM-DD|HTeam". */
function buildGameKey(games: SquiggleGame[]): Map<string, SquiggleGame> {
  const m = new Map<string, SquiggleGame>();
  for (const g of games) {
    m.set(`${g.date.slice(0, 10)}|${g.hteam}`, g);
  }
  return m;
}

/** Pair completed predictions to Squiggle game IDs. Warns on unmatched. */
function matchToSquiggle(
  predictions: readonly MatchPrediction[],
  gameByKey: Map<string, SquiggleGame>,
  label: string,
): Map<number, MatchPrediction> {
  const byGid = new Map<number, MatchPrediction>();
  const unmatched: string[] = [];
  for (const m of predictions) {
    // Only pair completed games (actualMargin set = game has been played)
    if (m.actualMargin === undefined) continue;
    const key = `${m.date.slice(0, 10)}|${m.home}`;
    const g = gameByKey.get(key);
    if (g !== undefined) {
      byGid.set(g.id, m);
    } else {
      unmatched.push(`${m.date.slice(0, 10)} ${m.home} v ${m.away}`);
    }
  }
  if (unmatched.length > 0) {
    console.warn(
      `WARNING [${label}]: ${unmatched.length} completed prediction(s) not found in Squiggle field:`,
      unmatched.slice(0, 3).join(", "),
    );
  }
  return byGid;
}

// ---------------------------------------------------------------------------
// Helpers: scoring on the covered set
// ---------------------------------------------------------------------------

/** Comp tips for our model on the covered game set. */
function oursCompTips(
  byGid: Map<number, MatchPrediction>,
  covered: Set<number>,
  gameById: Map<number, SquiggleGame>,
): number {
  let sum = 0;
  for (const gid of covered) {
    const m = byGid.get(gid);
    const g = gameById.get(gid);
    if (m === undefined || g === undefined) continue;
    if (compTip(m.predictedMargin, g.hscore - g.ascore)) sum++;
  }
  return sum;
}

/** Mean absolute margin error for our model on the covered game set. */
function oursMae(
  byGid: Map<number, MatchPrediction>,
  covered: Set<number>,
  gameById: Map<number, SquiggleGame>,
): number {
  let sum = 0;
  let n = 0;
  for (const gid of covered) {
    const m = byGid.get(gid);
    const g = gameById.get(gid);
    if (m === undefined || g === undefined) continue;
    sum += Math.abs(m.predictedMargin - (g.hscore - g.ascore));
    n++;
  }
  return n > 0 ? sum / n : 0;
}

// ---------------------------------------------------------------------------
// Helpers: cross-model close-band count
// ---------------------------------------------------------------------------

/**
 * Sign accuracy for a model in the v3-defined close band.
 *
 * Close band games are those where v3's |predictedMargin| < threshold AND the
 * actual outcome is not a draw. For v4/OD/Punters, we check their own tip
 * direction in those same games.
 */
function closeBandSignInBand(
  closeGids: readonly number[],
  predictedIsHome: (gid: number) => boolean | null,
  gameById: Map<number, SquiggleGame>,
): { correct: number; total: number } {
  let correct = 0;
  let total = 0;
  for (const gid of closeGids) {
    const g = gameById.get(gid);
    if (g === undefined) continue;
    const actual = g.hscore - g.ascore;
    const isHome = predictedIsHome(gid);
    if (isHome === null) continue; // no coverage for this source
    total++;
    if (isHome === actual > 0) correct++;
  }
  return { correct, total };
}

// ---------------------------------------------------------------------------
// CSV log
// ---------------------------------------------------------------------------

function appendLogRow(row: Record<string, string | number>): void {
  const analysisDir = join(REPO_ROOT, "analysis");
  if (!existsSync(analysisDir)) mkdirSync(analysisDir, { recursive: true });

  // Read existing rows, drop any same-day row, then re-write + append new row.
  const today = new Date().toISOString().slice(0, 10);
  const existing: string[] = [];
  if (existsSync(LOG_PATH)) {
    const lines = readFileSync(LOG_PATH, "utf-8").split("\n").filter(Boolean);
    for (const line of lines.slice(1)) {
      // skip header
      if (!line.startsWith(today)) existing.push(line);
    }
  }

  const header = LOG_COLUMNS.join(",");
  const newRow = LOG_COLUMNS.map((c) => String(row[c] ?? "")).join(",");
  const content = `${[header, ...existing, newRow].join("\n")}\n`;
  writeFileSync(LOG_PATH, content);
}

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

export const monitorCommand = new Command("monitor")
  .description("Weekly comp monitor: v3 + shadow configs vs the Squiggle field")
  .addOption(seasonOption)
  .addOption(compOption)
  .addOption(noCacheOption)
  .option("--log", "Append a row to analysis/monitor-log.csv (idempotent per run date)")
  .action(
    async (opts: { season?: number[]; comp: "AFLM" | "AFLW"; cache: boolean; log: boolean }) => {
      try {
        const season = monitorSeason(opts.season);
        if (opts.comp !== "AFLM") throw new Error("The Squiggle monitor supports AFLM only");

        console.log(`Running monitor for ${season}…`);
        const db = getDatabase();
        const cache = resolveSeasonDataCache(opts.comp, opts.cache);

        // --- Step 1: backtest all three configs for the target season ---
        async function backtestSeason(configId: string) {
          const config = loadConfig(configId);
          const seasonConfig = {
            ...config,
            backtest: { ...config.backtest, test_seasons: [season] },
          };
          return runBacktest(db, seasonConfig, opts.comp, cache);
        }

        console.log(`  backtesting ${V3}, ${V4}, ${OD} for ${season}…`);
        const [v3Result, v4Result, odResult] = await Promise.all([
          backtestSeason(V3),
          backtestSeason(V4),
          backtestSeason(OD),
        ]);

        // --- Step 2: fetch Squiggle field ---
        console.log("  fetching Squiggle field…");
        const { games, tips } = await fetchSquiggleField(season);

        // --- Step 3: match predictions to Squiggle games ---
        const gameByKey = buildGameKey(games);
        const gameById = new Map(games.map((g) => [g.id, g]));

        const v3ByGid = matchToSquiggle(v3Result.matches, gameByKey, "v3");
        const v4ByGid = matchToSquiggle(v4Result.matches, gameByKey, "v4");
        const odByGid = matchToSquiggle(odResult.matches, gameByKey, "od");

        // Covered = games where ALL three models have predictions
        const covered = new Set(
          [...v3ByGid.keys()].filter((gid) => v4ByGid.has(gid) && odByGid.has(gid)),
        );

        if (covered.size < games.length) {
          console.log(
            `WARNING: results lag the field by ${games.length - covered.size} completed game(s)` +
              ` — scoring the paired ${covered.size}; re-run without --no-cache for full coverage`,
          );
        }

        const coveredGames = games.filter((g) => covered.has(g.id));
        const n = coveredGames.length;
        if (n === 0) {
          console.error("Error: no completed games in covered set. Has the season started?");
          process.exit(1);
        }

        // --- Step 4: compute tips + MAE for our models ---
        const v3Tips = oursCompTips(v3ByGid, covered, gameById);
        const v4Tips = oursCompTips(v4ByGid, covered, gameById);
        const odTips = oursCompTips(odByGid, covered, gameById);
        const v3Mae = oursMae(v3ByGid, covered, gameById);
        const v4Mae = oursMae(v4ByGid, covered, gameById);
        const odMae = oursMae(odByGid, covered, gameById);

        // --- Step 5: field source stats ---
        type SrcStats = { n: number; tips: number; errSum: number; errN: number };
        const src = new Map<string, SrcStats>();
        const puntersByGid = new Map<number, SquiggleTip>();

        for (const t of tips) {
          if (!covered.has(t.gameid)) continue;
          let s = src.get(t.source);
          if (s === undefined) {
            s = { n: 0, tips: 0, errSum: 0, errN: 0 };
            src.set(t.source, s);
          }
          s.n++;
          s.tips += t.correct;
          if (t.err !== null) {
            s.errSum += Math.abs(t.err);
            s.errN++;
          }
          if (t.source === "Punters") {
            puntersByGid.set(t.gameid, t);
          }
        }

        // Full-coverage sources only (covered all n games)
        const fieldEntries: RankEntry[] = [];
        for (const [name, s] of src) {
          if (s.n === n) {
            fieldEntries.push({
              name,
              tips: s.tips,
              mae: s.errN > 0 ? s.errSum / s.errN : null,
            });
          }
        }
        const fieldN = fieldEntries.length;

        // --- Step 6: build rank table (field + our three models) ---
        const v3Entry: RankEntry = { name: "Tipper v3", tips: v3Tips, mae: v3Mae };
        const v4Entry: RankEntry = { name: "v4-shadow", tips: v4Tips, mae: v4Mae };
        const odEntry: RankEntry = { name: "OD-shadow", tips: odTips, mae: odMae };
        const shadowPlusField = [...fieldEntries, v4Entry, odEntry];
        const allEntries: RankEntry[] = [...fieldEntries, v3Entry, v4Entry, odEntry];
        const sortedTable = sortRankTable(allEntries);

        const ours = new Set(["Tipper v3", "v4-shadow", "OD-shadow"]);

        // compRank ranks each model among the combined field (field + all three models)
        const v3Rank = compRank(v3Entry, shadowPlusField);
        const v4Rank = compRank(v4Entry, [...fieldEntries, v3Entry, odEntry]);
        const odRank = compRank(odEntry, [...fieldEntries, v3Entry, v4Entry]);
        const [leader] = sortedTable;

        // --- Section 1: comp rank table ---
        console.log(
          `\n=== ${season} comp standing (${n} completed games, ` +
            `${fieldN} full-coverage sources + tipper) — scored on TIPS ===`,
        );
        for (let i = 0; i < sortedTable.length; i++) {
          const row = sortedTable[i];
          if (row === undefined) continue;
          const rank = i + 1;
          // Show top 5, our models, and last row
          if (rank > 5 && !ours.has(row.name) && rank !== sortedTable.length) continue;
          const pad = ours.has(row.name) ? ">>" : "  ";
          const maeStr = row.mae !== null ? `  MAE ${row.mae.toFixed(2)}` : "";
          console.log(
            `${pad}${String(rank).padStart(3)}  ${row.name.padEnd(24)} ${String(row.tips).padStart(4)} ` +
              `${((row.tips / n) * 100).toFixed(1).padStart(5)}%${maeStr}`,
          );
        }

        // --- Step 7: close band ---
        // Close band defined by v3's predicted margin (<12) and non-draw actual outcome
        const closeGids: number[] = [];
        for (const gid of covered) {
          const m = v3ByGid.get(gid);
          const g = gameById.get(gid);
          if (m === undefined || g === undefined) continue;
          if (Math.abs(m.predictedMargin) < 12 && g.hscore !== g.ascore) {
            closeGids.push(gid);
          }
        }
        const closeN = closeGids.length;

        // v3: use closeBandSign directly on v3's predictions (same band by definition)
        const { correct: closeV3 } = closeBandSign(
          closeGids
            .map((gid) => v3ByGid.get(gid))
            .filter((m): m is MatchPrediction => m !== undefined),
          12,
        );

        // v4/OD: use the pre-computed closeGids (v3-defined band), check their direction
        const { correct: closeV4 } = closeBandSignInBand(
          closeGids,
          (gid) => {
            const m = v4ByGid.get(gid);
            return m !== undefined ? m.predictedMargin >= 0 : null;
          },
          gameById,
        );
        const { correct: closeOD } = closeBandSignInBand(
          closeGids,
          (gid) => {
            const m = odByGid.get(gid);
            return m !== undefined ? m.predictedMargin >= 0 : null;
          },
          gameById,
        );

        // Punters: hconfidence >= 50 means home favoured
        const { correct: closePun, total: closePunN } = closeBandSignInBand(
          closeGids,
          (gid) => {
            const t = puntersByGid.get(gid);
            if (t === undefined || t.hconfidence === null) return null;
            return t.hconfidence >= 50;
          },
          gameById,
        );

        // Field mean: average correct-fraction across all sources for close games
        const tipsByGidArr = new Map<number, number[]>();
        for (const t of tips) {
          if (!covered.has(t.gameid)) continue;
          const arr = tipsByGidArr.get(t.gameid);
          if (arr !== undefined) {
            arr.push(t.correct);
          } else {
            tipsByGidArr.set(t.gameid, [t.correct]);
          }
        }
        const closeFieldFracs = closeGids
          .map((gid) => tipsByGidArr.get(gid))
          .filter((arr): arr is number[] => arr !== undefined && arr.length > 0)
          .map((arr) => arr.reduce((a, b) => a + b, 0) / arr.length);
        const closeFieldPct =
          closeFieldFracs.length > 0
            ? closeFieldFracs.reduce((a, b) => a + b, 0) / closeFieldFracs.length
            : 0;

        // --- Section 2: close band output ---
        console.log(`\n=== close band: |v3 pred margin| < 12, non-draw (n=${closeN}) ===`);
        if (closeN === 0) {
          console.log("  (none)");
        } else {
          console.log(
            `  v3       ${closeV3}/${closeN} (${((closeV3 / closeN) * 100).toFixed(1)}%)`,
          );
          console.log(
            `  v4       ${closeV4}/${closeN} (${((closeV4 / closeN) * 100).toFixed(1)}%)`,
          );
          console.log(
            `  OD       ${closeOD}/${closeN} (${((closeOD / closeN) * 100).toFixed(1)}%)`,
          );
          if (closePunN > 0) {
            console.log(
              `  Punters  ${closePun}/${closePunN} (${((closePun / closePunN) * 100).toFixed(1)}%)`,
            );
          } else {
            console.log("  Punters  (no coverage)");
          }
          console.log(
            `  field    ${(closeFieldPct * 100).toFixed(1)}% (mean correct across sources)`,
          );
        }

        // --- Step 8: market gap ---
        const pairedGids = [...covered].filter((gid) => puntersByGid.has(gid));
        let punTips = 0;
        let v3TipsPaired = 0;
        for (const gid of pairedGids) {
          const g = gameById.get(gid);
          if (g === undefined) continue;
          const actual = g.hscore - g.ascore;

          const pun = puntersByGid.get(gid);
          const punConf = pun?.hconfidence ?? 50;
          const punMargin = punConf >= 50 ? 1 : -1;
          if (compTip(punMargin, actual)) punTips++;

          const v3m = v3ByGid.get(gid);
          if (v3m !== undefined && compTip(v3m.predictedMargin, actual)) v3TipsPaired++;
        }
        const { gap: mktGap, alert } = marketGap(v3TipsPaired, punTips);

        // --- Section 3: market column ---
        console.log("\n=== market column: v3 vs Punters (source 5 ≈ closing odds, T34) ===");
        console.log(
          `  paired games ${pairedGids.length}  v3 ${v3TipsPaired}  Punters ${punTips}  ` +
            `gap ${mktGap >= 0 ? "+" : ""}${mktGap} (alert at ±3)`,
        );

        // --- Optional log ---
        if (opts.log) {
          const logRow: Record<string, string | number> = {
            run_date: new Date().toISOString().slice(0, 10),
            games_complete: n,
            v3_tips: v3Tips,
            v3_rank: v3Rank,
            field_n: fieldN,
            leader: leader?.name ?? "",
            leader_tips: leader?.tips ?? 0,
            v4_tips: v4Tips,
            v4_rank: v4Rank,
            od_tips: odTips,
            od_rank: odRank,
            punters_tips: punTips,
            market_gap: mktGap,
            close_n: closeN,
            close_v3: closeV3,
            close_v4: closeV4,
            close_od: closeOD,
            close_punters: closePun,
            close_field_pct: closeFieldPct.toFixed(4),
            alert: Number(alert),
          };
          appendLogRow(logRow);
          console.log(
            `\nlogged: ${LOG_PATH} (${logRow.run_date}: v3 rank ${v3Rank}/${fieldN + 3}, ` +
              `${v3Tips}/${n} tips, market gap ${mktGap >= 0 ? "+" : ""}${mktGap})`,
          );
        }

        // --- Alert exit code ---
        if (alert) {
          const direction = mktGap > 0 ? "ahead of" : "behind";
          console.log(
            `\n*** ALERT: v3 is ${Math.abs(mktGap)} tips ${direction} the market season-to-date ` +
              `(threshold ±3) — investigate per HANDOFF A3 ***`,
          );
          process.exit(2);
        }
      } catch (error) {
        const code = monitorFailureCode(error);
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[monitor] exit ${code}: ${message}`);
        process.exit(code);
      }
    },
  );
