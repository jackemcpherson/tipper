/**
 * Separate attacking and defensive team ratings in scoreboard points.
 *
 * Expected scores follow the published Wheelo structure: a team scores the
 * competition average plus its attack minus the opponent's defence, and the
 * venue effect splits evenly between the two expected scores. Each rating moves
 * by a fixed fraction of the difference between the adjusted and expected
 * score, so a defence rating falls when the opponent outscores expectation.
 */
export interface TeamRatingParams {
  /** Fraction of a scoring surprise carried into the ratings. */
  readonly k: number;
  /** Fraction of each rating removed at a season boundary. */
  readonly regression: number;
  /** Matches over which the competition average score loses half its weight. */
  readonly meanHalfLifeMatches: number;
}
export const DEFAULT_TEAM_RATING: TeamRatingParams = Object.freeze({
  k: 0.08,
  regression: 0.3,
  meanHalfLifeMatches: 100,
});
/** Competition average team score assumed before any evidence. */
export const INITIAL_MEAN_SCORE = 85;

export interface ExpectedScores {
  readonly home: number;
  readonly away: number;
}
export interface TeamRating {
  readonly attack: number;
  readonly defence: number;
}

export class TeamRatings {
  private readonly attack = new Map<number, number>();
  private readonly defence = new Map<number, number>();
  private meanScore = INITIAL_MEAN_SCORE;
  private readonly decay: number;

  constructor(private readonly params: TeamRatingParams = DEFAULT_TEAM_RATING) {
    this.decay = 0.5 ** (1 / params.meanHalfLifeMatches);
  }

  rating(team: number): TeamRating {
    return { attack: this.attack.get(team) ?? 0, defence: this.defence.get(team) ?? 0 };
  }

  mean(): number {
    return this.meanScore;
  }

  expected(home: number, away: number, venueEffect: number): ExpectedScores {
    const h = this.rating(home),
      a = this.rating(away);
    return {
      home: this.meanScore + h.attack - a.defence + venueEffect / 2,
      away: this.meanScore + a.attack - h.defence - venueEffect / 2,
    };
  }

  /** Rating-only expected margin, before player and venue components. */
  margin(home: number, away: number): number {
    const h = this.rating(home),
      a = this.rating(away);
    return h.attack + h.defence - a.attack - a.defence;
  }

  /** Move ratings toward the adjusted scores. `actual` scores update the competition average. */
  update(
    home: number,
    away: number,
    expected: ExpectedScores,
    adjusted: ExpectedScores,
    actual: ExpectedScores,
  ): void {
    const k = this.params.k;
    const homeSurprise = adjusted.home - expected.home;
    const awaySurprise = adjusted.away - expected.away;
    const h = this.rating(home),
      a = this.rating(away);
    this.attack.set(home, h.attack + k * homeSurprise);
    this.defence.set(away, a.defence - k * homeSurprise);
    this.attack.set(away, a.attack + k * awaySurprise);
    this.defence.set(home, h.defence - k * awaySurprise);
    const weight = 1 - this.decay;
    this.meanScore += weight * (actual.home - this.meanScore);
    this.meanScore += weight * (actual.away - this.meanScore);
  }

  newSeason(): void {
    const keep = 1 - this.params.regression;
    for (const [team, value] of this.attack) this.attack.set(team, value * keep);
    for (const [team, value] of this.defence) this.defence.set(team, value * keep);
  }

  /** Every rated team, for inspection. */
  snapshot(): Map<number, TeamRating> {
    const teams = new Set([...this.attack.keys(), ...this.defence.keys()]);
    return new Map([...teams].map((team) => [team, this.rating(team)]));
  }
}
