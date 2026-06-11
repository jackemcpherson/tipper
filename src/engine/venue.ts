/**
 * Venue-specific home advantage derivation.
 *
 * Regresses actual margin against Elo differential per venue to
 * extract venue-specific home advantage intercepts.
 */

import type { MatchRow } from "../data/types.js";

export interface VenueHAResult {
  readonly venueId: number;
  readonly venueName: string;
  readonly haPoints: number;
  readonly haElo: number;
  readonly nMatches: number;
  readonly rSquared: number;
}

interface MatchWithElo {
  readonly match: MatchRow;
  readonly homeElo: number;
  readonly awayElo: number;
}

/**
 * Derive per-venue home advantage from historical match data.
 *
 * For each venue with >= minMatches, runs OLS regression:
 *   actual_margin = intercept + slope * (home_elo - away_elo) + error
 *
 * The intercept is the venue-specific home advantage in points.
 * Convert to Elo by dividing by marginPerRatingPoint.
 *
 * @param matchesWithElo - Matches paired with Elo ratings at match time.
 * @param venueNames - Venue ID → name mapping.
 * @param marginPerRatingPoint - Points per Elo rating point (e.g., 0.07).
 * @param minMatches - Minimum matches per venue to include (default 30).
 * @returns Per-venue HA results, sorted by nMatches descending.
 */
export function deriveVenueHA(
  matchesWithElo: readonly MatchWithElo[],
  venueNames: Map<number, string>,
  marginPerRatingPoint: number,
  minMatches = 30,
): VenueHAResult[] {
  // Group by venue
  const byVenue = new Map<number, MatchWithElo[]>();
  for (const m of matchesWithElo) {
    const venueId = m.match.venue_id;
    const existing = byVenue.get(venueId);
    if (existing) {
      existing.push(m);
    } else {
      byVenue.set(venueId, [m]);
    }
  }

  const results: VenueHAResult[] = [];

  for (const [venueId, matches] of byVenue) {
    // OLS: y = a + b*x where y = actual_margin, x = (homeElo - awayElo)
    // Null-score (unplayed) matches contribute nothing to the sums, so n
    // must count only the matches actually included — dividing by the
    // total would deflate every mean and bias the intercept toward zero.
    let n = 0;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    let sumYY = 0;

    for (const m of matches) {
      if (m.match.home_points === null || m.match.away_points === null) continue;
      const x = m.homeElo - m.awayElo;
      const y = m.match.home_points - m.match.away_points;
      n += 1;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
      sumYY += y * y;
    }

    if (n < minMatches || n === 0) continue;

    const meanX = sumX / n;
    const meanY = sumY / n;
    const sxx = sumXX - n * meanX * meanX;
    const sxy = sumXY - n * meanX * meanY;
    const syy = sumYY - n * meanY * meanY;

    const slope = sxx > 0 ? sxy / sxx : 0;
    const intercept = meanY - slope * meanX;

    // R-squared
    const ssRes = syy - slope * sxy;
    const rSquared = syy > 0 ? 1 - ssRes / syy : 0;

    results.push({
      venueId,
      venueName: venueNames.get(venueId) ?? `Venue ${venueId}`,
      haPoints: intercept,
      haElo: marginPerRatingPoint > 0 ? intercept / marginPerRatingPoint : 0,
      nMatches: n,
      rSquared: Math.max(0, rSquared),
    });
  }

  return results.sort((a, b) => b.nMatches - a.nMatches);
}
