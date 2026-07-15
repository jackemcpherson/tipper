// GENERATED FILE — do not edit by hand.
// Produced by `bun run bake-config` from configs/_current.json.
// Regenerate and commit after every config promotion; this committed
// snapshot is what ships in the Worker artifact (tipper#30).

import { type Config, ConfigSchema } from "../config/schema.js";

/** Promoted config id (configs/_current.json) at bake time. */
export const BAKED_CONFIG_ID = "predha-080";

/** Content hash (computeConfigHash) of the baked config. */
export const BAKED_CONFIG_HASH = "2641f46fd257f574b8a7eccc5fa26d67e0ec7e8b39ea451c095469480a523b27";

const RAW_CONFIG =
  '{"id":"predha-080","schema_version":1,"notes":"Task 20: prediction-side home advantage, 80 rating points (5.6 margin pts).","elo":{"k":25,"initial_rating":1500,"home_advantage":160,"regression_to_mean":0.1,"mov_multiplier":"538_log","k_context_sensitivity":0,"k_context_window":8,"home_advantage_source":"static"},"pav":{"computation":"round_by_round_cumulative","prior_weight_k":15,"prior_source":"previous_season_final","missing_player_default":5,"include":"named_lineup_excl_emerg"},"blend":{"weight_elo":0.6,"pav_calibration_slope":6.986,"where":"team_rating"},"output":{"margin_per_rating_point":0.07,"sigma":36,"prediction_home_advantage":80},"backtest":{"train_seasons":[2020],"test_seasons":[2021,2022,2023,2024,2025],"walk_forward":true}}';

/** The promoted model config, validated at Worker cold start. */
export const BAKED_CONFIG: Config = ConfigSchema.parse(JSON.parse(RAW_CONFIG));
