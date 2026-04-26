import { Command } from "commander";
import { loadConfig } from "../../../config/store.js";

export const diffCommand = new Command("diff")
  .description("Show differences between two configs")
  .argument("<id1>", "First config ID")
  .argument("<id2>", "Second config ID")
  .action((_id1: string, _id2: string, _opts: unknown, command: Command) => {
    const [id1, id2] = command.args as [string, string];
    const config1 = loadConfig(id1);
    const config2 = loadConfig(id2);

    const diffs = findDiffs(config1, config2);

    if (diffs.length === 0) {
      console.log(`Configs '${id1}' and '${id2}' are identical (ignoring id and notes).`);
      return;
    }

    console.log(`Diff: ${id1} → ${id2}`);
    console.log("─".repeat(60));
    for (const { path, left, right } of diffs) {
      console.log(`  ${path}: ${JSON.stringify(left)} → ${JSON.stringify(right)}`);
    }
  });

interface DiffEntry {
  path: string;
  left: unknown;
  right: unknown;
}

function findDiffs(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  prefix = "",
): DiffEntry[] {
  const diffs: DiffEntry[] = [];
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);

  for (const key of allKeys) {
    if (key === "id" || key === "notes") continue;
    const path = prefix ? `${prefix}.${key}` : key;
    const va = a[key];
    const vb = b[key];

    if (
      typeof va === "object" &&
      va !== null &&
      typeof vb === "object" &&
      vb !== null &&
      !Array.isArray(va) &&
      !Array.isArray(vb)
    ) {
      diffs.push(...findDiffs(va as Record<string, unknown>, vb as Record<string, unknown>, path));
    } else if (JSON.stringify(va) !== JSON.stringify(vb)) {
      diffs.push({ path, left: va, right: vb });
    }
  }

  return diffs;
}
