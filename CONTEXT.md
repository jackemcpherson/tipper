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
