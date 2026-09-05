# Squiggle Submission

This packet prepares Tipper for submission. No request has been sent to Squiggle,
and Squiggle has not accepted Tipper for participation or ingestion.

## Feed Contract

| Item                | Value                                                               |
| ------------------- | ------------------------------------------------------------------- |
| Model               | Tipper                                                              |
| Maintainer          | Jack McPherson                                                      |
| Competition         | AFLM                                                                |
| Current feed        | <https://tipper.jackemcpherson.workers.dev/tips>                    |
| Explicit round      | <https://tipper.jackemcpherson.workers.dev/tips?year=2026&round=27> |
| Health              | <https://tipper.jackemcpherson.workers.dev/health>                  |
| Prospective results | <https://tipper.jackemcpherson.workers.dev/performance?year=2026>   |
| Source              | <https://github.com/jackemcpherson/tipper>                          |
| Authentication      | None for public reads                                               |

The JSON object contains a `tips` array. Each entry supplies `gameid`, `tipteamid`,
`hteam`, `ateam`, `tip`, `margin`, `hmargin`, `confidence`, `hconfidence`, `year`
and `round`. Game and team IDs use validated Squiggle identities. Signed
`hmargin` and `hconfidence` describe the home team. `margin` is an absolute whole
number, and confidence fields are whole percentages. The recorded winner comes
from the full-precision margin, including when the displayed margin rounds to zero.

The feed reads stored tips. Requests cannot generate a prediction or fetch
upstream data. Responses disable caching and allow cross-origin reads. Supply
both query parameters or omit both. Invalid parameters return 400, unknown rounds
return 404, and incomplete known rounds return 503 instead of a partial feed.

## Example Feed

Observed on 6 September 2026. These provisional tips can change before kickoff.

```json
{
  "tips": [
    {
      "gameid": 38725,
      "tipteamid": 6,
      "hteam": "Fremantle",
      "ateam": "Geelong",
      "tip": "Fremantle",
      "margin": 1,
      "hmargin": 1,
      "confidence": 51,
      "hconfidence": 51,
      "year": 2026,
      "round": 27
    },
    {
      "gameid": 38726,
      "tipteamid": 2,
      "hteam": "Brisbane Lions",
      "ateam": "Adelaide",
      "tip": "Brisbane Lions",
      "margin": 9,
      "hmargin": 9,
      "confidence": 60,
      "hconfidence": 60,
      "year": 2026,
      "round": 27
    }
  ]
}
```

## Model and Publication

Tipper combines MOV-adjusted Elo with player PAV. Its one production model uses
completed results, current-season player statistics and the previous season's
player prior. It does not consume live or target-match results. See the
[model specification](model.md) for the fixed values and probability calculation.

Publication starts within seven days of kickoff. Refreshes occur daily outside
24 hours, hourly inside 24 hours, and every five minutes inside 90 minutes.
Until both lineups are usable, both lineup contributions are neutral and the
capture is provisional. Each match locks permanently at its recorded kickoff.
Later schedule corrections cannot reopen a passed deadline.

Captures retain the issued output, fixture, consumed inputs and complete source
revision. Missing historical tips are not reconstructed. Prospective recording
started at `2026-09-05T23:32:55.293Z`. Research results are separate and are not
presented as prospective competition performance.

## Before Sending

Use the [production deployment record](rollout-2026-09-06.md) to check evidence and
open observation gates. Confirm a healthy feed immediately before submission.
Agree the polling interval, final retrieval deadline, model name and source ID
with Squiggle. A successful feed request does not prove Squiggle has ingested it.

Current published team sizes support 23 AFLM and 21 AFLW players. The
[AFL's 2026 explanation](https://www.afl.com.au/news/1461264/how-clubs-plan-to-navigate-rule-changes-in-2026)
and [AFLW team preview](https://www.afl.com.au/aflw/news/1460641/your-clubs-best-aflw-21-whos-in-whos-out-whos-new)
support those constants. Review the 2027 competition rules before the 2027 season.
AFLW predictions serve existing consumers and are not part of this submission.

## Draft Message

Subject: Tipper AFLM model submission for 2027

Hello,

I'd like to submit Tipper for the 2027 AFLM model competition. Tipper combines
MOV-adjusted Elo and player PAV, with prospective predictions stored before each
match and locked at kickoff.

The public JSON feed is <https://tipper.jackemcpherson.workers.dev/tips>. It uses
Squiggle game and team IDs and includes winner, margin and confidence fields.
The feed supports explicit season and round queries. See the model and publication
rules at <https://github.com/jackemcpherson/tipper>.

Please confirm the submission process, expected polling and final retrieval
schedule, and any payload or attribution requirements. I can provide a fixed
round example for your ingestion test.

Thanks,
Jack McPherson
