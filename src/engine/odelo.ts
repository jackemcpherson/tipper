/**
 * Task 36 (D2): offence/defence split ratings.
 *
 * Parallel attack/concede state in points space. Each team carries an
 * expected-points-scored (attack) and expected-points-conceded (concede)
 * estimate; these update on the score residual after each completed match
 * and mix into the Elo slot of the blend at prediction time as an
 * Elo-scale rating implied by (A − C) / 2.
 *
 * Distinct from scalar Elo:
 *  - update signal: actual scores (not just margin) → richer than Elo's
 *    win/loss + MOV, and side-symmetric (concede tracks defence).
 *  - cold start: known league average score (initial_score), not 1500.
 *  - regression: per-component toward the *current* league mean of state
 *    values, so era drift (rising offence) doesn't pull teams toward a
 *    stale anchor (unlike Elo's fixed 1500).
 *
 * Bit-inert when `config.elo.od` is absent.
 */

import type { Config } from "../config/schema.js";
import type { MatchRow } from "../data/types.js";
import { LEAGUE_POINTS_PER_SHOT } from "./elo.js";

/** Split rating state: team_id → expected points scored / conceded. */
export interface OdState {
  attack: Map<number, number>;
  concede: Map<number, number>;
}

export function createOdState(): OdState {
  return { attack: new Map(), concede: new Map() };
}

function getOrDefault(map: Map<number, number>, teamId: number, fallback: number): number {
  return map.get(teamId) ?? fallback;
}

/**
 * Expected match scores from the two teams' split states.
 *
 * E_home_scores = (A_home + C_away) / 2 + ha_points / 2
 * E_away_scores = (A_away + C_home) / 2 − ha_points / 2
 *
 * Both sides see the full home-advantage split in opposite directions, so
 * the implied margin gains exactly `home_advantage_points` while the implied
 * total is invariant to HA — desirable because HA is a margin effect.
 */
export function expectedScores(
  state: OdState,
  homeTeamId: number,
  awayTeamId: number,
  odConfig: NonNullable<Config["elo"]["od"]>,
): { home: number; away: number } {
  const initial = odConfig.initial_score;
  const attackHome = getOrDefault(state.attack, homeTeamId, initial);
  const attackAway = getOrDefault(state.attack, awayTeamId, initial);
  const concedeHome = getOrDefault(state.concede, homeTeamId, initial);
  const concedeAway = getOrDefault(state.concede, awayTeamId, initial);
  const haHalf = odConfig.home_advantage_points / 2;
  return {
    home: (attackHome + concedeAway) / 2 + haHalf,
    away: (attackAway + concedeHome) / 2 - haHalf,
  };
}

/** Optional luck adjustment: blend actual points with shots × league pts/shot. */
function computeSidePoints(
  points: number | null,
  goals: number | null,
  behinds: number | null,
  shotWeight: number,
): number | null {
  if (points === null) return null;
  if (shotWeight === 0 || goals === null || behinds === null) return points;
  return (1 - shotWeight) * points + shotWeight * (goals + behinds) * LEAGUE_POINTS_PER_SHOT;
}

/** Registered post-match control targets. Null coverage retains the observed margin. */
export function controlMargin(
  match: MatchRow,
  target: NonNullable<Config["elo"]["od"]>["update_target"],
): number {
  if (match.home_points === null || match.away_points === null) throw new Error("Missing scores");
  const actual = match.home_points - match.away_points;
  if (
    target === "rushed" &&
    match.home_rushed_behinds != null &&
    match.away_rushed_behinds != null
  ) {
    return actual - 0.5 * (match.home_rushed_behinds - match.away_rushed_behinds);
  }
  if (
    target === "minutes" &&
    match.home_minutes_in_front != null &&
    match.away_minutes_in_front != null
  ) {
    const control = Math.max(
      -36,
      Math.min(36, (36 * (match.home_minutes_in_front - match.away_minutes_in_front)) / 120),
    );
    return 0.5 * actual + 0.5 * control;
  }
  if (target === "quarter") {
    const quarters = [
      [match.home_q1_goals, match.home_q1_behinds, match.away_q1_goals, match.away_q1_behinds],
      [match.home_q2_goals, match.home_q2_behinds, match.away_q2_goals, match.away_q2_behinds],
      [match.home_q3_goals, match.home_q3_behinds, match.away_q3_goals, match.away_q3_behinds],
      [match.home_q4_goals, match.home_q4_behinds, match.away_q4_goals, match.away_q4_behinds],
    ];
    if (quarters.flat().some((value) => value == null)) return actual;
    const weighted = quarters.reduce(
      (sum, [hg, hb, ag, ab], index) =>
        sum + ((hg ?? 0) * 6 + (hb ?? 0) - (ag ?? 0) * 6 - (ab ?? 0)) * (index === 3 ? 0.5 : 1),
      0,
    );
    return 0.5 * actual + (0.5 * 4 * weighted) / 3.5;
  }
  return actual;
}

/**
 * Update split state after a completed match.
 *
 * For each side, residual r = (actual scored) − (expected scored). Each
 * residual updates both the scoring team's attack and the opposing team's
 * concede — they share evidence: home outscoring expectation means *either*
 * home attacked well *or* away defended poorly, attributed half-and-half
 * by the symmetric step size `k`.
 *
 * No MOV multiplier: residuals are already magnitude-proportional in points,
 * unlike scalar Elo's sign-only Bernoulli update.
 */
export function updateOd(
  state: OdState,
  match: MatchRow,
  odConfig: NonNullable<Config["elo"]["od"]>,
  finalsKMultiplier?: number,
): void {
  const shotWeight = odConfig.shot_score_weight ?? 0;
  const homePoints = computeSidePoints(
    match.home_points,
    match.home_goals,
    match.home_behinds,
    shotWeight,
  );
  const awayPoints = computeSidePoints(
    match.away_points,
    match.away_goals,
    match.away_behinds,
    shotWeight,
  );
  if (homePoints === null || awayPoints === null) {
    throw new Error(`Cannot update OD for match ${match.id}: missing scores`);
  }

  const expected = expectedScores(state, match.home_team_id, match.away_team_id, odConfig);
  const targetCorrection =
    odConfig.update_target === undefined
      ? 0
      : (controlMargin(match, odConfig.update_target) - (homePoints - awayPoints)) / 2;
  const rHome = homePoints + targetCorrection - expected.home;
  const rAway = awayPoints - targetCorrection - expected.away;
  const weatherGain =
    odConfig.weather_luck_weight === undefined
      ? 1
      : Math.max(0.5, 1 / (1 + odConfig.weather_luck_weight * (match.precip_surprise ?? 0)));
  const k =
    odConfig.k * (match.round_type !== "Regular" ? (finalsKMultiplier ?? 1) : 1) * weatherGain;
  const initial = odConfig.initial_score;

  state.attack.set(
    match.home_team_id,
    getOrDefault(state.attack, match.home_team_id, initial) + k * rHome,
  );
  state.concede.set(
    match.away_team_id,
    getOrDefault(state.concede, match.away_team_id, initial) + k * rHome,
  );
  state.attack.set(
    match.away_team_id,
    getOrDefault(state.attack, match.away_team_id, initial) + k * rAway,
  );
  state.concede.set(
    match.home_team_id,
    getOrDefault(state.concede, match.home_team_id, initial) + k * rAway,
  );
}

/**
 * Apply season-boundary regression to each component independently, toward
 * the *current* league mean of state values.
 *
 * Anchoring on the live mean (rather than `initial_score`) lets the system
 * track scoring-era drift — if average offence rises from 80 to 90 over a
 * decade, teams regress toward the era-appropriate centre. Teams with no
 * state are left unchanged.
 */
export function applyOdRegression(state: OdState, regressionFactor: number): void {
  regressMap(state.attack, regressionFactor);
  regressMap(state.concede, regressionFactor);
}

function regressMap(map: Map<number, number>, factor: number): void {
  if (map.size === 0 || factor === 0) return;
  let sum = 0;
  for (const value of map.values()) sum += value;
  const mean = sum / map.size;
  for (const [teamId, value] of map) {
    map.set(teamId, value + factor * (mean - value));
  }
}

/**
 * Elo-scale rating implied by a team's OD state.
 *
 * Pair-wise margin (ex-HA) between two teams in points equals
 *   ((A_i − C_i) − (A_j − C_j)) / 2.
 * `predictMargin` scales rating diffs by `margin_per_rating_point`, so the
 * implied Elo rating is `1500 + (A_i − C_i) / 2 / margin_per_rating_point`
 * — the two teams' rating-diff × `margin_per_rating_point` then reproduces
 * the OD pair-wise margin exactly.
 */
export function odImpliedRating(
  state: OdState,
  teamId: number,
  odConfig: NonNullable<Config["elo"]["od"]>,
  marginPerRatingPoint: number,
  initialRating: number,
): number {
  const attack = getOrDefault(state.attack, teamId, odConfig.initial_score);
  const concede = getOrDefault(state.concede, teamId, odConfig.initial_score);
  return initialRating + (attack - concede) / 2 / marginPerRatingPoint;
}
