# Plan 009: Automate the weekly comp monitor as a GitHub Actions cron

> **Executor instructions**: Follow this plan step by step. Run every verification
> command and confirm the expected result before moving to the next step. If anything
> in the "STOP conditions" section occurs, stop and report — do not improvise. When
> done, update the status row for this plan in `plans/README.md`.
>
> **Secrets discipline**: this workflow needs a `CLOUDFLARE_API_TOKEN` repository
> secret. You create the WORKFLOW that reads it; you never see, print, echo, or commit
> the token value. Creating the secret itself is a maintainer checklist item.
>
> **Depends on plan 005** — the `tipper monitor` command (`src/cli/commands/monitor.ts`)
> must be on main.
>
> **Drift check (run first)**: `git diff --stat 212ba7c..HEAD -- src/cli/commands/monitor.ts .github/workflows/`
> `monitor.ts` should exist (landed by 005) and match the excerpt below; on a
> mismatch, STOP.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW-MED (CI secret handling; write-back commit loop)
- **Depends on**: plans/005-land-approved-branches.md
- **Category**: direction (automation)
- **Planned at**: commit `212ba7c`, 2026-07-12

## Why this matters

The A3 weekly monitor tracks v3 plus the OD and v4 shadows against the live Squiggle
field — the exact trend lines (recent tips, close-band sign accuracy, comp rank) that
feed the October promotion gates (plan 006). Today it runs only when the maintainer
remembers to run it, and the log shows gaps. A weekly cron makes the 2026
R15-onward record complete and unattended, and its ±3-tip drift alert becomes an
actual alert (a failed workflow run + issue) instead of an exit code nobody sees.

## Current state

Verified at commit `212ba7c` + reviewed plan-004 branch (`f100083`):

- `src/cli/commands/monitor.ts` (lands via 005) — `tipper monitor`: runs backtests for
  v3 + shadows in-process, fetches the Squiggle field, prints comp rank / close band /
  market sections, appends one row per run-date (idempotent same-day) to
  `analysis/monitor-log.csv`, and **exits 2 when |market_gap| ≥ 3** (the alert
  contract, inherited from `analysis/weekly-monitor.py`).
- Auth: the CLI reads `CLOUDFLARE_API_TOKEN` from the environment (takes precedence
  over wrangler's OAuth token — README "Environment variables"). `CLOUDFLARE_ACCOUNT_ID`
  and `CLOUDFLARE_D1_DATABASE_ID` have baked-in defaults pointing at the maintainer's
  account; CI only needs the token.
- Caching: historical seasons cache under `~/.cache/tipper/`; the current season is
  always fetched live. A cold CI runner refetches everything — acceptable (runtime
  minutes), but cache the directory anyway with `actions/cache` keyed on the season.
- CI conventions (`.github/workflows/ci.yml`): actions pinned by full SHA with version
  comments (e.g. `actions/checkout@df4cb1c0... # v6.0.3`, `oven-sh/setup-bun@0c5077e5...

## v2.2.0`, bun-version "1.3"), `permissions: contents: read`, timeout-minutes set

  Match all of these.

- AFL rounds complete Sunday evening AEST. Schedule: Monday 22:00 UTC (= Tuesday 08:00
  AEST) — data settled, and any Monday-night game is captured next week (idempotent
  append makes double-running safe, so also allow `workflow_dispatch`).

### Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Build | `bun install --frozen-lockfile && bun run build` | exit 0 |
| Run monitor | `bun run dist/cli/index.js monitor --season 2026` | prints 3 sections; exit 0 or 2 |
| Workflow lint | `gh workflow list` (after push) or `actionlint` if available | workflow parses |

### Scope

**In scope**:

- `.github/workflows/monitor.yml` (create)
- `docs/task-43-monitor-cron.md` (create — one-pager: schedule, secret setup, alert
  semantics, how to pause)

**Out of scope** (do NOT touch):

- `src/` — if the monitor command needs changes to run headless, STOP and report
- `ci.yml`, `release.yml`
- Creating the repository secret (maintainer does this; the doc tells them how)
- `analysis/weekly-monitor.py` — retiring the Python monitor is a later cleanup

### Git workflow

- Branch: `advisor/009-monitor-cron` off main (after 005 merges)
- Conventional commit: `ci: weekly comp monitor cron`
- Do NOT push or open a PR unless the operator instructed it.

### Steps

#### Step 1: Write the workflow

`.github/workflows/monitor.yml`:

- `on: schedule: - cron: "0 22 * * 1"` plus `workflow_dispatch:`.
- `permissions: contents: write` (it commits the log row) — scoped at the job level,
  with a comment explaining why it differs from ci.yml's read-only default.
- Steps: checkout (same pinned SHA as ci.yml) → setup-bun (same pin) →
  `actions/cache` on `~/.cache/tipper` keyed `tipper-cache-2026` → install + build →
  run `bun run dist/cli/index.js monitor --season 2026` with
  `env: CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}`, capturing the exit
  code without failing the step (`continue-on-error` or shell-level capture) →
  commit-and-push `analysis/monitor-log.csv` if changed (git config a bot identity;
  plain `git push` to main — the repo has no branch protection; if push is rejected,
  that's a STOP-worthy report, not a force-push) → final step: if captured exit code
  was 2, `exit 1` with a log line quoting the market-gap row, so the run shows failed
  and GitHub notifies the maintainer.
- `concurrency: group: monitor` so a manual dispatch never races the cron commit.
- Season is hard-coded `2026` with a comment to bump it (or read from a repo variable)
  — note it in the doc.

**Verify**: workflow YAML parses (`bunx yaml-lint .github/workflows/monitor.yml` or
`python3 -c "import yaml,sys;yaml.safe_load(open('.github/workflows/monitor.yml'))"`)
→ exit 0.

#### Step 2: Local rehearsal of the exact command sequence

Run the workflow's core sequence locally (with your existing wrangler auth standing in
for the secret):

```bash
bun install --frozen-lockfile && bun run build && bun run dist/cli/index.js monitor --season 2026; echo "exit=$?"
```

**Verify**: prints the three monitor sections; exit is 0 or 2 (2 is the alert, not a
malfunction); `analysis/monitor-log.csv` gains or refreshes today's row.

#### Step 3: Write the operations one-pager

`docs/task-43-monitor-cron.md`: how to create the `CLOUDFLARE_API_TOKEN` secret
(Settings → Secrets → Actions; token needs **D1 read only** — recommend minting a
dedicated read-only token rather than reusing a broad one; never the wrangler OAuth
token), the schedule in UTC and AEST, what a red run means (market-gap alert vs real
failure — distinguishable by the quoted gap line in the log), how to pause (disable
workflow in the Actions UI), and the yearly season bump.

**Verify**: doc exists; contains the words "read-only" in the token guidance.

#### Step 4: Revert the local log row

The rehearsal in step 2 dirtied `analysis/monitor-log.csv`. Keep it ONLY if today's
row is a legitimate monitor record the maintainer would want; otherwise
`git checkout -- analysis/monitor-log.csv`. Either way state which you did in your
report.

**Verify**: `git status` shows only `monitor.yml` and the doc (plus the log row if
deliberately kept).

### Test plan

No unit tests — this is CI config. The verification gates are: YAML parse (step 1),
local rehearsal of the exact command sequence (step 2), and — post-merge, maintainer
action — one `workflow_dispatch` run that (a) commits a log row and (b) is manually
confirmed green. That dispatch is listed in the done criteria as a maintainer
checklist item, not something you can perform.

### Done criteria

- [ ] `.github/workflows/monitor.yml` exists, parses, actions pinned by SHA matching ci.yml's pins
- [ ] Local rehearsal (step 2) succeeded
- [ ] `docs/task-43-monitor-cron.md` exists with read-only-token guidance
- [ ] No changes under `src/` (`git status`)
- [ ] `plans/README.md` status row updated; row notes the two maintainer follow-ups (create secret, one manual dispatch)

### STOP conditions

Stop and report back (do not improvise) if:

- `tipper monitor` needs interactive input or wrangler-OAuth-only auth when run with
  only `CLOUDFLARE_API_TOKEN` set (would mean the env-token path doesn't cover some
  query — a src/ fix is out of scope here).
- The monitor command's exit-code contract differs from "0 ok / 2 alert" (check the
  header comment of `src/cli/commands/monitor.ts`).
- You need any secret value at any point. You never do.

### Maintenance notes

- Yearly: bump `--season` (and the cache key) when the 2027 season starts.
- The cron commits to main; if branch protection is ever enabled, switch the write-back
  to a PR-creating action — noted here so the failure mode is pre-diagnosed.
- Once trusted, retire `analysis/weekly-monitor.py` and its
  `weekly-monitor-log.csv` (merge histories or archive) — deferred deliberately.
- Plan 007's live tips feed may later want regeneration in this same workflow
  (deferred; see that plan's maintenance notes).
