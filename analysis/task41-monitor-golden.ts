/** Compare typed monitor scoring with the original Python functions, without I/O there. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { closeBandSign, compTip, marketGap } from "../src/cli/monitor/score.js";
import { loadResult } from "./task40-score.js";

const ids = ["t40-baseline-2026", "t40-od-2026"];
const rows = (await Promise.all(ids.map(loadResult))).flat();
const python = `
import importlib.util, json, sys
spec = importlib.util.spec_from_file_location('monitor', 'analysis/weekly-monitor.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
rows = json.load(sys.stdin)
comp = [m.comp_tip(r['predictedMargin'], r['actualMargin']) for r in rows]
close = [m.sign_tip(r['predictedMargin'] >= 0, r['actualMargin']) for r in rows
         if abs(r['predictedMargin']) < m.CLOSE and r['actualMargin'] != 0]
print(json.dumps({'comp': comp, 'close': {'correct': sum(close), 'total': len(close)},
                  'alerts': [abs(g) >= m.ALERT_TIPS for g in range(-10, 11)]}))
`;
const oracle = JSON.parse(
  execFileSync("python3", ["-c", python], {
    input: JSON.stringify(rows),
    encoding: "utf8",
  }),
);
assert.deepEqual(
  rows.map((row) => compTip(row.predictedMargin, row.actualMargin ?? 0)),
  oracle.comp,
);
assert.deepEqual(closeBandSign(rows), oracle.close);
assert.deepEqual(
  Array.from({ length: 21 }, (_, i) => marketGap(10 + i - 10, 10).alert),
  oracle.alerts,
);
console.log(
  JSON.stringify({
    rows: rows.length,
    close: oracle.close,
    oracle: "analysis/weekly-monitor.py",
    passed: true,
  }),
);
