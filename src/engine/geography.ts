/** AFLM geography used by fixed HA rules and the travel probe. */
export interface VenueGeo {
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
}

const TEAM_STATE: Record<string, string> = {
  Carlton: "VIC",
  Collingwood: "VIC",
  Essendon: "VIC",
  Geelong: "VIC",
  Hawthorn: "VIC",
  Melbourne: "VIC",
  "North Melbourne": "VIC",
  Richmond: "VIC",
  "St Kilda": "VIC",
  "Western Bulldogs": "VIC",
  Adelaide: "SA",
  "Port Adelaide": "SA",
  "West Coast": "WA",
  Fremantle: "WA",
  "Brisbane Lions": "QLD",
  "Gold Coast": "QLD",
  Sydney: "NSW",
  "GWS Giants": "NSW",
};
const VENUE_STATE: Record<string, string> = {
  MCG: "VIC",
  "Marvel Stadium": "VIC",
  "Kardinia Park": "VIC",
  "Mars Stadium": "VIC",
  "Adelaide Oval": "SA",
  "Football Park": "SA",
  "Norwood Oval": "SA",
  "Barossa Park": "SA",
  "Barossa Oval": "SA",
  "Summit Sports Park": "SA",
  "Perth Stadium": "WA",
  "Hands Oval": "WA",
  "Domain Stadium": "WA",
  Subiaco: "WA",
  Gabba: "QLD",
  Carrara: "QLD",
  "Cazalys Stadium": "QLD",
  "Riverway Stadium": "QLD",
  SCG: "NSW",
  "Sydney Showground": "NSW",
  "Accor Stadium": "NSW",
  "UTAS Stadium": "TAS",
  "Ninja Stadium": "TAS",
  "Blundstone Arena": "TAS",
  "Manuka Oval": "ACT",
  "TIO Stadium": "NT",
  "Traeger Park": "NT",
  "Jiangwan Stadium": "CHN",
  Wellington: "NZ",
  Blacktown: "NSW",
};
const HOME_GROUNDS: Record<string, string[]> = {
  Geelong: ["Kardinia Park"],
  Adelaide: ["Adelaide Oval", "Football Park"],
  "Port Adelaide": ["Adelaide Oval", "Football Park"],
  "West Coast": ["Perth Stadium", "Domain Stadium", "Subiaco"],
  Fremantle: ["Perth Stadium", "Hands Oval", "Domain Stadium", "Subiaco"],
  "Brisbane Lions": ["Gabba"],
  "Gold Coast": ["Carrara", "TIO Stadium", "Cazalys Stadium"],
  Sydney: ["SCG"],
  "GWS Giants": ["Sydney Showground", "Manuka Oval"],
  Hawthorn: ["UTAS Stadium"],
  "North Melbourne": ["Ninja Stadium", "Blundstone Arena"],
  Melbourne: ["Traeger Park"],
  "Western Bulldogs": ["Mars Stadium"],
};
const BASE_VENUE: Record<string, number> = {
  VIC: 18,
  SA: 27,
  WA: 12,
  QLD: 15,
  NSW: 1,
  Geelong: 5,
  "Gold Coast": 17,
};
const TIMEZONE_OFFSET: Record<string, number> = {
  "Australia/Melbourne": 10,
  "Australia/Sydney": 10,
  "Australia/Brisbane": 10,
  "Australia/Hobart": 10,
  "Australia/Adelaide": 9.5,
  "Australia/Darwin": 9.5,
  "Australia/Perth": 8,
  "Asia/Shanghai": 8,
  "Pacific/Auckland": 12,
};

export function greatCircleKm(a: VenueGeo, b: VenueGeo): number {
  if (a.latitude === null || a.longitude === null || b.latitude === null || b.longitude === null) {
    throw new Error("Missing venue coordinates");
  }
  const rad = Math.PI / 180;
  const h =
    Math.sin(((b.latitude - a.latitude) * rad) / 2) ** 2 +
    Math.cos(a.latitude * rad) *
      Math.cos(b.latitude * rad) *
      Math.sin(((b.longitude - a.longitude) * rad) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}

export function travelFeatures(
  home: string,
  away: string,
  venueId: number,
  venues: Map<number, VenueGeo>,
): { homeKm: number; awayKm: number; deltaKm: number; deltaTimezone: number } {
  const homeBase = venues.get(BASE_VENUE[home] ?? BASE_VENUE[TEAM_STATE[home] ?? ""] ?? -1);
  const awayBase = venues.get(BASE_VENUE[away] ?? BASE_VENUE[TEAM_STATE[away] ?? ""] ?? -1);
  const venue = venues.get(venueId);
  if (!homeBase || !awayBase || !venue)
    throw new Error(`Unmapped travel: ${home}/${away}/${venueId}`);
  const homeKm = greatCircleKm(homeBase, venue);
  const awayKm = greatCircleKm(awayBase, venue);
  const offset = (geo: VenueGeo): number => {
    const value = TIMEZONE_OFFSET[geo.timezone ?? ""];
    if (value === undefined) throw new Error(`Unknown timezone: ${geo.timezone}`);
    return value;
  };
  return {
    homeKm,
    awayKm,
    deltaKm: awayKm - homeKm,
    deltaTimezone: offset(venue) - offset(awayBase) - (offset(venue) - offset(homeBase)),
  };
}

/** The legacy Task 33 definition includes declared secondary home grounds. */
export function homeAdvantageBucket(
  home: string,
  away: string,
  venue: string,
): "neutral" | "derby" | "true_home" | "other" {
  const state = VENUE_STATE[venue];
  if (!state || !TEAM_STATE[home] || !TEAM_STATE[away])
    throw new Error(`Unmapped HA: ${home}/${away}/${venue}`);
  const neutral = !(HOME_GROUNDS[home] ?? []).includes(venue) && state !== TEAM_STATE[home];
  if (neutral) return "neutral";
  if (TEAM_STATE[home] === TEAM_STATE[away] && ["MCG", "Marvel Stadium"].includes(venue))
    return "derby";
  if (state === TEAM_STATE[home] && state !== TEAM_STATE[away]) return "true_home";
  return "other";
}
