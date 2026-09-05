/** Render frozen evidence into the report's generated tables and standalone HTML. */
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { computeConfigHash } from "../src/config/hash.js";
import { ConfigSchema } from "../src/config/schema.js";
import { readScores, type Score } from "./task40-statistics.js";

declare const Bun: { markdown: { html: (source: string) => string } };
const reportPath = "docs/task-40-adversarial-review-and-campaign.md";
const scores = readScores();
const statistics = JSON.parse(readFileSync("analysis/task40-statistics-results.json", "utf8")) as {
  holm: Record<string, { id: string; adjustedP: number }[]>;
};
const xmlEscape = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const number = (n: number, digits = 6) => (n > 0 ? "+" : "") + n.toFixed(digits);
const ci = (xs: readonly (number | undefined)[]) =>
  `[${xs.map((x) => number(x ?? NaN)).join(", ")}]`;

function verdict(s: Score): { label: string; reason: string } {
  if (s.id === "t40-weather")
    return {
      label: "BLOCKED",
      reason:
        "Limited run completed; no historical retained forecasts for a promotion-capable test.",
    };
  if (s.id === "t40-travel-probe")
    return {
      label: "KILL",
      reason: "Both Plan 008 GO interpretations fail the cross-era close-game direction check.",
    };
  if (s.id === "t40-cdf" || s.id.startsWith("t40-sigma"))
    return {
      label: "PARK",
      reason: "Probability-only change cannot improve the competition's winner picks.",
    };
  const m = s.modes.legacy;
  const failures = [];
  if (m.primary.ll >= 0) failures.push("non-improving primary LL");
  if (m.early.ll >= 0) failures.push("non-improving early LL");
  if (!m.gates.pooledTips) failures.push("pooled tip regression");
  if (!m.gates.recentTips) failures.push("recent tip regression");
  if (m.oos.tips < 0) failures.push("R14+ tip regression");
  if (!m.gates.consensus) failures.push("consensus-wrong guard");
  if (!m.gates.bias) failures.push("team-bias guard");
  if (failures.length) return { label: "KILL", reason: `${failures.join(", ")}.` };
  const failedGates = Object.entries(m.gates)
    .filter(([, pass]) => !pass)
    .map(([name]) => name);
  return {
    label: "PARK",
    reason: failedGates.length
      ? `Insufficient evidence under I: ${failedGates.join(", ")}. No corrected prospective validation.`
      : "Passes I. Fails the corrected-head magnitude/precision test and has no prospective validation.",
  };
}

function mechanism(id: string): [string, string, string] {
  if (id === "t40-pav-day-end")
    return ["Same-day scores", "Queue PAV to next day", "Available league totals"];
  if (id.startsWith("t40-od-shot"))
    return ["Completed scoring shots", "Mix OD score target", "Next-match rating gap"];
  if (id.startsWith("t40-shot"))
    return ["Completed scoring shots", "Mix Elo update margin", "Next-match rating gap"];
  if (id.startsWith("t40-offset"))
    return [
      "Past prediction residual",
      id.endsWith("tail") ? "Apply only beyond 24" : "Shrunk team correction",
      "Adjusted margin sign",
    ];
  if (id === "t40-venue-team")
    return ["Past venue residual", "Team x venue shrinkage", "Next visit correction"];
  if (id === "t40-venue-static")
    return ["2010-2019 fit only", "Fixed shrunk venue HA", "Prediction intercept"];
  if (id.includes("ha-") || id === "t40-venue-geo")
    return ["Pre-match venue context", "Change prediction HA", "Margin crosses zero?"];
  if (id.includes("reverse"))
    return ["Early-window grid", "Select k and RTM", "Confirm on primary"];
  if (id === "t40-od" || id === "t40-points")
    return ["Completed margin", "Residual gain 0.04", "Next team ordering"];
  if (id === "t40-derived")
    return ["2010-2014 variance", "Freeze gain and RTM", "Walk later seasons"];
  if (id === "t40-lineup-delta")
    return ["Current prior PAV", "Subtract typical lineup", "Ins/outs rating signal"];
  if (id === "t40-position") return ["Named positions", "Weight PAV zones", "Lineup rating gap"];
  if (id === "t40-tog")
    return ["Previous five TOGs", "Expected playing weight", "Effective lineup PAV"];
  if (id === "t40-position-prior")
    return ["Previous role cohort", "Shrink player prior", "Blended lineup PAV"];
  if (id.startsWith("t40-rich"))
    return ["Completed player stats", "Change HPN involvement", "Future lineup PAV"];
  if (id.startsWith("t40-age"))
    return ["DOB and prior PAV", "Age/zone prior scaling", "Early rating signal"];
  if (id === "t40-prior-k30")
    return ["Previous-season PAV", "Prior K rises to 30", "Slower prior decay"];
  if (id === "t40-rating-points")
    return ["Past rating-point means", "Redistribute roster PAV", "Selected lineup shares"];
  if (id.startsWith("t40-pav"))
    return ["Completed player stats", "Correct league/pools", "Next PAV calculation"];
  if (id === "t40-weather")
    return ["Forecast/observed rain", "Roof-aware update gain", "Next-match rating gap"];
  if (["t40-quarter", "t40-minutes", "t40-rushed"].includes(id))
    return ["Completed control stats", "Adjust OD margin target", "Next-match rating gap"];
  if (id.startsWith("t40-finals"))
    return ["Fixture is a final", "Change HA or gain", "Now/next rating gap"];
  if (id === "t40-travel-probe")
    return ["Venue/base coordinates", "Slope and close split", "Era-replication gate"];
  return ["Unchanged margin", "Change probability head", "Same winner sign"];
}

function mechanismFigure(s: Score): string {
  const steps = mechanism(s.id);
  return `<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="${xmlEscape(s.id)} mechanism"><title>${xmlEscape(s.id)} mechanism</title>${steps.map((step, i) => `<rect x="${10 + i * 222}" y="12" width="198" height="51" rx="6" class="box"/><text x="${109 + i * 222}" y="42" text-anchor="middle">${xmlEscape(step)}</text>${i < 2 ? `<path d="M${211 + i * 222} 37h17m-5-5 5 5-5 5" class="arrow"/>` : ""}`).join("")}<text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>`;
}

function resultFigure(s: Score): string {
  const m = s.modes.legacy;
  const windows = [m.primary, m.early, m.oos];
  const low = Math.min(-0.006, ...m.windowCi.map((v) => v.ll[0] ?? 0));
  const high = Math.max(0.002, ...m.windowCi.map((v) => v.ll[1] ?? 0));
  const span = high - low;
  const x = (n: number) => 160 + (450 * (n - low)) / span;
  return `<figure><svg viewBox="0 0 660 190" role="img" aria-label="${xmlEscape(s.id)} per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="${x(0)}" x2="${x(0)}" y1="20" y2="143" class="zero"/><line x1="${x(-0.005)}" x2="${x(-0.005)}" y1="20" y2="143" class="gate"/>${windows
    .map((w, i) => {
      const interval = m.windowCi[i]?.ll;
      assert(interval?.[0] !== undefined && interval[1] !== undefined);
      const y = 38 + i * 42;
      return `<text x="5" y="${y + 5}">${["Primary", "Early", "2026 R14+"][i]}</text><line x1="${x(interval[0])}" x2="${x(interval[1])}" y1="${y}" y2="${y}" class="interval"/><circle cx="${x(w.ll)}" cy="${y}" r="4" class="point"/><text x="645" y="${y - 10}" text-anchor="end" class="small">${number(w.ll)}; tips ${number(w.tips, 0)}</text>`;
    })
    .join(
      "",
    )}<text x="160" y="165" class="small">${number(low, 4)}</text><text x="610" y="165" text-anchor="end" class="small">${number(high, 4)}</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>`;
}

const baseConfig = ConfigSchema.parse(
  JSON.parse(readFileSync("configs/predha-080/config.json", "utf8")),
);
function changes(value: unknown, baseline: unknown, path = ""): string[] {
  if (JSON.stringify(value) === JSON.stringify(baseline)) return [];
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const b = baseline && typeof baseline === "object" ? (baseline as Record<string, unknown>) : {};
    return Object.entries(value).flatMap(([key, child]) =>
      ["id", "notes", "backtest"].includes(key)
        ? []
        : changes(child, b[key], path ? `${path}.${key}` : key),
    );
  }
  return [`${path}=${JSON.stringify(value)}`];
}

let generated =
  "## Candidate results\n\nEvery delta is candidate minus v3. Negative LL and positive tips improve the score.\nEach named variant was frozen before its first run. The original registration\nand commit history remain the authority for its hypothesis and kill rule.\n\n";
for (const s of scores) {
  const v = verdict(s);
  const m = s.modes.legacy;
  const c = s.modes.standard_normal;
  const config = ConfigSchema.parse(
    JSON.parse(readFileSync(`configs/${s.id}/config.json`, "utf8")),
  );
  generated += `### ${s.id}: ${v.label}\n\n${v.reason}\n\n`;
  generated += `Mechanism: ${mechanism(s.id).join(" → ")}.\n\n${mechanismFigure(s)}\n\n`;
  generated += `Exact parameter differences from v3:\n\n\`\`\`text\n${changes(config, baseConfig).join("\n") || "No prediction change; diagnostic replica."}\n\`\`\`\n\n`;
  generated += `Run: \`bun analysis/task40-campaign.ts --ids ${s.id}\`. Score all with\n\`bun analysis/task40-score.ts --out analysis/task40-score-replay.json\`.\nUse a new output path; result writers refuse overwrites. Windows and bars\nare I/C above, including primary below -0.005, early within 0.5-1.5 times\nits magnitude, negative historical CI and nonnegative required tip guards.\n\n`;
  generated +=
    "| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |\n| --- | ---: | ---: | ---: | ---: | ---: |\n";
  for (const [name, w] of [
    ["Primary 2021-2025", m.primary],
    ["Early 2016-2019", m.early],
    ["2026 R0-13, burned", s.burned],
    ["2026 R14+", m.oos],
    ["Full 2026", s.current],
  ] as const)
    generated += `| ${name} | ${w.n} | ${w.candidate.tips} | ${number(w.tips, 0)} | ${number(w.ll)} | ${number(w.closeTips, 0)} / ${w.closeN} |\n`;
  generated += `\n${resultFigure(s)}\n\n`;
  generated += `Historical pooled LL ${number(m.pooled.deltas.logLossBits.point)}, 95% CI ${ci(m.pooled.deltas.logLossBits.ci95)}.\nWith R14+ as a third stratum: ${number(m.extended.deltas.logLossBits.point)}, CI ${ci(m.extended.deltas.logLossBits.ci95)}.\nHistorical round-block CI ${ci(m.block.ci95)}.\n\n`;
  generated += `Correct normal head: historical pooled LL ${number(c.pooled.deltas.logLossBits.point)},\nCI ${ci(c.pooled.deltas.logLossBits.ci95)}. Round-block CI ${ci(c.block.ci95)}.\nHolm-adjusted round-sign p=${statistics.holm.standard_normal?.find((r) => r.id === s.id)?.adjustedP.toFixed(4)}.\nIncumbent numerical gates: ${m.incumbentPass ? "PASS" : "FAIL"}. Corrected numerical gates: ${c.correctedNumericalPass ? "PASS" : "FAIL"}. Prospective 2027 evidence: absent.\n\n`;
  generated += `Recent 2024-2026 tips ${number(s.recent.tips, 0)}. Consensus-wrong tips\n${number(s.consensus.tips, 0)} / ${s.consensus.n} paired games; primary ${number(s.consensusPrimary.tips, 0)} / ${s.consensusPrimary.n},\nfull 2026 ${number(s.consensus2026.tips, 0)} / ${s.consensus2026.n}, R14+ ${number(s.consensusOos.tips, 0)} / ${s.consensusOos.n}.\n\n`;
  const worst = [...s.teams, ...s.extendedTeams]
    .filter((r) => r.n >= 50)
    .sort((a, b) => b.worsening - a.worsening)[0];
  assert(worst);
  generated += `Largest eligible absolute team-bias worsening: ${xmlEscape(worst.name)},\n${number(worst.worsening, 3)} points at n=${worst.n}; allowed maximum +2.\nHistorical LL draw sensitivity: half-target ${number((m.primary.halfDrawLl * m.primary.n + m.early.halfDrawLl * m.early.n) / (m.primary.n + m.early.n))}.\nPrimary excluding draws ${number(m.primary.noDrawLl)}; early ${number(m.early.noDrawLl)}.\n\n`;
  if (s.incrementVsOd)
    generated += `Direct increment over plain OD, primary / early / full 2026:\nLL ${s.incrementVsOd.map((w) => number(w.ll)).join(" / ")};\ntips ${s.incrementVsOd.map((w) => number(w.tips, 0)).join(" / ")}.\n\n`;
  generated += "Evidence files, with effective config hashes:\n\n";
  for (const suffix of ["", "-early", "-2026"]) {
    const id = s.id + suffix;
    const cfg = ConfigSchema.parse(JSON.parse(readFileSync(`configs/${id}/config.json`, "utf8")));
    const hash = await computeConfigHash(cfg);
    generated += `- [${id} config](../configs/${id}/config.json), [full result ${hash.slice(0, 8)}](../configs/${id}/results-2026-09-05-${hash.slice(0, 8)}.json).\n`;
  }
  generated += "\n";
}

generated +=
  "## Appendix: complete team and venue residual tables\n\nAll means are actual minus predicted, oriented toward each team or the home side at each venue.\nThe n>=50, +2-point worsening guard applies to teams only. Small venue samples remain visible.\n\n";
for (const s of scores) {
  generated += `<details><summary>${s.id}: all team and venue biases</summary>\n\n| Group | n | V3 bias | Candidate bias | Absolute worsening |\n| --- | ---: | ---: | ---: | ---: |\n`;
  for (const [kind, rows] of [
    ["Historical team", s.teams],
    ["All-window team", s.extendedTeams],
    ["All-window venue", s.venues],
  ] as const)
    for (const r of rows)
      generated += `| ${kind}: ${r.name} | ${r.n} | ${number(r.baselineBias, 3)} | ${number(r.candidateBias, 3)} | ${number(r.worsening, 3)} |\n`;
  generated += "\n</details>\n\n";
}

let markdown = readFileSync(reportPath, "utf8")
  .replace(/<!-- TASK40 GENERATED START -->[\s\S]*?<!-- TASK40 GENERATED END -->/g, "")
  .trimEnd();
assert(markdown);
const familyFilter: Record<string, (id: string) => boolean> = {
  "t40-od": (id) => id === "t40-od",
  "t40-ha": (id) => id.startsWith("t40-ha-"),
  "t40-position": (id) => id === "t40-position",
  "t40-pav": (id) => id.startsWith("t40-pav-") && id !== "t40-pav-day-end",
  "t40-cdf": (id) => id === "t40-cdf" || id.startsWith("t40-sigma"),
  "t40-quarter": (id) => ["t40-quarter", "t40-minutes"].includes(id),
  "t40-age": (id) => id.startsWith("t40-age") || id === "t40-prior-k30",
};
markdown = markdown
  .split("\n")
  .map((line) => {
    if (!/^\| \d+ \|/.test(line)) return line;
    const cells = line.split("|");
    const prefix = cells[4]?.trim();
    if (!prefix) return line;
    const rows = scores.filter((r) => familyFilter[prefix]?.(r.id) ?? r.id.startsWith(prefix));
    if (!rows.length) return line;
    const verdicts = [...new Set(rows.map((r) => verdict(r).label))];
    cells[6] = ` ${rows.length} completed; ${rows.filter((r) => r.modes.legacy.incumbentPass).length} pass I `;
    cells[7] = ` ${verdicts.includes("BLOCKED") ? "BLOCKED, limited run complete" : verdicts.includes("PARK") ? "PARK" : "KILL"} `;
    return cells.join("|");
  })
  .join("\n");
const appendixAt = generated.indexOf("## Appendix: complete team and venue residual tables");
assert(appendixAt > 0);
const wrapped = (text: string) =>
  `\n\n<!-- TASK40 GENERATED START -->\n\n${text.trim()}\n<!-- TASK40 GENERATED END -->\n\n`;
markdown = markdown.replace(
  "## Methodology details",
  `${wrapped(generated.slice(0, appendixAt))}## Methodology details`,
);
markdown += wrapped(generated.slice(appendixAt));
markdown = `${markdown.trimEnd()}\n`;
writeFileSync(reportPath, markdown);
let body = Bun.markdown.html(markdown);
assert.equal((body.match(/class="mechanism"/g) ?? []).length, scores.length);
const css = `:root{color-scheme:light dark;--bg:#fafaf8;--fg:#202522;--muted:#555e59;--line:#ccd3cc;--panel:#f0f3ed;--accent:#006b5b;--gate:#a04e13}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}main{max-width:900px;margin:auto;padding:36px 24px 80px}h1{font-size:2rem;line-height:1.2}h2{margin-top:3rem;padding-top:1rem;border-top:1px solid var(--line)}h3{margin-top:2rem;scroll-margin-top:1rem}a{color:var(--accent);overflow-wrap:anywhere}p,li{max-width:80ch}table{display:block;overflow-x:auto;border-collapse:collapse;font-size:.83rem;margin:1.2rem 0;width:100%}th,td{text-align:left;vertical-align:top;border-bottom:1px solid var(--line);padding:7px 9px}th{background:var(--panel)}code{font-size:.86em;overflow-wrap:anywhere}pre{padding:14px;background:var(--panel);overflow-x:auto;border:1px solid var(--line);border-radius:5px;white-space:pre-wrap}figure{margin:20px 0;padding:10px;border:1px solid var(--line);border-radius:6px;background:var(--panel)}svg{display:block;width:100%;height:auto;color:var(--fg)}svg text{fill:currentColor;font:13px system-ui,sans-serif}svg .small{font-size:10px}svg .box{fill:var(--bg);stroke:var(--line)}svg .arrow{fill:none;stroke:var(--accent);stroke-width:2}svg .zero{stroke:var(--muted);stroke-width:1}svg .gate{stroke:var(--gate);stroke-width:1;stroke-dasharray:4 3}svg .interval{stroke:var(--accent);stroke-width:3}svg .point{fill:var(--accent)}figcaption{font-size:.8rem;color:var(--muted);margin-top:6px}summary{cursor:pointer;padding:10px 0;font-weight:600}details{border-bottom:1px solid var(--line)}@media(prefers-color-scheme:dark){:root{--bg:#141916;--fg:#e3e9e3;--muted:#b0beb3;--line:#3c4940;--panel:#1c251f;--accent:#76d8b9;--gate:#f4b66b}}@media(max-width:600px){main{padding:20px 12px}h1{font-size:1.65rem}table{font-size:.75rem}figure{padding:4px}}@media print{body{font-size:11px}main{max-width:none}figure,pre{break-inside:avoid}details{display:block}}`;
body = body.replace(
  /<h3>(t40-[^<]+)<\/h3>([\s\S]*?)(?=<h3|<h2|$)/g,
  (_match, title: string, content: string) =>
    `<details class="candidate" id="${title.split(":")[0]}"${title.startsWith("t40-od:") ? " open" : ""}><summary>${title}</summary>${content}</details>`,
);
const html = `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Task 40: Tipper adversarial campaign</title><style>${css}</style></head><body><main>${body}</main></body></html>\n`;
assert(!/<script\b|<link\b|<img\b/i.test(html));
writeFileSync("docs/task-40-report.html", html);
console.log(
  JSON.stringify({
    candidates: scores.length,
    figures: (html.match(/<svg /g) ?? []).length,
    htmlBytes: html.length,
    verdicts: Object.fromEntries(
      ["PARK", "KILL", "BLOCKED"].map((v) => [
        v,
        scores.filter((s) => verdict(s).label === v).length,
      ]),
    ),
  }),
);
