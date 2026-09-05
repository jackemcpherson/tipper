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
    // Weight of the scoring-shot (luck-adjusted) margin in the Elo update:
    // margin = (1−w)×actual + w×(shot_diff × league pts/shot). Absent means 0
    // (actual margin only). Optional (not defaulted) to keep hashes stable.
    shot_margin_weight: z.number().min(0).max(1).optional(),
    points_residual_k: z.number().positive().optional(),
    finals_k_multiplier: z.number().positive().optional(),
    // Task 36 (D2): offence/defence split ratings. Parallel attack/concede
    // state in points space, mixed into the Elo slot at prediction weight
    // `weight`. Absent means off (bit-identical to v3). Optional (not
    // defaulted) to keep existing config hashes stable.
    od: z
      .object({
        weight: z.number().min(0).max(1),
        k: z.number().positive(),
        home_advantage_points: z.number(),
        initial_score: z.number().positive(),
        regression_to_mean: z.number().min(0).max(1),
        shot_score_weight: z.number().min(0).max(1).optional(),
        update_target: z.enum(["quarter", "minutes", "rushed"]).optional(),
        weather_luck_weight: z.number().nonnegative().optional(),
      })
      .optional(),
  }),

  pav: z.object({
    computation: z.literal("round_by_round_cumulative"),
    prior_weight_k: z.number().nonnegative(),
    prior_source: z.enum(["previous_season_final"]),
    missing_player_default: z.number(),
    league_average: z.literal("current_season").optional(),
    normalize_zone_pools: z.boolean().optional(),
    involvement_feature: z.enum(["involvement", "intercepts", "pressure", "shots"]).optional(),
    signal: z.literal("lineup_delta").optional(),
    position_weight: z.number().min(0).max(1).optional(),
    tog_weight: z.number().min(0).max(1).optional(),
    position_prior_k: z.number().nonnegative().optional(),
    // Optional (not defaulted): the hash covers the parsed config, so a
    // .default() here would change every existing config's hash and
    // invalidate their results files. Absent means 0 (off).
    opponent_adjustment_alpha: z.number().min(0).optional(),
    // Task 37 (T30 tipper-side): weight of the empirical player-age-curve adjustment
    // to the R1 prior. Multiplies each player's prior-season PAV by
    // (1 − w + w × age_transition_ratio[age_at_R1]) using a within-player ratio
    // table fitted on AFLM 1998-2014 (DOB-coverage-complete, no test-window leakage).
    // Absent = off (bit-identical to v3). Optional (not defaulted) to keep existing
    // config hashes stable.
    age_curve_weight: z.number().min(0).max(1).optional(),
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
    // Absence preserves the historical non-normal head and config identity.
    probability_model: z.enum(["legacy", "standard_normal"]).optional(),
    // Rating points added to the home side at prediction time. Distinct from
    // elo.home_advantage, which only shapes the update's expected result —
    // without this the predicted margin contains no home advantage at all.
    // Optional (not defaulted) to keep existing config hashes stable.
    prediction_home_advantage: z.number().optional(),
    prediction_ha_mode: z.enum(["neutral", "bucket", "geographic"]).optional(),
    prediction_ha_table: z.record(z.string(), z.number()).optional(),
    finals_home_advantage: z.number().optional(),
    // Walk-forward per-team performance offsets (margin points) applied at
    // prediction time and learned from residuals: offset = sum/(n+k), shrunk
    // toward 0; evidence decays by season_carry at each season boundary.
    // Optional (not defaulted) to keep existing config hashes stable.
    team_offset: z
      .object({
        k: z.number().positive(),
        season_carry: z.number().min(0).max(1),
        tail_threshold: z.number().nonnegative().optional(),
      })
      .optional(),
    // Task 38a: walk-forward per-venue prediction HGA (margin points). Adds
    // to the predicted margin alongside `prediction_home_advantage` (which
    // stays as the global static term — per-venue values are deltas).
    // `alpha` mixes venue mean with global mean (1=venue only, 0=global
    // only); `min_n` is the minimum completed matches at a venue before
    // its own estimate is used (else fall back to global mean). Optional
    // (not defaulted) to keep existing config hashes stable.
    prediction_home_advantage_per_venue: z
      .object({
        alpha: z.number().min(0).max(1),
        min_n: z.number().int().nonnegative(),
      })
      .optional(),
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
