/**
 * Row types matching the afl-stats D1 schema.
 *
 * These types represent the raw rows returned by D1 queries.
 * Column names use snake_case to match the database schema.
 */

export interface SeasonRow {
  readonly id: number;
  readonly competition_id: number;
  readonly year: number;
}

export interface TeamRow {
  readonly id: number;
  readonly name: string;
  readonly abbreviation: string;
  readonly competition_id: number;
}

export interface VenueRow {
  readonly id: number;
  readonly name: string;
}

export interface MatchRow {
  readonly id: number;
  readonly season_id: number;
  readonly round: string;
  readonly round_number: number;
  readonly round_type: string;
  readonly date: string;
  readonly local_time: string | null;
  readonly venue_id: number;
  readonly home_team_id: number;
  readonly away_team_id: number;
  readonly home_goals: number | null;
  readonly home_behinds: number | null;
  readonly home_points: number | null;
  readonly away_goals: number | null;
  readonly away_behinds: number | null;
  readonly away_points: number | null;
  readonly margin: number | null;
  readonly attendance: number | null;
  readonly weather_temp_c: number | null;
  readonly weather_type: string | null;
  readonly external_afl_id: string | null;
}

export interface PlayerMatchStatsRow {
  readonly id: number;
  readonly match_id: number;
  readonly player_id: number;
  readonly team_id: number;
  readonly guernsey_number: number | null;
  readonly player_position: string | null;
  readonly time_on_ground_pct: number | null;
  readonly kicks: number | null;
  readonly handballs: number | null;
  readonly disposals: number | null;
  readonly marks: number | null;
  readonly tackles: number | null;
  readonly one_percenters: number | null;
  readonly contested_possessions: number | null;
  readonly goals: number | null;
  readonly behinds: number | null;
  readonly goal_assists: number | null;
  readonly marks_inside_fifty: number | null;
  readonly free_kicks_for: number | null;
  readonly free_kicks_against: number | null;
  readonly hitouts: number | null;
  readonly inside_fifties: number | null;
  readonly rebounds: number | null;
  readonly clearances: number | null;
  readonly metres_gained: number | null;
}

export interface MatchLineupRow {
  readonly id: number;
  readonly match_id: number;
  readonly player_id: number;
  readonly team_id: number;
  readonly guernsey_number: number | null;
  readonly position: string | null;
  readonly is_emergency: number;
  readonly is_substitute: number;
}

export interface PlayerSeasonPavRow {
  readonly id: number;
  readonly player_id: number;
  readonly season_id: number;
  readonly team_id: number;
  readonly off_pav: number | null;
  readonly mid_pav: number | null;
  readonly def_pav: number | null;
  readonly total_pav: number | null;
}

export interface PlayerRow {
  readonly id: number;
  readonly first_name: string;
  readonly surname: string;
}
