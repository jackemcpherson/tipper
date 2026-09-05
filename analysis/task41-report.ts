/** Render the self-contained Task 41 report with four inline, theme-aware SVGs. */
import { readFileSync, writeFileSync } from "node:fs";

const svg = (name: string, height: number, content: string) =>
  `<figure class="diagram"><svg viewBox="0 0 800 ${height}" role="img" aria-label="${name}" xmlns="http://www.w3.org/2000/svg"><title>${name}</title><defs><marker id="arrow-${height}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" class="arrowhead"/></marker></defs><g class="chart" style="--arrow:url(#arrow-${height})">${content}</g></svg></figure>`;
const diagrams = {
  tick: svg(
    "Publish tick and conservative at-lock selection",
    390,
    `
    <rect x="20" y="20" width="190" height="60" rx="8"/><text x="115" y="46">Cron every 15 minutes</text><text x="115" y="66" class="small">Melbourne clock</text>
    <path d="M210 50H270" class="edge"/><rect x="270" y="20" width="245" height="60" rx="8"/><text x="392" y="46">Publish plan</text><text x="392" y="66" class="small">Refresh only when due</text>
    <path d="M515 50H565" class="edge"/><rect x="565" y="20" width="215" height="60" rx="8" class="muted-box"/><text x="672" y="46">First kickoff reached?</text><text x="672" y="66" class="small">Yes: round freezes</text>
    <path d="M392 80V120" class="edge"/><rect x="270" y="120" width="245" height="65" rx="8"/><text x="392" y="146">Predict with consumed lineups</text><text x="392" y="169" class="small">Keep fixtures and rating inputs</text>
    <path d="M270 152H150V220" class="edge"/><rect x="20" y="220" width="270" height="65" rx="8" class="primary-box"/><text x="155" y="248">Upsert match_predictions</text><text x="155" y="270" class="small">Primary publication succeeds first</text>
    <path d="M290 252H360" class="edge"/><rect x="360" y="220" width="420" height="65" rx="8" class="archive-box"/><text x="570" y="248">Fetch field, then append prediction_archive</text><text x="570" y="270" class="small">Capture failure leaves primary output intact</text>
    <rect x="20" y="315" width="760" height="55" rx="8" class="muted-box"/><text x="400" y="337">At lock: capture time &lt; round first kickoff AND match kickoff</text><text x="400" y="359" class="small">Select the latest eligible capture per match and model. Never infer an earlier capture.</text>`,
  ),
  shadows: svg(
    "Primary and shadow database write boundaries",
    350,
    `
    <rect x="20" y="35" width="190" height="65" rx="8"/><text x="115" y="61">configs/_current.json</text><text x="115" y="83" class="small">predha-080 · 2641f46f</text>
    <path d="M210 68H270" class="edge"/><rect x="270" y="35" width="215" height="65" rx="8" class="primary-box"/><text x="377" y="61">Primary prediction</text><text x="377" y="83" class="small">publishRound</text>
    <path d="M485 68H555" class="edge"/><rect x="555" y="35" width="225" height="65" rx="8" class="primary-box"/><text x="667" y="61">match_predictions</text><text x="667" y="83" class="small">Latest primary row only</text>
    <path d="M520 68V220H555" class="edge"/>
    <rect x="20" y="190" width="190" height="65" rx="8"/><text x="115" y="216">configs/_shadows.json</text><text x="115" y="238" class="small">t40-od · c8c7b6b7</text>
    <path d="M210 223H270" class="edge"/><rect x="270" y="190" width="215" height="65" rx="8" class="archive-box"/><text x="377" y="216">Shadow prediction</text><text x="377" y="238" class="small">Read-only runPrediction</text>
    <path d="M485 223H555" class="edge"/><rect x="555" y="190" width="225" height="65" rx="8" class="archive-box"/><text x="667" y="216">prediction_archive</text><text x="667" y="238" class="small">Both models, every capture</text>
    <text x="400" y="300">Each model retains the named lineups its own prediction consumed.</text><text x="400" y="324" class="small">One shared field fetch per round. Promotion still uses the existing config command.</text>`,
  ),
  adjudication: svg(
    "Frozen pairing, scoring cuts and 30-tip promotion floor",
    430,
    `
    <rect x="20" y="20" width="235" height="75" rx="8"/><text x="137" y="47">Pair exact match ids</text><text x="137" y="69" class="small">Both frozen models at lock</text><text x="137" y="86" class="small">2027 home-and-away season</text>
    <path d="M255 58H290" class="edge"/><rect x="290" y="20" width="230" height="75" rx="8"/><text x="405" y="47">Score the common cuts</text><text x="405" y="69" class="small">Tips · close band · field wrong</text><text x="405" y="86" class="small">Team signed residual bias</text>
    <path d="M520 58H555" class="edge"/><rect x="555" y="20" width="225" height="75" rx="8"/><text x="667" y="47">Paired bootstrap</text><text x="667" y="69" class="small">Seed 42 · 1,000 draws</text><text x="667" y="86" class="small">95% interval on tip delta</text>
    <rect x="70" y="156" width="440" height="66" rx="6" class="muted-box"/><rect x="510" y="156" width="220" height="66" rx="6" class="archive-box"/>
    <path d="M70 230H740" class="axis"/><path d="M70 224V236M290 224V236M510 224V236M730 224V236" class="axis"/>
    <text x="70" y="257">−30</text><text x="290" y="257">0</text><text x="510" y="257">+30</text><text x="730" y="257">+60</text>
    <text x="290" y="184">PARK</text><text x="290" y="206" class="small">Smaller positive results remain PARK</text><text x="620" y="184">Assess promotion rules</text><text x="620" y="206" class="small">30 extra tips is the minimum</text>
    <text x="400" y="285" class="small">Challenger correct non-draw tips minus incumbent tips</text>
    <rect x="20" y="315" width="760" height="95" rx="8"/><text x="400" y="341">PROMOTE only with complete prospective evidence AND ≥30 extra tips</text><text x="400" y="365" class="small">Primary rule: positive paired delta with lower 95% bound above zero.</text><text x="400" y="387" class="small">Fallback: positive delta, both cuts non-negative, no bias worsening &gt;2 points at n≥10.</text>`,
  ),
  pull: svg(
    "Squiggle pull feed and cached canonical game resolution",
    370,
    `
    <rect x="20" y="30" width="190" height="70" rx="8"/><text x="115" y="58">SquiggleBot</text><text x="115" y="81" class="small">Only after Jack authorises entry</text>
    <path d="M210 65H280" class="edge"/><rect x="280" y="30" width="220" height="70" rx="8" class="primary-box"/><text x="390" y="58">GET /tips</text><text x="390" y="81" class="small">Optional year and round</text>
    <path d="M500 65H570" class="edge"/><rect x="570" y="30" width="210" height="70" rx="8" class="primary-box"/><text x="675" y="58">match_predictions</text><text x="675" y="81" class="small">Filter exact primary version</text>
    <path d="M390 100V155" class="edge"/><rect x="280" y="155" width="220" height="70" rx="8"/><text x="390" y="183">Resolve canonical gameid</text><text x="390" y="206" class="small">Ordered home and away names</text>
    <path d="M570 190H500" class="edge"/><rect x="570" y="155" width="210" height="70" rx="8"/><text x="675" y="183">Squiggle games read API</text><text x="675" y="206" class="small">Cache API · one hour</text>
    <path d="M280 190H115V250" class="edge"/><rect x="20" y="250" width="760" height="90" rx="8" class="archive-box"/><text x="400" y="277">Shared pure formatter returns the read-API tip shape</text><text x="400" y="299" class="small">gameid · tipteamid · team names · home and tipped-team margins · confidence</text><text x="400" y="323" class="small">A lookup outage keeps primary tips available, omitting unknown ids. Shadows never enter this feed.</text>`,
  ),
};
let markdown = readFileSync("docs/task-41-ship-mode.md", "utf8");
for (const [name, drawing] of Object.entries(diagrams))
  markdown = markdown.replace(`<!-- diagram:${name} -->`, drawing);
const body = Bun.markdown.html(markdown);
const html = `<!doctype html>
<html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>Tipper · Task 41 Ship Mode</title>
<style>
:root{--bg:#f7f8fa;--paper:#fff;--ink:#192636;--muted:#4b6075;--line:#bdcbd6;--blue:#e8f1ff;--green:#e4f3ec;--soft:#edf1f5;--link:#145aaa}
@media(prefers-color-scheme:dark){:root{--bg:#101820;--paper:#16232f;--ink:#e5edf5;--muted:#b0c1d0;--line:#567084;--blue:#183852;--green:#183c33;--soft:#23323f;--link:#8fc5ff}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.65 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}main{max-width:880px;margin:36px auto;padding:36px 40px;background:var(--paper);border:1px solid var(--line);border-radius:14px}h1{font-size:2.2rem;line-height:1.16;letter-spacing:-.04em;margin:.2em 0 .7em}h2{font-size:1.5rem;line-height:1.25;margin:2.3em 0 .8em;padding-top:.6em;border-top:1px solid var(--line)}h3{font-size:1.1rem;margin:1.7em 0 .5em}p{margin:.8em 0 1em}a{color:var(--link);overflow-wrap:anywhere}code{font:0.88em ui-monospace,SFMono-Regular,Consolas,monospace;overflow-wrap:anywhere}pre{overflow:auto;padding:16px;background:var(--soft);border-radius:8px;line-height:1.5}pre code{overflow-wrap:normal}li{margin:.5em 0}blockquote{border-left:3px solid var(--line);margin:1.3em 0;padding:0 18px;color:var(--muted)}table{border-collapse:collapse;width:100%;font-size:.88rem}th,td{padding:9px 8px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}.eyebrow{font-size:.78rem;color:var(--muted);letter-spacing:.12em;text-transform:uppercase}.diagram{margin:1.5em 0;overflow:auto}.diagram svg{display:block;width:100%;min-width:700px;height:auto}.chart rect{fill:var(--paper);stroke:var(--line);stroke-width:1.3}.chart text{text-anchor:middle;fill:var(--ink);font:14px system-ui,sans-serif}.chart .small{font-size:12px;fill:var(--muted)}.chart .edge{stroke:var(--muted);stroke-width:1.6;fill:none;marker-end:var(--arrow)}.chart .axis{stroke:var(--muted);stroke-width:1.4;fill:none}.arrowhead{fill:var(--muted)}.chart .primary-box{fill:var(--blue)}.chart .archive-box{fill:var(--green)}.chart .muted-box{fill:var(--soft)}footer{margin-top:3em;color:var(--muted);font-size:.85rem}@media(max-width:650px){main{margin:0;padding:24px 18px;border:0;border-radius:0}h1{font-size:1.9rem}}@media print{body,main{background:white;color:#111}main{border:0;margin:0;max-width:none}h2{break-after:avoid}.diagram{break-inside:avoid}a{color:inherit}}
</style></head><body><main><div class="eyebrow">Engineering handover · 5 September 2026</div>${body}<footer>Self-contained report. Four inline SVG diagrams. No external scripts, stylesheets, fonts, or tracking.</footer></main></body></html>`;
if ((html.match(/<svg /g) ?? []).length !== 4)
  throw new Error("Report must include all four diagrams");
writeFileSync("docs/task-41-report.html", html);
console.log("Rendered docs/task-41-report.html with four inline SVG diagrams.");
