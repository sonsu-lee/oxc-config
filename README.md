# @sonsu/oxc-config

Composable Oxlint and Oxfmt configurations, authored in TypeScript and built as ESM with generated type declarations. This is a private local package; it has not been published.

## Use in a project

Use Node 24 LTS (`.node-version` pins the checked release) and pnpm 12.6.0 (`packageManager` pins the CLI). With Corepack, run `corepack enable pnpm` once. Build a tarball in this repository, then install it in the consumer:

```sh
# This repository
pnpm install --frozen-lockfile
pnpm pack

# Consumer project: replace the tarball path
pnpm add -D /path/to/sonsu-oxc-config-0.0.0.tgz oxlint@1.85.0 oxfmt@0.70.0
```

`pnpm pack` runs the build automatically. Install the Oxc tool for each subpath you use; both are optional peers so an Oxlint-only project need not install Oxfmt. The package exports objects and has no runtime dependencies. The checked environment is Node 24.21.0 LTS, pnpm 12.6.0, Oxlint 1.85.0, Oxfmt 0.70.0 and TypeScript 6.0.3. Other versions are unverified.

### Oxlint

```ts
// oxlint.config.ts
import { defineConfig } from 'oxlint';
import {
  imports,
  javascript,
  jsxA11y,
  nextjs,
  react,
  typescript,
  vitest,
} from '@sonsu/oxc-config/oxlint';

export default defineConfig({
  extends: [
    javascript,
    imports,
    typescript,
    react({ files: ['src/**/*.{ts,tsx,js,jsx}'] }),
    jsxA11y({ files: ['src/**/*.{tsx,jsx}'] }),
    nextjs({ files: ['src/**/*.{ts,tsx,js,jsx}'] }),
    vitest({ files: ['tests/**/*.{test,spec}.{ts,tsx,js,jsx}'] }),
  ],
});
```

Select the areas your project uses and supply its actual paths. `react`, `jsxA11y`, `nextjs`, and `vitest` require a non-empty array of non-empty, unpadded strings. Missing, sparse or invalid entries throw `TypeError`. Accepted arrays and each result’s rule data are copied, including nested options; Oxlint validates glob syntax. There is no framework, directory or test-runner detection.

| Area                 | Current rules | error / warn | Scope                     |
| -------------------- | ------------: | -----------: | ------------------------- |
| `javascript`         |             7 |        7 / 0 | Linted files              |
| `imports`            |             2 |        0 / 2 | Linted files              |
| `typescript`         |             1 |        0 / 1 | `**/*.{ts,tsx,mts}`       |
| `react({ files })`   |            19 |       11 / 8 | Consumer paths            |
| `jsxA11y({ files })` |            32 |      17 / 15 | Consumer paths            |
| `nextjs({ files })`  |             6 |        4 / 2 | Consumer App Router paths |
| `vitest({ files })`  |             7 |        3 / 4 | Consumer Vitest paths     |

The current baseline is **42 errors and 32 warnings**. Errors block lint for definite correctness and selected native accessibility contracts. Warnings report contextual checks, authoring preferences and performance advice without blocking. They can still identify real bugs. Each fragment disables implicit `correctness` rules. `typescript` is syntax-only, excludes `.cts`, and does not enable typed lint.

One explicit exception is `nextjs/no-unwanted-polyfillio`: Oxlint reports unsafe URLs and safe-CDN duplicate polyfills under the same rule ID. The shared preset prioritizes blocking the unsafe URLs, so **both findings are errors**, including performance-only duplicates. A consumer that needs the duplicate polyfill can override the rule to `warn`, but then unsafe-URL reports also become nonblocking. This rule is not comprehensive URL security enforcement.

The default `pnpm run lint` runs `oxlint .`: warnings remain visible and exit successfully when there are no errors. [`--deny-warnings`](https://oxc.rs/docs/guide/usage/linter/cli#handle-warnings) changes the exit policy, not diagnostic severity. Use `pnpm exec oxlint --deny-warnings .` only when a project explicitly requires zero warnings. For selected mandatory checks, override those rules to `error` instead. `--quiet` only hides warning reports; it is not an alternative severity policy.

Add project `settings`, `ignorePatterns` and overrides in the root consumer config. When overriding a plugin rule, include the plugin in that override:

```ts
// The consumer can add these fields alongside extends.
defineConfig({
  settings: { react: { version: '19.0.0' } },
  overrides: [
    {
      files: ['src/legacy/**'],
      plugins: ['react'],
      rules: { 'react/rules-of-hooks': 'off' },
    },
  ],
});
```

### Oxfmt

```ts
// oxfmt.config.ts
import { defineConfig } from 'oxfmt';
import { shared } from '@sonsu/oxc-config/oxfmt';

export default defineConfig({
  ...shared,
  ignorePatterns: [...shared.ignorePatterns, '.wrangler/', 'vendor/'],
});
```

`shared` enables single quotes, one JSX attribute per line and package-script sorting. `sortImports: false` preserves import declaration order. Append generated paths specific to your project to `ignorePatterns`.

## Development

```sh
pnpm install --frozen-lockfile
pnpm run build            # Clean dist, compile TS and emit declarations
pnpm test                 # Build and run public contract tests
pnpm run lint
pnpm run format:check
pnpm run verify:consumer  # Pack, install and exercise a temporary consumer
pnpm run verify           # All of the above checks
```

`pnpm run format` formats maintained files. Research evidence and regression fixtures are excluded. The consumer check needs registry access, uses a temporary pnpm store, and removes its own temporary directory; pass `pnpm run verify:consumer -- --keep` to inspect it.

```text
src/
  oxlint/
    index.ts             Public exports and type aliases
    scoped.ts            Shared files validation and override construction
    configs/             One module per rule area
  oxfmt/index.ts         Shared formatter options
scripts/                 Build and installed-consumer verification
test/                    Public contract tests and fixtures
dist/                    Generated JS and declarations (ignored)
docs/                    Design, rule decisions, verification and raw evidence
```

Workspace documentation: `docs/design.md`, `docs/rule-ledger.md`, `docs/verification.md`. Research documents, source and tests are excluded from the tarball.
