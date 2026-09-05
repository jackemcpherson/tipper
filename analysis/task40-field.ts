/** Fresh, dated full-field snapshots. No union of old configuration hashes. */
import { existsSync, writeFileSync } from "node:fs";

for (const year of [2016, 2017, 2018, 2019, 2021, 2022, 2023, 2024, 2025, 2026]) {
  const path = `/tmp/tipper-task40-squiggle-${year}.json`;
  if (existsSync(path)) {
    console.log(`Frozen snapshot exists: ${year}`);
    continue;
  }
  const response = await fetch(`https://api.squiggle.com.au/?q=tips;year=${year}`, {
    headers: { "User-Agent": "tipper-research/1.0 (jackemcpherson@gmail.com)" },
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) throw new Error(`Squiggle ${year}: HTTP ${response.status}`);
  const payload = await response.text();
  const parsed = JSON.parse(payload);
  if (!Array.isArray(parsed.tips)) throw new Error(`Squiggle ${year}: missing tips`);
  writeFileSync(path, payload, { flag: "wx" });
  console.log(`${year}: ${parsed.tips.length} field tips`);
}
