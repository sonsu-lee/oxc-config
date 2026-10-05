# @sonsu-lee/oxc-config

Composable Oxlint and Oxfmt configurations, authored in TypeScript and built as ESM with generated type declarations. Published to npm.

Maintained by [sonsu-lee](https://github.com/sonsu-lee) · [sonsu.dev](https://sonsu.dev).

## Use in a project

Use Node 24 LTS (`.node-version` pins the checked release) and pnpm 12.6.0 (`packageManager` pins the CLI). With Corepack, run `corepack enable pnpm` once. Install the package with the Oxc tools you use:

```sh
pnpm add -D --save-exact @sonsu-lee/oxc-config oxlint@1.85.0 oxfmt@0.70.0
```

`--save-exact` does not pin a package the project already declares with a range such as `^1.58.0`, `~1.58.0`, `1.x` or `*`, so `"oxlint": "^1.58.0"` from the NestJS 12 template becomes `^1.85.0` instead of `1.85.0`. In that case delete the existing tool entries first (`pnpm pkg delete` also succeeds for entries that are not declared), and if `@sonsu-lee/oxc-config` itself is already declared with such a range, run `pnpm remove @sonsu-lee/oxc-config` first as well:

```sh
pnpm pkg delete dependencies.oxlint dependencies.oxfmt devDependencies.oxlint devDependencies.oxfmt
pnpm add -D --save-exact @sonsu-lee/oxc-config oxlint@1.85.0 oxfmt@0.70.0
```

Oxlint and Oxfmt are exact peers, and each release of this package names the tool versions it was checked with, so upgrade the package and the tools together. No token or `.npmrc` entry is needed. Versions up to `0.1.0` were also published to GitHub Packages; if a user or project `.npmrc` routes `@sonsu-lee` to `https://npm.pkg.github.com`, remove that line so the scope resolves from npm.

Install the Oxc tool for each subpath you use; both are optional peers so an Oxlint-only project need not install Oxfmt. The package exports an Oxlint config factory, individual fragments and Oxfmt settings, with no runtime dependencies. The checked environment is Node 24.21.0 LTS, pnpm 12.6.0, Oxlint 1.85.0, Oxfmt 0.70.0 and TypeScript 6.0.3. Other versions are unverified.

The examples below name the config files `oxlint.config.ts` and `oxfmt.config.ts`. In a package without `"type": "module"` (for example a default Next.js app), name them `oxlint.config.mts` and `oxfmt.config.mts` with the same contents; both tools find them, and Node no longer prints a `MODULE_TYPELESS_PACKAGE_JSON` warning on every run.

### Oxlint

```ts
// oxlint.config.ts
import sonsu from '@sonsu-lee/oxc-config/oxlint';

export default sonsu();
```

`sonsu()` combines `javascript`, `imports` and `typescript`. Framework and test rules are opt-in; choose the options your project uses and supply its actual paths:

```ts
// oxlint.config.ts
import sonsu from '@sonsu-lee/oxc-config/oxlint';

export default sonsu({
  react: { files: ['src/**/*.{ts,tsx,js,jsx}'] },
  jsxA11y: { files: ['src/**/*.{tsx,jsx}'] },
  nextjs: { files: ['src/**/*.{ts,tsx,js,jsx}'] },
  vitest: { files: ['tests/**/*.{test,spec}.{ts,tsx,js,jsx}'] },
});
```

Each option requires a non-empty array of non-empty, unpadded strings. Missing, sparse or invalid entries throw `TypeError`. Omit an option to disable it; booleans are not supported. Accepted arrays and built-in rule data are copied, including nested options, so modifying one result does not change another. Oxlint validates glob syntax. There is no framework, directory or test-runner detection.

| Area                 | Current rules | error / warn | Scope                     |
| -------------------- | ------------: | -----------: | ------------------------- |
| `javascript`         |             7 |        7 / 0 | Linted files              |
| `imports`            |             2 |        0 / 2 | Linted files              |
| `typescript`         |             1 |        0 / 1 | `**/*.{ts,tsx,mts}`       |
| `react({ files })`   |            19 |       11 / 8 | Consumer paths            |
| `jsxA11y({ files })` |            32 |      17 / 15 | Consumer paths            |
| `nextjs({ files })`  |             6 |        4 / 2 | Consumer App Router paths |
| `vitest({ files })`  |             7 |        3 / 4 | Consumer Vitest paths     |

With all areas enabled, the current baseline is **42 errors and 32 warnings**. Errors block lint for definite correctness and selected native accessibility contracts. Warnings report contextual checks, authoring preferences and performance advice without blocking. They can still identify real bugs. Each fragment disables implicit `correctness` rules. `typescript` is syntax-only, excludes `.cts`, and does not enable typed lint.

One explicit exception is `nextjs/no-unwanted-polyfillio`: Oxlint reports unsafe URLs and safe-CDN duplicate polyfills under the same rule ID. The shared preset prioritizes blocking the unsafe URLs, so **both findings are errors**, including performance-only duplicates. A consumer that needs the duplicate polyfill can override the rule to `warn`, but then unsafe-URL reports also become nonblocking. This rule is not comprehensive URL security enforcement.

The default `pnpm run lint` runs `oxlint .`: warnings remain visible and exit successfully when there are no errors. [`--deny-warnings`](https://oxc.rs/docs/guide/usage/linter/cli#handle-warnings) changes the exit policy, not diagnostic severity. Use `pnpm exec oxlint --deny-warnings .` only when a project explicitly requires zero warnings. For selected mandatory checks, override those rules to `error` instead. `--quiet` only hides warning reports; it is not an alternative severity policy.

Pass native Oxlint fields such as `rules`, `settings`, `ignorePatterns`, `extends` and `overrides` to `sonsu()`. The factory uses Oxlint's native merge behavior rather than a custom deep merge:

- Built-in configs come first in `extends`, followed by your additional `extends` entries in order. Root rules take precedence over extended root rules.
- Matching file overrides apply after root rules. To change a scoped preset rule, add a matching entry to `overrides`; changing root `rules` alone does not override a scoped rule.
- Your `overrides` follow the presets' overrides, and later matching entries win. Include the plugin when changing a plugin rule.
- `ignorePatterns` is a root list you supply; the factory adds no default ignores. Other native fields keep Oxlint's own semantics.

```ts
import sonsu from '@sonsu-lee/oxc-config/oxlint';

export default sonsu({
  react: { files: ['src/**/*.{tsx,jsx}'] },
  ignorePatterns: ['dist/**'],
  rules: { 'no-debugger': 'warn' },
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

#### Composing individual fragments

Named exports remain available when you want only selected areas rather than the factory's baseline:

```ts
import { defineConfig } from 'oxlint';
import { javascript, react } from '@sonsu-lee/oxc-config/oxlint';

export default defineConfig({
  extends: [javascript, react({ files: ['src/**/*.{tsx,jsx}'] })],
});
```

Use the exported `SonsuOptions` type for reusable factory options. `OxlintConfig` is re-exported from Oxlint, so projects that emit declarations can name the factory's result without importing `oxlint` directly. The `FilesPresetOptions` and existing fragment types remain available.

### Oxfmt

```ts
// oxfmt.config.ts
import { defineConfig } from 'oxfmt';
import { shared } from '@sonsu-lee/oxc-config/oxfmt';

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
pnpm run verify:consumer -- --published 0.1.0  # Install a published version from npm and run the same checks
```

`pnpm run format` formats maintained files. Research evidence and regression fixtures are excluded. The consumer check needs registry access, uses a temporary pnpm store, and removes its own temporary directory; pass `pnpm run verify:consumer -- --keep` to inspect it.

```text
src/
  oxlint/
    index.ts             Public exports and type aliases
    factory.ts           Default Oxlint composition and typed options
    scoped.ts            Shared files validation and override construction
    configs/             One module per rule area
  oxfmt/index.ts         Shared formatter options
scripts/                 Build and installed-consumer verification
test/                    Public contract tests and fixtures
dist/                    Generated JS and declarations (ignored)
docs/                    Design, rule decisions, verification and raw evidence
```

Workspace documentation: `docs/design.md`, `docs/rule-ledger.md`, `docs/verification.md`. Research documents, source and tests are excluded from the tarball.

### Release

Releases are pull requests that only bump `version` in `package.json`. After such a PR merges, CI verifies the merge commit, publishes the version to npm through trusted publishing with provenance, reinstalls it with `verify:consumer --published`, and creates the `vX.Y.Z` GitHub Release on that commit. Only the commit that changes `version` publishes or releases; other pushes only run verification. If a release run fails, re-run that commit's workflow run; finished steps are skipped. Published versions are never overwritten; fix a bad release with a new patch version.
