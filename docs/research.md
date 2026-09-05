# Reproducing the Research Revision

The immutable research tag preserves the tracked pre-redesign revision:
`research/production-redesign-2026-09-05`, pointing to
`6b4cf4bf54923037194f06f0126cd6eb5d6dc8e5`. Never move this tag.
It does not trigger the former `v*` npm release workflow.

```sh
git worktree add ../tipper-research research/production-redesign-2026-09-05
cd ../tipper-research
bun install --frozen-lockfile
bun run build
```

Read that revision's README and command help for research execution. Its tracked
configs and results remain in Git. Repeating commands against mutable upstream
D1 data does not guarantee identical historical data. use retained results and
record source observations when reproducing an experiment.

`tests/fixtures/incumbent.json` records small deterministic inputs and the old
rebuild Elo, PAV and margin outputs at that revision. The standard-normal grid
checks the corrected probability calculation independently.

The two untracked results present before redesign remain untouched:

- `configs/od-w100-k008/results-2026-09-05-193a0012.json`
- `configs/predha-080/results-2026-09-05-e8e0cede.json`

Future research happens on branches and lands through PRs. Main maintains the
production predictor, publication and competition evidence modules.
