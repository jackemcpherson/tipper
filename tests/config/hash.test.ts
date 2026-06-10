import { describe, expect, it } from "vitest";
import { computeConfigHash, shortHash } from "../../src/config/hash.js";
import type { Config } from "../../src/config/schema.js";

function baseConfig(): Config {
  return {
    id: "test-config",
    schema_version: 1,
    notes: "a note",
    elo: {
      k: 24,
      initial_rating: 1500,
      home_advantage: 35,
      regression_to_mean: 0.25,
      mov_multiplier: "538_log",
      k_context_sensitivity: 0,
      k_context_window: 8,
      home_advantage_source: "static",
    },
    pav: {
      computation: "round_by_round_cumulative",
      prior_weight_k: 8,
      prior_source: "previous_season_final",
      missing_player_default: 0,
      include: "named_lineup_excl_emerg",
    },
    blend: {
      weight_elo: 0.6,
      pav_calibration_slope: 6.986,
      where: "team_rating",
    },
    output: {
      margin_per_rating_point: 0.75,
      sigma: 36,
    },
    backtest: {
      train_seasons: [2015, 2016, 2017, 2018, 2019, 2020],
      test_seasons: [2021, 2022, 2023, 2024, 2025],
      walk_forward: true,
    },
  };
}

describe("computeConfigHash", () => {
  it("is deterministic for identical configs", async () => {
    expect(await computeConfigHash(baseConfig())).toBe(await computeConfigHash(baseConfig()));
  });

  it("produces different hashes for configs differing only in a nested parameter (COR-01)", async () => {
    const a = baseConfig();
    const b = baseConfig();
    b.elo.k = 32;
    expect(await computeConfigHash(a)).not.toBe(await computeConfigHash(b));
  });

  it("is sensitive to every nested section", async () => {
    const variants: Array<(c: Config) => void> = [
      (c) => {
        c.blend.weight_elo = 0.5;
      },
      (c) => {
        c.pav.prior_weight_k = 12;
      },
      (c) => {
        c.output.sigma = 40;
      },
      (c) => {
        c.backtest.test_seasons = [2024];
      },
    ];
    const baseHash = await computeConfigHash(baseConfig());
    const hashes = new Set([baseHash]);
    for (const mutate of variants) {
      const config = baseConfig();
      mutate(config);
      hashes.add(await computeConfigHash(config));
    }
    expect(hashes.size).toBe(variants.length + 1);
  });

  it("ignores id and notes", async () => {
    const a = baseConfig();
    const b = baseConfig();
    b.id = "another-name";
    b.notes = "different note";
    expect(await computeConfigHash(a)).toBe(await computeConfigHash(b));
  });

  it("is independent of key insertion order at any depth", async () => {
    const a = baseConfig();
    const reordered = {
      backtest: a.backtest,
      output: a.output,
      blend: a.blend,
      pav: a.pav,
      elo: {
        venue_ha: undefined,
        home_advantage_source: a.elo.home_advantage_source,
        k_context_window: a.elo.k_context_window,
        k_context_sensitivity: a.elo.k_context_sensitivity,
        mov_multiplier: a.elo.mov_multiplier,
        regression_to_mean: a.elo.regression_to_mean,
        home_advantage: a.elo.home_advantage,
        initial_rating: a.elo.initial_rating,
        k: a.elo.k,
      },
      schema_version: a.schema_version,
      id: a.id,
    } as unknown as Config;
    expect(await computeConfigHash(reordered)).toBe(await computeConfigHash(a));
  });

  it("no longer produces the broken pre-fix constant hash", async () => {
    // Every stored result before the fix carried this hash regardless of config.
    expect(await computeConfigHash(baseConfig())).not.toBe(
      "85afb8a8856bca389fdd9d8db219aae9182b24d1e0b5acc41ad5f085e8221057",
    );
  });
});

describe("shortHash", () => {
  it("returns the first 8 characters", () => {
    expect(shortHash("abcdef0123456789")).toBe("abcdef01");
  });
});
