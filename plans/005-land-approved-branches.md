# Plan 005: Land the four approved advisor branches onto main

> **Executor instructions**: Follow this plan step by step. Run every verification
> command and confirm the expected result before moving to the next step. If anything
> in the "STOP conditions" section occurs, stop and report — do not improvise. When
> done, update the status row for this plan in `plans/README.md`.
>
> **This is an integration plan, not a code-writing plan.** All four branches were
> already written by prior executors and APPROVED by the advisor's review (see
> `plans/README.md` rows 001–004). Your job is to merge them into one integration
> branch, resolve the single known conflict, verify the merged result, and open a PR.
> You do NOT merge the PR — the maintainer does.
>
> **Drift check (run first)**: `git log --oneline -1 main` → expect `212ba7c`. If main
> has moved past `212ba7c`, check whether any of the four commits below are already
> reachable from main (`git branch --merged main | grep advisor`); skip any branch
> already landed, and treat a partial landing as a STOP condition (report which are in).

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW (all code pre-reviewed; only integration risk is one known conflict)
- **Depends on**: none
- **Category**: direction (integration)
- **Planned at**: commit `212ba7c`, 2026-07-12

## Why this matters

Plans 001–004 were executed and approved, but every one of them still sits on an
unmerged branch — main has none of the work. Concretely that means: the October
OD-promotion gate harness (001) is not in the repo history, the weather NO-GO verdict
(002b) is undocumented on main, and the `export-tips` (003) and `monitor` (004) CLI
commands don't exist in any installed build. Plans 006 (October bundle) and 009
(monitor cron) build directly on 001 and 004 respectively, so nothing downstream can
proceed until this lands.

## Current state

Verified at commit `212ba7c` (2026-07-12):

| Plan | Branch | Commit | Contents |
|------|--------|--------|----------|
| 001 | `advisor/001-od-v5-gate-harness` | `8bafe98` | `analysis/od-consensus-gate.py` + verdict doc + 4 results JSON files (~82k lines, mostly data) |
| 002b | `advisor/002b-weather-univariate-spike` | `f9d9c05` | `analysis/weather-univariate.py` + verdict doc (NO-GO) |
| 003 | `worktree-agent-a4df7bb01c76f9b1d` | `8ad4a54` | `docs/task-39-squiggle-submission.md`, `src/cli/commands/export-tips.ts`, `src/cli/format/comp.ts`, `src/cli/index.ts` (+2 lines), `tests/cli/comp-format.test.ts` |
| 004 | `advisor/004-monitor-to-typed-cli` | `f100083` | `src/cli/commands/monitor.ts`, `src/cli/monitor/{score,squiggle}.ts`, `src/cli/index.ts` (+2 lines), `tests/cli/monitor-score.test.ts` |

Each branch is exactly **one commit ahead of main**; none share files except:

- **Known conflict**: 003 and 004 both add ~2 lines to `src/cli/index.ts` (each
  registers its new command). Merging the second of the two will conflict or need a
  trivial union. **Resolution: keep BOTH command registrations.**

All four branches are still checked out in `.claude/worktrees/agent-*` worktrees
(`git worktree list` shows them). You can `git merge` a branch that a worktree has
checked out — do NOT try to `git checkout` those branches, and do NOT remove the
worktrees in this plan.

Repo conventions: PRs into main with conventional-commit titles (see `git log
--oneline -10`, e.g. `chore: add Dependabot config + ecosystem-doc checklist (#21)`).
Results JSON under `configs/` is committed history in this repo (see commit `9f00a57`)
and is excluded from Biome (see `biome.json`).

**Ecosystem doc check (CLAUDE.md rule)**: landing 003+004 adds two CLI commands
(`export-tips`, `monitor`) — the public surface changes. The homepage repo
(`public/docs/afl-data-ecosystem.md`, separate repo, likely not in this checkout) can't
be edited here; instead list the two new commands in the PR body under a heading
"Ecosystem doc follow-up" so the maintainer updates it.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Install | `bun install` | exit 0 |
| Typecheck | `bun run typecheck` | exit 0, no errors |
| Lint | `bun run check` | exit 0 |
| Tests | `bun run test -- --run` | all pass |
| Build | `bun run build` | exit 0 |

## Scope

**In scope**:

- Creating branch `advisor/005-land-plans` and merging the four commits into it
- Resolving the `src/cli/index.ts` conflict (union of both registrations)
- Pushing the branch and opening one PR

**Out of scope** (do NOT touch):

- Any content change to the merged files — this is integration, not review
- Removing the `.claude/worktrees/*` worktrees or deleting branches
- Merging the PR itself
- `configs/_current.json`, `src/engine/` — no model changes ride along

## Git workflow

- Branch: `advisor/005-land-plans` off `main` (`212ba7c`)
- Merge with `git merge --no-ff <commit>` so each plan's commit is preserved
- PR title: `feat: land advisor plans 001–004 (OD gate harness, weather NO-GO, export-tips, monitor)`
- Do NOT push to main directly. Do NOT merge the PR.

## Steps

### Step 1: Create the integration branch

```bash
git checkout -b advisor/005-land-plans main
```

**Verify**: `git rev-parse --short HEAD` → `212ba7c`

### Step 2: Merge 001 (gate harness)

```bash
git merge --no-ff 8bafe98 -m "merge: plan 001 — OD consensus-wrong gate harness"
```

**Verify**: `ls analysis/od-consensus-gate.py` → exists; no conflict reported.

### Step 3: Merge 004 (monitor CLI)

```bash
git merge --no-ff f100083 -m "merge: plan 004 — typed comp monitor"
```

**Verify**: `ls src/cli/monitor/score.ts` → exists; no conflict.

### Step 4: Merge 003 (export-tips) — expect the index.ts conflict

```bash
git merge --no-ff 8ad4a54 -m "merge: plan 003 — export-tips command"
```

If `src/cli/index.ts` conflicts: resolve by keeping BOTH the monitor registration
(from step 3) and the export-tips registration (from this merge), in either order,
then `git add src/cli/index.ts && git commit`.

**Verify**: `grep -c "export-tips\|monitor" src/cli/index.ts` → ≥ 2 (both commands
registered); `git status` → clean.

### Step 5: Merge 002b (weather verdict)

```bash
git merge --no-ff f9d9c05 -m "merge: plan 002b — weather univariate NO-GO"
```

**Verify**: `ls analysis/weather-univariate-verdict.md` → exists.

### Step 6: Full verification of the merged tree

```bash
bun install && bun run typecheck && bun run check && bun run test -- --run && bun run build
```

**Verify**: all five exit 0. Test count should include the 003 and 004 test files
(`tests/cli/comp-format.test.ts`, `tests/cli/monitor-score.test.ts`).

### Step 7: Push and open the PR

```bash
git push -u origin advisor/005-land-plans
gh pr create --title "feat: land advisor plans 001–004 (OD gate harness, weather NO-GO, export-tips, monitor)" --body "<summary of the four merged plans, their verdicts, and an 'Ecosystem doc follow-up' section listing the new export-tips and monitor CLI commands>"
```

**Verify**: `gh pr view --json state -q .state` → `OPEN`; CI runs green
(`gh pr checks --watch`).

## Test plan

No new tests — the merged branches carry their own (`comp-format.test.ts` 168 lines,
`monitor-score.test.ts` 203 lines). The verification is step 6 passing on the merged
tree, which is the state none of the four branches was ever tested in together.

## Done criteria

- [ ] `advisor/005-land-plans` contains all four commits (`git log --oneline main..HEAD` shows 4 merge commits + possibly 1 conflict-resolution commit)
- [ ] `bun run typecheck && bun run check && bun run test -- --run && bun run build` all exit 0
- [ ] Both `export-tips` and `monitor` appear in `bun run dist/cli/index.js --help` output
- [ ] PR open with CI green; body lists the ecosystem-doc follow-up
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Main has moved past `212ba7c` AND some of the four commits are already merged (partial landing).
- Any merge conflicts in a file other than `src/cli/index.ts`.
- Step 6 fails: the branches were verified individually, never together — a cross-branch
  breakage (e.g. both 003 and 004 defining a conflicting helper) is a review problem,
  not an integration problem. Report the failure, do not patch the merged code.
- `gh` is not authenticated or the push is rejected.

## Maintenance notes

- After the PR merges, the maintainer should clean up: `git worktree remove` the four
  `.claude/worktrees/agent-*` entries and delete the four branches (001/002b/004 use
  `advisor/*` names; 003's branch kept its worktree name `worktree-agent-a4df7bb01c76f9b1d`).
- The maintainer must update the ecosystem doc (homepage repo) for the two new CLI commands.
- Plan 004's monitor writes to `analysis/monitor-log.csv` — a NEW file, distinct from the
  Python monitor's `analysis/weekly-monitor-log.csv`. Both exist until the Python script
  is retired; plan 009 (cron) standardizes on the TS one.
