import { defineConfig } from "vite-plus";

const NOT_OWNED = [
  ".claude/**",
  "tools/oxlint/anti-slop/**",
  "dist-worker/**",
  "src/env.d.ts",
  "styles/**",
];

export default defineConfig({
  define: {
    // The build embeds the Git revision; tests run against an unbuilt source tree.
    SOURCE_REVISION: JSON.stringify("development"),
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
      denyWarnings: true,
    },
    ignorePatterns: NOT_OWNED,
    jsPlugins: [
      { name: "anti-slop", specifier: "./tools/oxlint/anti-slop/index.ts" },
      { name: "anti-slop-effect", specifier: "./tools/oxlint/anti-slop/effect/index.ts" },
    ],
    rules: {
      "typescript/no-explicit-any": "error",
      "typescript/no-non-null-assertion": "error",
      "typescript/no-floating-promises": "error",
      "typescript/no-misused-promises": "error",
      "typescript/no-unnecessary-condition": "error",
      "typescript/no-unnecessary-type-assertion": "error",
      "typescript/explicit-module-boundary-types": "error",

      "oxc/no-accumulating-spread": "error",
      "anti-slop/no-array-filter-map": "error",
      "anti-slop/no-reduce-accumulator-copy": "error",
      "anti-slop/no-chained-type-assertions": "error",
      "anti-slop/no-conditional-empty-object-spread": "error",
      "anti-slop/no-known-value-widening": "error",
      "anti-slop/no-module-mocking": "error",
      "anti-slop/no-object-parameters": "error",
      "anti-slop/no-reflect-apply": "error",
      "anti-slop/no-reflect-get": "error",
      "anti-slop/no-runtime-typeof": "error",
      "anti-slop/no-shape-in-symbol-names": "error",
      "anti-slop/no-unknown-parameters": "error",
      "anti-slop/no-unknown-returns": "error",
      "anti-slop/no-unknown-type-aliases": "error",
      "anti-slop/no-unsafe-dictionary-type": "error",
      "anti-slop/no-widen-then-assert": "error",
      "anti-slop/require-readable-spacing": "error",
      "anti-slop/require-safety-comment-for-type-assertion": "error",

      "anti-slop-effect/no-manual-effect-error-tag": "error",
      "anti-slop-effect/no-manual-tag-comparison": "error",
      "anti-slop-effect/no-manual-tagged-construction": "error",
      "anti-slop-effect/no-service-constructor-imports": "error",
      "anti-slop-effect/prefer-effect-match": "error",
    },
  },
  fmt: {
    useTabs: false,
    tabWidth: 2,
    printWidth: 100,
    // rumdl is the only Markdown formatter.
    ignorePatterns: ["**/*.md", ...NOT_OWNED],
  },
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    globalSetup: ["test/build.ts"],
  },
});
