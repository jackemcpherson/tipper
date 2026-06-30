# Task 39 — Squiggle Submission Channel Spike

## Channel type

**Pull-based scraping, not a push API.**

Squiggle does not have a write/POST endpoint. SquiggleBot (Squiggle's ingest bot) fetches
tips hourly from each model's own public URL, more frequently close to game start times.
There is no documented write API on `api.squiggle.com.au` — the entire API is read-only.

To participate, a model author must:
1. Host a public tips endpoint (URL format is determined in coordination with Squiggle).
2. Contact Squiggle via Twitter/X (@SquiggleAFL / @maxbarry) to be accepted.
3. Meet the published criteria (competent long-term performance, no human-opinion inputs,
   some transparency about the method, preferably a public site).

The exact URL format for the model's tips endpoint is **not publicly documented** and is
agreed directly with Squiggle after acceptance. The format is inferred from what Squiggle's
read API exposes after ingestion (see below).

## Per-game payload fields

From the Squiggle read API (`api.squiggle.com.au/?q=tips`), each ingested tip object
contains these fields (verified against live 2026 data):

| Field | Type | Description |
|---|---|---|
| `gameid` | integer | Squiggle's canonical game ID (required to match the game) |
| `hteam` | string | Home team name (Squiggle spelling) |
| `ateam` | string | Away team name (Squiggle spelling) |
| `tip` | string | Predicted winner team name (Squiggle spelling) |
| `tipteamid` | integer | Squiggle team ID of the tipped team |
| `margin` | string/number | Tipped team's predicted winning margin (always positive) |
| `hmargin` | string/number | Predicted margin from home perspective (positive = home wins) |
| `confidence` | string/number | Tipped team's win probability as a percentage (0–100) |
| `hconfidence` | string/number | Home team's win probability as a percentage (0–100) |
| `year` | integer | Season year |
| `round` | integer | Round number |

### Example tip object (from `?q=tips;year=2026;round=12;source=1`)

```json
{
  "confidence": "51.72",
  "venue": "Gabba",
  "hteamid": 2,
  "tip": "Brisbane Lions",
  "margin": "1.22",
  "hmargin": "1.22",
  "hconfidence": "51.72",
  "tipteamid": 2,
  "gameid": 38596,
  "hteam": "Brisbane Lions",
  "ateam": "Fremantle",
  "round": 12,
  "year": 2026
}
```

When the home team is tipped: `confidence == hconfidence` and `margin == hmargin`.
When the away team is tipped: `confidence` = away win probability, `hconfidence` = home
win probability, `margin` = absolute away winning margin, `hmargin` is negative.

## Team name mapping (ours → Squiggle)

Only one mismatch is known; all others match the Squiggle spelling directly:

| Our DB name | Squiggle name |
|---|---|
| GWS Giants | Greater Western Sydney |

This mapping is already in `analysis/weekly-monitor.py` (`OURS_TO_SQ`) and is confirmed
correct by the monitor's assertion that every prediction pairs to a Squiggle game.

## Lockout timing

SquiggleBot fetches tips "hourly, and more frequently close to the start of games." This
implies **per-game lockout** at each game's scheduled start time — a late-updated tip for
game 1 of a round is still valid for games 2–3 of that round. No single round-wide lockout.

## Recommendation for Half B scope

The submission channel is pull-based (no push API, no credentials needed to serve), but
the exact endpoint format requires a prior agreement with Squiggle before any live feed
can be consumed.

**Half B should stop at producing the formatted payload and a `--dry-run`-style printout.**
Serving the tips at a public HTTP endpoint is a separate follow-up plan that depends on:
- Squiggle acceptance (requires contact + approval)
- Agreement on the exact URL format and `gameid` linkage
- A deployment decision (the existing Cloudflare Worker is retired; a new Worker or
  static hosting would be needed)

The `export-tips` command in Half B emits a JSON payload per round mirroring the Squiggle
tips format. The `gameid` field is omitted because our `matchId` is an internal DB ID, not
the Squiggle canonical ID — that linkage must be resolved (via `?q=games` lookup) when
setting up the live feed, not in the formatter.

## Gap: `gameid` linkage

The Squiggle ingestion requires `gameid` to match tips to games. Our `MatchPrediction`
carries `matchId` (internal DB) which is NOT the Squiggle `gameid`. To close this gap for
a live feed, the export command would need to call `api.squiggle.com.au/?q=games;year=Y;
round=R` and match by `(hteam, ateam)` — using the name map — to resolve the `gameid`
for each game before serving the endpoint. This lookup is straightforward but adds a
Squiggle API dependency that belongs in the live-feed follow-up plan.
