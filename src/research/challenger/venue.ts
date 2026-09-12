import type { Match, Reference, Venue } from "../data.js";

/**
 * Venue effect in points, positive for the designated home team.
 *
 * Three explicit terms: a constant home advantage, a travel term from each
 * club's home base to the venue, and a venue-experience term from matches each
 * club played at the ground in the previous five seasons. There is no
 * per-venue residual bonus: earlier Tipper experiments found that those did
 * not transfer between seasons.
 */
export interface VenueParams {
  /** Constant advantage for the designated home team. */
  readonly homeAdvantage: number;
  /** Points per unit of the travel difference `travel_h^w - travel_a^w`. */
  readonly travelK: number;
  readonly travelExponent: number;
  /** Points per unit of the experience difference `(n_h + c)^w - (n_a + c)^w`. */
  readonly experienceK: number;
  readonly experienceExponent: number;
  readonly experienceOffset: number;
  /** Kilometres from a club's base within which a ground counts as its home state. */
  readonly homeStateKm: number;
}
export const DEFAULT_VENUE: VenueParams = Object.freeze({
  homeAdvantage: 8,
  travelK: 0,
  travelExponent: 0.5,
  experienceK: 0,
  experienceExponent: 0.5,
  experienceOffset: 1,
  homeStateKm: 300,
});

/** Club home bases: the ground each club is based at. */
const HOME_GROUND: Readonly<Record<string, string>> = {
  Adelaide: "Adelaide Oval",
  "Brisbane Lions": "Gabba",
  Carlton: "MCG",
  Collingwood: "MCG",
  Essendon: "MCG",
  Fitzroy: "MCG",
  Fremantle: "Perth Stadium",
  Geelong: "Kardinia Park",
  "Gold Coast": "Carrara",
  "GWS Giants": "Sydney Showground",
  Hawthorn: "MCG",
  Melbourne: "MCG",
  "North Melbourne": "Marvel Stadium",
  "Port Adelaide": "Adelaide Oval",
  Richmond: "MCG",
  "St Kilda": "Marvel Stadium",
  Sydney: "SCG",
  "West Coast": "Perth Stadium",
  "Western Bulldogs": "Marvel Stadium",
};

export interface Coordinates {
  readonly latitude: number;
  readonly longitude: number;
}

/** Great-circle distance in kilometres. */
export function haversineKm(a: Coordinates, b: Coordinates): number {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLon = (b.longitude - a.longitude) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export interface VenueEffect {
  readonly homeAdvantage: number;
  readonly travel: number;
  readonly experience: number;
  readonly total: number;
  readonly homeTravelKm: number;
  readonly awayTravelKm: number;
  readonly homeExperience: number;
  readonly awayExperience: number;
}

const FIVE_SEASONS = 5;

export class VenueModel {
  private readonly venues: Map<number, Venue>;
  private readonly bases = new Map<number, Coordinates>();
  /** Per team, the (year, canonical venue) of every recorded match. */
  private readonly played = new Map<number, { year: number; venue: number }[]>();

  constructor(
    reference: Reference,
    private readonly params: VenueParams = DEFAULT_VENUE,
  ) {
    this.venues = new Map(reference.venues.map((v) => [v.id, v]));
    const byName = new Map(reference.venues.map((v) => [v.name, v]));
    for (const team of reference.teams) {
      const ground = byName.get(HOME_GROUND[team.name] ?? "");
      if (ground?.latitude != null && ground.longitude != null)
        this.bases.set(team.id, { latitude: ground.latitude, longitude: ground.longitude });
    }
  }

  private canonical(venueId: number | null): number | null {
    const venue = venueId === null ? undefined : this.venues.get(venueId);
    return venue ? (venue.canonical_venue_id ?? venue.id) : null;
  }

  travelKm(team: number, venueId: number | null): number {
    const base = this.bases.get(team);
    const venue = venueId === null ? undefined : this.venues.get(venueId);
    if (!base || venue?.latitude == null || venue.longitude == null) return 0;
    return haversineKm(base, { latitude: venue.latitude, longitude: venue.longitude });
  }

  experience(team: number, venueId: number | null, year: number): number {
    const canonical = this.canonical(venueId);
    if (canonical === null) return 0;
    return (this.played.get(team) ?? []).filter(
      (p) => p.venue === canonical && p.year < year && p.year >= year - FIVE_SEASONS,
    ).length;
  }

  /** A Grand Final only carries home advantage when the designated home club is in its home state. */
  effect(match: Match): VenueEffect {
    const p = this.params;
    const homeTravelKm = this.travelKm(match.home_team_id, match.venue_id);
    const awayTravelKm = this.travelKm(match.away_team_id, match.venue_id);
    const grandFinal = match.round === "Grand Final";
    const homeAdvantage = grandFinal && homeTravelKm > p.homeStateKm ? 0 : p.homeAdvantage;
    const travel =
      p.travelK * (homeTravelKm ** p.travelExponent - awayTravelKm ** p.travelExponent);
    const homeExperience = this.experience(match.home_team_id, match.venue_id, match.year);
    const awayExperience = this.experience(match.away_team_id, match.venue_id, match.year);
    const experience =
      p.experienceK *
      ((homeExperience + p.experienceOffset) ** p.experienceExponent -
        (awayExperience + p.experienceOffset) ** p.experienceExponent);
    return {
      homeAdvantage,
      travel: -travel,
      experience,
      total: homeAdvantage - travel + experience,
      homeTravelKm,
      awayTravelKm,
      homeExperience,
      awayExperience,
    };
  }

  record(match: Match): void {
    const venue = this.canonical(match.venue_id);
    if (venue === null) return;
    for (const team of [match.home_team_id, match.away_team_id])
      this.played.set(team, [...(this.played.get(team) ?? []), { year: match.year, venue }]);
  }
}
