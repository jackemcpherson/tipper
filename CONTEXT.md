# Tipper

Tipper issues match predictions before kickoff and retains evidence for scoring.

## Language

**Capture**: An issued prediction with the fixture, rating inputs, consumed lineup
and observation times that supported it.
_Avoid_: Backtest result, reconstructed tip.

**Provisional prediction**: A prediction issued while either announced lineup is
unusable. Both teams have zero lineup contribution.

**Recorded kickoff**: The deadline admitted with the latest committed capture.

**Lock**: The permanent end of a prediction's refresh eligibility when its
recorded kickoff passes.
_Avoid_: Whole-round freeze.

**Mutable set**: The currently eligible matches in one competition, season and
round. Earlier locked matches are outside this set.

**Missed tip**: An expected prospective match without an issued capture at lock.
Later observations cannot fill this gap.

**Weekly report**: A retained scoring observation of issued tips, outcomes and
competitor evidence on explicitly stated match sets.

**Fixed baseline**: The stored 2026 Squiggle field and results, scored on one
stated set of completed games, against which production and candidates rank.
_Avoid_: Live standings.

**Challenger**: A separate model evaluated beside production and captured
prospectively under its own identity. It never publishes tips.
_Avoid_: Shadow config, candidate promotion.

**Prospective capture**: An append-only challenger prediction recorded before a
match with its inputs and source revision. The last capture before the recorded
kickoff is the issued prediction.
_Avoid_: Replayed prediction.
