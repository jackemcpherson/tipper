/**
 * Accuracy-adjusted team scores.
 *
 * A team's adjusted score blends its actual score with the score it would have
 * produced from the same shots at an expected conversion rate. The expected
 * rate shrinks the team's season-to-date accuracy toward the competition rate.
 * Shots are goals plus behinds because rushed behinds are only recorded from
 * 2020, so the approximation is applied uniformly across seasons.
 */
export interface AccuracyParams {
  /** Weight on the actual score. One disables the adjustment. */
  readonly actualWeight: number;
  /** Shots of competition-rate evidence that anchor a team's season accuracy. */
  readonly teamShrinkShots: number;
  /** Matches over which the competition accuracy loses half its weight. */
  readonly leagueHalfLifeMatches: number;
}
export const DEFAULT_ACCURACY: AccuracyParams = Object.freeze({
  actualWeight: 0.5,
  teamShrinkShots: 100,
  leagueHalfLifeMatches: 200,
});
/** Competition rate assumed before any evidence: about half of all shots are goals. */
export const INITIAL_ACCURACY = 0.5;

export interface Scoreline {
  readonly goals: number;
  readonly behinds: number;
}

/** Points expected from `shots` at conversion rate `accuracy`. */
export function expectedPoints(shots: number, accuracy: number): number {
  return shots * (6 * accuracy + (1 - accuracy));
}

/** Blend the actual score with the expected-accuracy score. */
export function adjustedScore(
  score: Scoreline,
  expectedAccuracy: number,
  actualWeight: number,
): number {
  const actual = 6 * score.goals + score.behinds;
  const expected = expectedPoints(score.goals + score.behinds, expectedAccuracy);
  return actualWeight * actual + (1 - actualWeight) * expected;
}

/** Shrink a team's observed accuracy toward the competition rate. */
export function shrunkAccuracy(
  teamGoals: number,
  teamShots: number,
  leagueAccuracy: number,
  shrinkShots: number,
): number {
  return (teamGoals + shrinkShots * leagueAccuracy) / (teamShots + shrinkShots);
}

interface TeamAccuracy {
  goals: number;
  shots: number;
}

/** Chronological accuracy state: competition rate decays per match, team rates reset each season. */
export class AccuracyTracker {
  private leagueGoals = 0;
  private leagueShots = 0;
  private readonly decay: number;
  private readonly teams = new Map<number, TeamAccuracy>();

  constructor(private readonly params: AccuracyParams = DEFAULT_ACCURACY) {
    this.decay = 0.5 ** (1 / params.leagueHalfLifeMatches);
  }

  leagueAccuracy(): number {
    return this.leagueShots > 0 ? this.leagueGoals / this.leagueShots : INITIAL_ACCURACY;
  }

  expectedAccuracy(team: number): number {
    const t = this.teams.get(team) ?? { goals: 0, shots: 0 };
    return shrunkAccuracy(t.goals, t.shots, this.leagueAccuracy(), this.params.teamShrinkShots);
  }

  /** Adjusted score using the accuracy expected before the match was played. */
  adjusted(team: number, score: Scoreline): number {
    return adjustedScore(score, this.expectedAccuracy(team), this.params.actualWeight);
  }

  record(team: number, score: Scoreline): void {
    const t = this.teams.get(team) ?? { goals: 0, shots: 0 };
    t.goals += score.goals;
    t.shots += score.goals + score.behinds;
    this.teams.set(team, t);
    this.leagueGoals = this.leagueGoals * this.decay + score.goals;
    this.leagueShots = this.leagueShots * this.decay + score.goals + score.behinds;
  }

  newSeason(): void {
    this.teams.clear();
  }
}
