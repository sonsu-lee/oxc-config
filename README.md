# @sonsu-lee/oxc-config

[![npm](https://img.shields.io/npm/v/@sonsu-lee/oxc-config?color=444&label=)](https://www.npmjs.com/package/@sonsu-lee/oxc-config)
[![CI](https://github.com/sonsu-lee/oxc-config/actions/workflows/ci.yml/badge.svg)](https://github.com/sonsu-lee/oxc-config/actions/workflows/ci.yml)

Composable personal Oxlint and Oxfmt configurations

Shared configurations for [Oxlint](https://oxc.rs/docs/guide/usage/linter) and [Oxfmt](https://oxc.rs/docs/guide/usage/formatter), published to npm under the `@sonsu-lee` scope. The repository and folder are named `oxc-config`, without the scope.

- One line of config: `sonsu()` combines JavaScript, import and TypeScript rules
- Built on Oxlint's `correctness` category at `error`; this package lists only its differences (options, `warn`, `off` and rules outside the category)
- Opt-in [React, JSX accessibility, Next.js and Vitest](#framework-presets), scoped to the paths you pass, with no detection
- Native Oxlint config: `rules`, `settings`, `extends` and `overrides` keep [Oxlint's own merge behavior](#overriding-rules)
- [Every effective rule](#rules) is recorded in a reviewed table, and every rule turned off has a recorded reason
- Shared [Oxfmt settings](#oxfmt): single quotes, one JSX attribute per line, sorted `package.json` scripts, import order preserved
- Authored in TypeScript, shipped as ESM with type declarations, no runtime dependencies

> [!NOTE]
> This is a personal config. Because it inherits an Oxlint category, an Oxlint upgrade can add, remove or recategorize rules. Review the [rule table](test/fixtures/effective-rules.json) diff in each release before you update, and override or fork when a choice does not fit your project.

## Table of Contents

- [Background](#background)
- [Install](#install)
  - [Dependencies](#dependencies)
  - [Updating](#updating)
- [Usage](#usage)
  - [Oxlint](#oxlint)
  - [Oxfmt](#oxfmt)
  - [Scripts](#scripts)
- [Customization](#customization)
  - [Framework presets](#framework-presets)
  - [Overriding rules](#overriding-rules)
  - [Composing individual fragments](#composing-individual-fragments)
- [Rules](#rules)
  - [Warnings in CI](#warnings-in-ci)
  - [Next.js polyfill exception](#nextjs-polyfill-exception)
- [API](#api)
  - [Oxlint exports](#oxlint-exports)
  - [Oxfmt exports](#oxfmt-exports)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
  - [Development](#development)
  - [Upgrading Oxlint](#upgrading-oxlint)
  - [Release](#release)
- [License](#license)

## Background

The rules follow the same structure as the `.oxlintrc.json` files in [sonsu-lee/templates](https://github.com/sonsu-lee/templates): enable Oxlint's `correctness` category at `error`, then add rules on top. Instead of listing every rule, the package inherits the category and keeps only reviewed differences, so an Oxlint upgrade shows up as a diff of the [effective rule table](test/fixtures/effective-rules.json) rather than a silent change. Each difference and its evidence are recorded in [`docs/rule-ledger.md`](docs/rule-ledger.md).

The package depends on two Oxlint mechanisms: category presets and the native `extends` / `overrides` merge. It adds no merge logic of its own.

The TypeScript module layout, explicit exceptions and final user override follow [antfu/eslint-config](https://github.com/antfu/eslint-config). Unlike it, this package does not detect installed frameworks, rename plugin prefixes or change severity inside editors.

## Install

```sh
pnpm add -D --save-exact @sonsu-lee/oxc-config@0.1.1 oxlint@1.85.0 oxfmt@0.70.0
```

The command names this README's release, so the three versions belong together; it also upgrades a project that pins an older exact version.

### Dependencies

Oxlint and Oxfmt are exact, optional peer dependencies that you install yourself. Install only the tool for each subpath you use, so an Oxlint-only project can skip Oxfmt. The package has no runtime dependencies.

Checked with Node 24.21.0 LTS, pnpm 12.6.0, Oxlint 1.85.0, Oxfmt 0.70.0 and TypeScript 6.0.3. Other versions are unverified.

<details>
<summary>Your project already declares <code>oxlint</code>, <code>oxfmt</code> or this package</summary>

<br>

`--save-exact` does not pin a package the project already declares with a range such as `^1.58.0`, `~1.58.0`, `1.x` or `*`. For example, `"oxlint": "^1.58.0"` from the NestJS 12 template becomes `^1.85.0`, and pnpm 12 also reuses a range from `peerDependencies`.

Edit `package.json` instead: remove the three packages from `dependencies` and `optionalDependencies`, keep `peerDependencies` as it is, set them in `devDependencies` as below, and run `pnpm install`.

```json
"devDependencies": {
  "@sonsu-lee/oxc-config": "0.1.1",
  "oxfmt": "0.70.0",
  "oxlint": "1.85.0"
}
```

</details>

<details>
<summary>Migrating from GitHub Packages</summary>

<br>

No token or `.npmrc` entry is needed. Versions up to `0.1.0` were also published to GitHub Packages; if a user or project `.npmrc` routes `@sonsu-lee` to `https://npm.pkg.github.com`, remove that line so the scope resolves from npm.

</details>

### Updating

- Each release names the Oxlint and Oxfmt versions it was checked with. Upgrade the package and both tools together, using the install command of the README for that release.
- Because the preset is Oxlint's category, an Oxlint upgrade can add, remove or recategorize inherited rules. The reviewed rule table changes only with an Oxlint upgrade or an adjustment, so its diff in a release shows every rule change.
- Published versions are never overwritten; a bad release is fixed with a new patch version.

## Usage

### Oxlint

Create `oxlint.config.ts` in your project root:

```ts
// oxlint.config.ts
import sonsu from '@sonsu-lee/oxc-config/oxlint';

export default sonsu();
```

### Oxfmt

Create `oxfmt.config.ts` and append the generated paths specific to your project:

```ts
// oxfmt.config.ts
import { defineConfig } from 'oxfmt';
import { shared } from '@sonsu-lee/oxc-config/oxfmt';

export default defineConfig({
  ...shared,
  ignorePatterns: [...shared.ignorePatterns, '.wrangler/', 'vendor/'],
});
```

> [!TIP]
> In a package without `"type": "module"` (for example a default Next.js app), name the files `oxlint.config.mts` and `oxfmt.config.mts` with the same contents. Both tools find them, and Node no longer prints a `MODULE_TYPELESS_PACKAGE_JSON` warning on every run.

### Scripts

```json
{
  "scripts": {
    "lint": "oxlint .",
    "format": "oxfmt --write .",
    "format:check": "oxfmt --check ."
  }
}
```

## Customization

### Framework presets

Framework and test rules are opt-in. Enable the options your project uses and supply its actual paths:

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

- Each option requires a non-empty array of non-empty, unpadded strings. Missing, sparse or invalid entries throw `TypeError`.
- Omit an option to disable it; booleans are not supported.
- There is no framework, directory or test-runner detection. Oxlint validates glob syntax.
- Accepted arrays and built-in rule data are copied, including nested options, so modifying one result does not change another.

### Overriding rules

Pass native Oxlint fields such as `rules`, `settings`, `ignorePatterns`, `extends` and `overrides` to `sonsu()`:

```ts
// oxlint.config.ts
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

The factory uses Oxlint's native merge behavior rather than a custom deep merge:

- Built-in configs come first in `extends`, followed by your additional `extends` entries in order. Root rules take precedence over extended root rules.
- Matching file overrides apply after root rules. An area's adjustments live in that area's override, so changing root `rules` alone does not change them; add a matching entry to `overrides` to change any rule of an area.
- Your `overrides` follow the presets' overrides, and later matching entries win. Include the plugin when changing a plugin rule.
- `ignorePatterns` is a root list you supply; the factory adds no default ignores. Other native fields keep Oxlint's own semantics.

### Composing individual fragments

Named exports are available when you want only selected areas rather than the factory baseline. Area builders contain only adjustments, so include at least one base fragment (`javascript`, `imports` or `typescript`) to apply the correctness preset at `error`; without one, Oxlint's own default severity (`warn`) applies to the inherited rules.

```ts
// oxlint.config.ts
import { defineConfig } from 'oxlint';
import { javascript, react } from '@sonsu-lee/oxc-config/oxlint';

export default defineConfig({
  extends: [javascript, react({ files: ['src/**/*.{tsx,jsx}'] })],
});
```

## Rules

`sonsu()` combines `javascript`, `imports` and `typescript`. These base fragments inherit Oxlint's `correctness` category at `error` for every enabled plugin (core, `oxc`, `unicorn`, `import`, `typescript`, plus the framework plugins) and list only their differences.

| Area                 | Enabled rules | error / warn | Turned off | Scope                                                  |
| -------------------- | ------------: | -----------: | ---------: | ------------------------------------------------------ |
| `javascript`         |            85 |       85 / 0 |          0 | Linted files                                           |
| `imports`            |             4 |        2 / 2 |          0 | Linted files                                           |
| `typescript`         |            13 |       12 / 1 |          0 | Linted files; `no-require-imports` on `ts`/`tsx`/`mts` |
| `react({ files })`   |            26 |       18 / 8 |          7 | Consumer paths                                         |
| `jsxA11y({ files })` |            32 |      17 / 15 |          3 | Consumer paths                                         |
| `nextjs({ files })`  |            18 |       8 / 10 |          3 | Consumer Next paths                                    |
| `vitest({ files })`  |            14 |        9 / 5 |          4 | Consumer Vitest paths                                  |

With all areas enabled and Oxlint 1.85.0, the result is **151 errors and 41 warnings**. [`test/fixtures/effective-rules.json`](test/fixtures/effective-rules.json) lists every rule, its value and whether it comes from the preset or an adjustment.

- **Errors** block lint for definite correctness and selected native accessibility contracts.
- **Warnings** report contextual checks, authoring preferences and performance advice without blocking. They can still identify real bugs.
- **Turned off** rules are each recorded in [`docs/rule-ledger.md`](docs/rule-ledger.md) with the observed reason, such as false positives on normal product code or missed real cases.
- `typescript` also inherits 15 type-aware correctness rules that run only when a project enables Oxlint's `options.typeAware`; this package does not enable it. `.cts` files are excluded from `no-require-imports`.

### Warnings in CI

`oxlint .` keeps warnings visible and exits successfully when there are no errors. [`--deny-warnings`](https://oxc.rs/docs/guide/usage/linter/cli#handle-warnings) changes the exit policy, not diagnostic severity: use `oxlint --deny-warnings .` only when a project explicitly requires zero warnings. For selected mandatory checks, override those rules to `error` instead. `--quiet` only hides warning reports; it is not an alternative severity policy.

### Next.js polyfill exception

Oxlint reports unsafe URLs and safe-CDN duplicate polyfills under the same rule ID, `nextjs/no-unwanted-polyfillio`. The preset prioritizes blocking the unsafe URLs, so **both findings are errors**, including performance-only duplicates. A consumer that needs the duplicate polyfill can override the rule to `warn`, but then unsafe-URL reports also become nonblocking. This rule is not comprehensive URL security enforcement.

## API

### Oxlint exports

`@sonsu-lee/oxc-config/oxlint`

| Export                                 | Signature                                       | Description                                                                                                                                                         |
| -------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `default` (`sonsu`)                    | `(options?: SonsuOptions) => OxlintConfig`      | Returns your native fields with `extends: [javascript, imports, typescript, ...selected areas, ...options.extends]`. Throws `TypeError` for an invalid area option. |
| `javascript`, `imports`, `typescript`  | `OxlintConfig`                                  | Base fragments. Each declares its plugins, `categories.correctness: 'error'` and its adjustments.                                                                   |
| `react`, `jsxA11y`, `nextjs`, `vitest` | `(options: FilesPresetOptions) => OxlintConfig` | Area builders. Each returns one override that enables its plugin and adjustments for `options.files`.                                                               |

Types:

- `SonsuOptions`: `OxlintConfig` plus optional `react`, `jsxA11y`, `nextjs` and `vitest` area options.
- `FilesPresetOptions`: `{ files: readonly string[] }`.
- `OxlintConfig`: re-exported from Oxlint, so projects that emit declarations can name the factory's result without importing `oxlint` directly.
- `OxlintConfigFragment`, `OxlintOverride`, `RuleSeverity`, `RuleOption`, `RuleValue`: aliases for fragment, override and rule values.

### Oxfmt exports

`@sonsu-lee/oxc-config/oxfmt`

| Export        | Type          | Description                                                                                                                                                                                                           |
| ------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared`      | `OxfmtConfig` | `singleQuote: true`, `singleAttributePerLine: true`, `sortImports: false` (preserves import declaration order), `sortPackageJson: { sortScripts: true }` and `ignorePatterns` for common build and dependency output. |
| `OxfmtConfig` | type          | Shape of `shared`. It stays assignable to Oxfmt's `defineConfig` whether you spread it or pass it directly.                                                                                                           |

## Maintainers

[@sonsu-lee](https://github.com/sonsu-lee)

## Contributing

Questions, bug reports and pull requests are welcome, including from outside contributors. Ask questions and report bugs in [GitHub Issues](https://github.com/sonsu-lee/oxc-config/issues), and open pull requests from a fork against `main`.

- Run `pnpm run verify` and make sure it passes. CI runs the same `Verify` job on every pull request; a maintainer approves the first workflow run of a first-time contributor.
- When you add or change a rule adjustment, check both violating and valid examples and the real file scope, and record the decision in [`docs/rule-ledger.md`](docs/rule-ledger.md). The rules are opinionated, so the maintainer may decline a change that only reflects a different preference; override it in your own config instead.
- Leave `version` and the versions in the [install section](#install) unchanged. Merging a version change publishes to npm, so only the maintainer makes [releases](#release).
- Pull requests are squash-merged, and the pull request title becomes the commit subject. Write it as a [Conventional Commit](https://www.conventionalcommits.org/) such as `fix(oxlint): …` or `docs(readme): …`.

### Development

Use Node 24 LTS (`.node-version` pins the checked release) and pnpm 12.6.0 (`packageManager` pins the CLI). With Corepack, run `corepack enable pnpm` once.

```sh
pnpm install --frozen-lockfile
pnpm run build            # Clean dist, compile TS and emit declarations
pnpm test                 # Build and run public contract tests
pnpm run lint
pnpm run format:check
pnpm run verify:consumer  # Pack, install and exercise a temporary consumer
pnpm run verify           # All of the above checks
pnpm run rules:update     # Rebuild and rewrite the effective rule table, printing every change
pnpm run verify:consumer -- --published 0.1.1  # Install a published version from npm and run the same checks
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
scripts/                 Build, effective rule table and installed-consumer verification
test/                    Public contract tests and fixtures
dist/                    Generated JS and declarations (ignored)
docs/                    Design, rule decisions, verification and raw evidence
```

Workspace documentation: [`docs/design.md`](docs/design.md), [`docs/rule-ledger.md`](docs/rule-ledger.md), [`docs/verification.md`](docs/verification.md). Research documents, source and tests are excluded from the tarball.

### Upgrading Oxlint

Change `oxlint` in `devDependencies`, `peerDependencies` and this README's [install section](#install) together, then run `pnpm run rules:update`. It prints every rule the new version adds to, removes from or recategorizes within the inherited preset, and rewrites `test/fixtures/effective-rules.json`. Review each change: keep it, adjust it in the area module under `src/oxlint/configs/`, and record the decision in `docs/rule-ledger.md`. `pnpm test` fails until the table matches the installed Oxlint, and an adjustment naming a rule the new version no longer has fails the update itself. Commit the table with the upgrade so the pull request diff shows the inherited changes.

### Release

The maintainer releases through pull requests that bump `version` in `package.json` and every version of this package named in the [install section](#install) of this README (the `pnpm add` command and the `devDependencies` example), and nothing else. After such a PR merges, CI verifies the merge commit, publishes the version to npm through trusted publishing with provenance, reinstalls it with `verify:consumer --published`, and creates the `vX.Y.Z` GitHub Release on that commit. Only the commit that changes `version` publishes or releases; other pushes only run verification. If a release run fails, re-run that commit's workflow run; finished steps are skipped.

## License

[MIT](./LICENSE) © 2026 sonsu-lee
