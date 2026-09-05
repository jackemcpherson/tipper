# Operations

Use the pinned GitOps artefact and the retained evidence for operational changes.

## Publication and Locks

The scheduler runs every five minutes. First publication starts when a fixture
enters the seven-day window. Refresh daily more than 24 hours before kickoff,
hourly inside 24 hours, and every five minutes inside 90 minutes. A refresh covers
the complete currently eligible set for its competition, season and round.

A run receives an ordered ID before reading inputs. Seven native D1 statements
read the bounded snapshot in one batch. Captures, compatibility projections and
checked finalisation commit in one transaction. Finalisation checks coverage,
fixture identity, UTC kickoff, current and previous locks, projection links and
newer committed runs. Failure rolls back the whole batch. After an ambiguous
response, read the original run record before retrying.

The latest committed capture owns a match's recorded deadline. A reschedule can
move that deadline while it remains in the future. Once it passes, automatic and
manual refreshes cannot reopen it. Fixture corrections invalidate the current
projection atomically. Historical captures remain.

A missing locked tip stays missing. Health reports current operational gaps.
Retained reports expose historical misses.
There is no force-unlock or historical prediction endpoint.

Admission before the database deadline is the guarantee. It does not establish
that Squiggle fetched a tip or that an upstream correction already reached D1.

## Deployment Order

1. Preserve research tag `research/production-redesign-2026-09-05` at
   `6b4cf4bf54923037194f06f0126cd6eb5d6dc8e5`.
2. Merge and promote AFL-MCP's additive `0021_tipper_publication.sql` migration
   and source-ingestion changes through cloudflare-infra. Existing Task 41
   archives remain separate and unchanged.
3. Refresh upcoming AFLM and AFLW fixtures from their source. Confirm populated
   canonical `matches.kickoff_at`, then valid lineup replacement observations.
   Never construct deadlines from `date` and `local_time`.
4. Configure the Tipper `ADMIN_TOKEN` Worker secret through the normal secret
   provisioning path. The infrastructure contract preserves that required secret.
5. At first promotion, register `tipper_status.activated_at` once with an
   `INSERT OR IGNORE` for row 1. Use the actual activation instant. Merge Tipper
   and publish its full-revision artefact, then promote it through
   cloudflare-infra with the five-minute cron. The scheduler repeats the
   insert as a fallback and never moves an existing activation timestamp.
6. Check real captures, links and identities for both competitions. Test manual
   refresh before kickoff and after a lock. Confirm a retained Monday report.
7. Complete Squiggle's ingestion agreement and end-to-end acceptance before
   competition launch. Contact and submission need separate authorization.

The first deployment can fail its health verification until the scheduler
publishes and resolves identities. Keep the new version active, inspect the
per-match diagnostics, then rerun verification for the same pinned version.
Never recover by restoring the legacy writer.

Tests carry a copy of the upstream migration strictly as a fixture. They do not
make Tipper a migration owner. Keep that fixture equal to AFL-MCP's migration.

The existing infrastructure contract has no explicit Worker CPU limit. Local
measurements are evidence about the implementation, not proof of a production
CPU allowance. Verify the account's configured runtime budget and production D1
row counts during promotion. Snapshot bounds fail closed instead of truncating.

## Manual Refresh

Send `Authorization: Bearer <ADMIN_TOKEN>` and a JSON object to
`POST /admin/refresh`:

```json
{"competition":"AFLM","season":2027,"round":1}
```

The endpoint accepts only those three fields. It uses the same publisher and
locks as the scheduler. Configure secrets outside source control. Exporting tips
means downloading `/tips`. It never runs another prediction implementation.

## Monitoring

Health checks individual expected fixtures, capture/projection consistency,
freshness, known deadlines and scheduler heartbeat. AFLM feed identities are a
separate input diagnostic. Reporting staleness does not fail deployment health.

After Monday 22:00 UTC, score issued captures at their recorded locks. Retain the
actual outcomes and observed Squiggle field with every report. Failed collection
attempts remain available. Retry hourly and keep the previous successful report.

A reporting period with no expected prospective matches is a valid empty report.
It has zero coverage, null performance metrics and no ranking. Reports start at
the first Monday 22:00 UTC after activation. They are never backdated.

The public report includes coverage, missing tips, field comparisons, accuracy,
draws, MAE, log loss, Brier score and the under-12-point close-band diagnostic.

Field rankings use the published common match set and full winner coverage.
Sparse margin evidence does not receive an MAE tiebreak. Each source comparison
lists its paired match IDs. Punters comparisons use only paired matches. An
absolute tip gap of at least three triggers the retained performance alert.
The read-only weekly GitHub check attaches the report before failing on alerts,
missing predictions, collection problems or staleness.

## Recovery

Keep old artefacts and additive schema. After activation, recovery must use a
publisher that understands recorded locks and captures. The legacy direct writer
can overwrite locked tips and is not a safe rollback target. Preserve runs,
captures and reports when investigating corrections. Do not reconstruct missing
prospective tips from later source data.
