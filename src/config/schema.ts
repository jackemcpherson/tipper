/**
 * Zod schemas for tipper configuration and results.
 *
 * Config schema defines all tuneable model parameters. Results schema
 * defines the shape of backtest output. Both are validated at load time.
 */

import { z } from "zod";

export const ConfigSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  schema_version: z.literal(1),
  notes: z.string().optional(),

  elo: z.object({
    k: z.number().positive(),
    initial_rating: z.number(),
    home_advantage: z.number(),
    regression_to_mean: z.number().min(0).max(1),
    mov_multiplier: z.enum(["538_log", "none"]),
    k_context_sensitivity: z.number().nonnegative().default(0),
    k_context_window: z.number().int().positive().default(8),
    home_advantage_source: z.enum(["static", "per_venue"]).default("static"),
    venue_ha: z.record(z.string(), z.number()).optional(),
    // Weight of the PAV-implied team rating in the season-boundary regression
    // target: target = 1500 + w × (pav_implied − league_mean). Absent means 0
    // (regress to 1500). Optional (not defaulted): the hash covers the parsed
    // config, so a .default() would invalidate every existing config's hash.
    regression_pav_target_weight: z.number().min(0).max(1).optional(),
  }),

  pav: z.object({
    computation: z.literal("round_by_round_cumulative"),
    prior_weight_k: z.number().nonnegative(),
    prior_source: z.enum(["previous_season_final"]),
    missing_player_default: z.number(),
    // Optional (not defaulted): the hash covers the parsed config, so a
    // .default() here would change every existing config's hash and
    // invalidate their results files. Absent means 0 (off).
    opponent_adjustment_alpha: z.number().min(0).optional(),
    include: z.enum([
      "named_lineup_excl_emerg",
      "named_lineup_incl_emerg",
      "actually_played",
      "starting_18_only",
    ]),
  }),

  blend: z.object({
    weight_elo: z.number().min(0).max(1),
    pav_calibration_slope: z.number(),
    // Optional per-zone slopes replace pav_calibration_slope when present.
    // Optional (not defaulted) to keep existing config hashes stable.
    pav_zone_slopes: z.object({ off: z.number(), mid: z.number(), def: z.number() }).optional(),
    where: z.literal("team_rating"),
  }),

  output: z.object({
    margin_per_rating_point: z.number(),
    sigma: z.number().positive(),
    // Rating points added to the home side at prediction time. Distinct from
    // elo.home_advantage, which only shapes the update's expected result —
    // without this the predicted margin contains no home advantage at all.
    // Optional (not defaulted) to keep existing config hashes stable.
    prediction_home_advantage: z.number().optional(),
  }),

  backtest: z.object({
    train_seasons: z.array(z.number()),
    test_seasons: z.array(z.number()),
    walk_forward: z.literal(true),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

export const CurrentPointerSchema = z.object({
  config_id: z.string(),
  promoted_at: z.string(),
  promoted_from: z.string().optional(),
  promotion_reason: z.string().min(1),
});

export type CurrentPointer = z.infer<typeof CurrentPointerSchema>;

export const OverallMetricsSchema = z.object({
  matches: z.number(),
  tips: z.number(),
  tip_pct: z.number(),
  mae_margin: z.number(),
  rmse_margin: z.number(),
  log_loss_bits: z.number(),
  brier: z.number(),
});

export const BacktestResultsSchema = z.object({
  config_id: z.string(),
  config_hash: z.string(),
  ran_at: z.string(),
  data_through: z.string(),
  scope: z.object({
    seasons: z.array(z.number()),
    rounds: z.array(z.number()).optional(),
    teams: z.array(z.string()).optional(),
  }),

  overall: OverallMetricsSchema,
  by_season: z.record(z.string(), OverallMetricsSchema),
  by_round: z.array(z.object({ round_number: z.number() }).merge(OverallMetricsSchema)).optional(),

  calibration: z.array(
    z.object({
      bucket: z.string(),
      predicted: z.number(),
      actual: z.number(),
      n: z.number(),
    }),
  ),

  matches: z.array(z.unknown()),
});

export type BacktestResultsFile = z.infer<typeof BacktestResultsSchema>;
