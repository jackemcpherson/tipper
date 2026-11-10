import { execFileSync } from "node:child_process";

/** The HTTP tests run the real bundle, so build it from the current source before any test. */
export default function setup(): void {
  execFileSync("bun", ["tools/build.ts"], { stdio: "inherit", env: { ...process.env, CI: "" } });
}
