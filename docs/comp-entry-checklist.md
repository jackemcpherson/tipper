# Competition Entry Checklist

This checklist is for Jack to execute by hand. No Squiggle contact or
submission may happen until Jack explicitly authorises it. GitHub release work
does not grant that permission. Acceptance and the final feed format still
require agreement with Squiggle.

## Deployment and Verification

1. Review the AFL-MCP archive migration PR. Merge it only when ready for the
   separate production migration and deployment process. Migration `0021`
   adds `prediction_archive` and remains safe with the previous Worker.
2. Review the cloudflare-infra release-pin PR. Confirm its full tipper main
   SHA and artefact digest match a successful `Publish artifact` run.
   The existing public hostname needs no new DNS resource.
3. Use the maintainer's normal AFL-MCP migration process, then the manual
   tipper production apply for `stacks/prod/workers/tipper`. Do not run a
   manual `tipper publish`. The Worker owns the scheduled write path.
4. Create the tipper repository secret `CLOUDFLARE_API_TOKEN` with D1 read
   access. Enter the token privately when this command prompts:

   ```sh
   gh secret set CLOUDFLARE_API_TOKEN --repo jackemcpherson/tipper
   ```

5. Verify health and a known round. Confirm canonical `gameid` and `tipteamid`
   values, both team orientations, GWS spelling, and one primary tip per game.

   ```sh
   curl --fail --show-error \
     https://tipper.jackemcpherson.workers.dev/health
   curl --fail --show-error \
     'https://tipper.jackemcpherson.workers.dev/tips?year=2026&round=24'
   curl --fail --show-error \
     https://tipper.jackemcpherson.workers.dev/tips
   ```

6. Check the next due tick. Primary rows should refresh while the archive
   gains both `predha-080` and `t40-od` captures with consumed lineup flags.
   Confirm another tick adds captures without replacing earlier ones.
7. Run the weekly monitor manually once from GitHub main. Confirm its CSV
   commit. Exit 2 means a scored market alert, exit 3 means credentials, and
   exit 4 means Squiggle failure. An alert run must retain its CSV evidence.

## Contact Draft, Pending Explicit Permission

Task 39 identifies Squiggle's published entry criteria and contact channel.
Before sending, verify the current channel on Squiggle's site. Jack may use
`@SquiggleAFL` or `@maxbarry` if still current. Do not send this draft as part
of engineering or release work.

> Hi Max, I'd like to enter Tipper in the 2027 AFL model competition.
>
> Tipper combines match-result Elo with player-level PAV ratings and named
> lineups. It does not use market prices, expert tips, or other human-opinion
> inputs in its predictions. I use the market only as a separate monitor.
>
> The current model is predha-080. Its stored 2021 to 2025 regular-season
> evaluation has 716 correct non-draw tips. The code and research are public
> at <https://github.com/jackemcpherson/tipper>. I can share the full evaluation
> and its limitations. Historical lineup data reflects who played, so I am
> also archiving future predictions and named lineups before lock.
>
> The proposed feed is <https://tipper.jackemcpherson.workers.dev/tips>.
> It also accepts year and round parameters. It serves the current model's
> tips with canonical Squiggle game ids. I can adapt the formatter to your
> required format.
>
> Could you confirm the entry process, expected payload, and rehearsal period?
> I'd like to agree those details during late 2026 and verify ingestion before
> 2027 round 1. Thanks, Jack.

## Soak Plan and Calendar

Contact in September or October 2026, after Jack authorises the message and
verifies the deployed endpoint. Use remaining 2026 finals as a rehearsal.
A round that froze before deployment cannot gain a genuine pre-lock capture.
Label any replay as a diagnostic and never include it in the 2027 trial.

During the rehearsal, check the feed daily and around team announcements.
Watch before and after each round's first kickoff. The round should stop
changing at that first kickoff, even for its later games. A Squiggle outage
may temporarily remove canonical ids from the feed. Wait for their return
before treating ingestion as verified.

After acceptance and separate permission to submit, let SquiggleBot pull the
agreed URL. Compare its read API with the endpoint using the assigned source
id. Check game ids, winners, margins, confidence, and update times for every
game. Confirm the agreed lock behaviour with Squiggle rather than assuming
the inferred read-API shape is the final contract.

Use pre-season games only if the data feed and publisher schedule include
them. Otherwise use local fixture tests and the retained finals rehearsal.
Do not fabricate a live pre-season track record.

Before 2027 round 1, confirm acceptance, URL, payload, canonical ids, monitor
secret, and both models' archive captures. Review
`docs/trial-2027-adjudication.md` once more before the first publication.
After that publication, the frozen bar cannot change.
