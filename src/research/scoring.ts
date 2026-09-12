/**
 * Squiggle competition scoring and internal diagnostics.
 *
 * Squiggle rules: a correct winner earns one tip, and every tipster earns the
 * tip when a match is drawn. Bits reward the confidence in the tipped team:
 * `1 + log2(p)` when right, `1 + log2(1 - p)` when wrong and
 * `1 + 0.5 * log2(p * (1 - p))` for a draw. Margin error is the absolute
 * difference between the forecast and actual home margins. A draw scores the
 * forecast margin against zero.
 */
export interface Forecast {
  /** Probability that the home team wins, in (0, 1). */
  readonly homeProbability: number;
  /** Forecast home margin in points. Positive favours the home team. */
  readonly homeMargin: number;
}
export interface ScoredForecast {
  readonly tip: number;
  readonly bits: number;
  readonly error: number;
  readonly correct: boolean | null;
}

/** Score one forecast against the actual home margin. */
export function scoreForecast(forecast: Forecast, actualHomeMargin: number): ScoredForecast {
  const p = forecast.homeProbability;
  if (!(p > 0 && p < 1)) throw new Error(`Probability out of range: ${p}`);
  const tipsHome = tipOf(forecast) === "home";
  if (actualHomeMargin === 0) {
    return {
      tip: 1,
      bits: 1 + 0.5 * Math.log2(p * (1 - p)),
      error: Math.abs(forecast.homeMargin),
      correct: null,
    };
  }
  const homeWon = actualHomeMargin > 0;
  const correct = tipsHome === homeWon;
  const winnerProbability = homeWon ? p : 1 - p;
  return {
    tip: correct ? 1 : 0,
    bits: 1 + Math.log2(winnerProbability),
    error: Math.abs(forecast.homeMargin - actualHomeMargin),
    correct,
  };
}

/** The tipped side follows the margin sign; an exact zero margin follows the probability. */
export function tipOf(forecast: Forecast): "home" | "away" {
  if (forecast.homeMargin !== 0) return forecast.homeMargin > 0 ? "home" : "away";
  return forecast.homeProbability >= 0.5 ? "home" : "away";
}

export interface Summary {
  readonly matches: number;
  readonly draws: number;
  readonly tips: number;
  readonly bits: number;
  readonly mae: number | null;
  readonly decisive: number;
  readonly decisiveCorrect: number;
  readonly accuracy: number | null;
  readonly rmse: number | null;
  readonly brier: number | null;
  readonly logLoss: number | null;
}

/** Aggregate scored forecasts. Log loss is the mean natural-log loss, as production reports it. */
export function summarise(rows: readonly (Forecast & { readonly actual: number })[]): Summary {
  let tips = 0,
    bits = 0,
    abs = 0,
    sq = 0,
    brier = 0,
    logLoss = 0,
    decisiveCorrect = 0,
    draws = 0;
  for (const row of rows) {
    const scored = scoreForecast(row, row.actual);
    tips += scored.tip;
    bits += scored.bits;
    abs += scored.error;
    sq += scored.error ** 2;
    const outcome = row.actual === 0 ? 0.5 : row.actual > 0 ? 1 : 0;
    brier += (row.homeProbability - outcome) ** 2;
    logLoss +=
      -outcome * Math.log(row.homeProbability) - (1 - outcome) * Math.log(1 - row.homeProbability);
    if (row.actual === 0) draws++;
    else if (scored.correct) decisiveCorrect++;
  }
  const n = rows.length;
  const decisive = n - draws;
  return {
    matches: n,
    draws,
    tips,
    bits,
    mae: n ? abs / n : null,
    decisive,
    decisiveCorrect,
    accuracy: decisive ? decisiveCorrect / decisive : null,
    rmse: n ? Math.sqrt(sq / n) : null,
    brier: n ? brier / n : null,
    logLoss: n ? logLoss / n : null,
  };
}

export interface CalibrationBucket {
  readonly bucket: string;
  readonly forecast: number;
  readonly observed: number;
  readonly n: number;
}

/** Reliability by decile of the favoured side's probability. Draws count as half a win. */
export function calibration(
  rows: readonly (Forecast & { readonly actual: number })[],
): CalibrationBucket[] {
  const buckets = Array.from({ length: 5 }, () => ({ forecast: 0, observed: 0, n: 0 }));
  for (const row of rows) {
    const favouredHome = row.homeProbability >= 0.5;
    const confidence = favouredHome ? row.homeProbability : 1 - row.homeProbability;
    const outcome = row.actual === 0 ? 0.5 : row.actual > 0 === favouredHome ? 1 : 0;
    const bucket = buckets[Math.min(4, Math.floor((confidence - 0.5) * 10))];
    if (!bucket) continue;
    bucket.forecast += confidence;
    bucket.observed += outcome;
    bucket.n++;
  }
  return buckets
    .map((b, i) => ({
      bucket: `${50 + i * 10}-${60 + i * 10}%`,
      forecast: b.n ? b.forecast / b.n : 0,
      observed: b.n ? b.observed / b.n : 0,
      n: b.n,
    }))
    .filter((b) => b.n > 0);
}

/** Pearson correlation of two equally long series. */
export function correlation(a: readonly number[], b: readonly number[]): number | null {
  const n = Math.min(a.length, b.length);
  if (n < 2) return null;
  const mean = (xs: readonly number[]) => xs.slice(0, n).reduce((s, x) => s + x, 0) / n;
  const ma = mean(a),
    mb = mean(b);
  let num = 0,
    da = 0,
    db = 0;
  for (let i = 0; i < n; i++) {
    const x = (a[i] ?? 0) - ma,
      y = (b[i] ?? 0) - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  return da > 0 && db > 0 ? num / Math.sqrt(da * db) : null;
}
