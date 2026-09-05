import { execFileSync } from "node:child_process";

const revision = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (!/^[0-9a-f]{40}$/.test(revision)) throw new Error("Build requires a complete Git revision");
if (
  process.env.CI &&
  execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], {
    encoding: "utf8",
  }).trim()
)
  throw new Error("Published artifact requires a clean tracked tree");
execFileSync(
  "bunx",
  [
    "wrangler",
    "deploy",
    "--dry-run",
    "--outdir",
    "dist-worker",
    "--define",
    `SOURCE_REVISION:${JSON.stringify(revision)}`,
  ],
  { stdio: "inherit" },
);
