import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const temporaryRoot = mkdtempSync(join(tmpdir(), 'oxc-config-consumer-'));
const packageDirectory = join(temporaryRoot, 'package');
const consumerDirectory = join(temporaryRoot, 'consumer');
const storeDirectory = join(temporaryRoot, 'pnpm-store');
const { devDependencies, packageManager, scripts } = JSON.parse(
  readFileSync(join(repositoryRoot, 'package.json'), 'utf8'),
);
const toolVersions = ['oxlint', 'oxfmt', 'typescript'].map(
  (name) => `${name}@${devDependencies[name]}`,
);
const keepTemporaryFiles = process.argv.includes('--keep');

function run(command, args, { cwd, env, expectedStatus = 0, maxBuffer = 10 * 1024 * 1024 } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: 'utf8',
    maxBuffer,
    timeout: 180_000,
  });

  if (result.error) {
    throw result.error;
  }

  if (expectedStatus !== null && result.status !== expectedStatus) {
    throw new Error(
      `${command.split('/').at(-1)} exited ${result.status} (signal ${result.signal ?? 'none'})\n${result.stdout?.slice(0, 1200) ?? ''}\n${result.stderr?.slice(0, 1200) ?? ''}`,
    );
  }

  return { stdout: result.stdout, stderr: result.stderr, status: result.status };
}

function writeFile(relativePath, contents) {
  const path = join(consumerDirectory, relativePath);
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, contents);
  return path;
}

const diagnosticPlugins = { eslint: '', 'react-hooks': 'react', next: 'nextjs' };

function ruleIdOf(diagnostic) {
  const [, plugin, name] =
    String(diagnostic.code ?? '').match(/^(?:eslint-plugin-)?([^()]+)\(([^()]+)\)$/) ?? [];
  assert.ok(name, `unrecognized diagnostic code ${JSON.stringify(diagnostic.code)}`);
  const prefix = diagnosticPlugins[plugin] ?? plugin;
  return prefix ? `${prefix}/${name}` : name;
}

function diagnosticsFrom(stdout) {
  const parsed = JSON.parse(stdout);
  if (Array.isArray(parsed)) {
    return parsed.flatMap((entry) => entry.diagnostics ?? []);
  }
  if (Array.isArray(parsed.diagnostics)) {
    return parsed.diagnostics;
  }
  if (Array.isArray(parsed.files)) {
    return parsed.files.flatMap((entry) => entry.diagnostics ?? entry.messages ?? []);
  }
  return [];
}

function severityOf(diagnostic) {
  const severity = String(diagnostic.severity ?? '').toLowerCase();
  if (severity === '2' || severity.includes('error') || severity === 'deny') {
    return 'error';
  }
  if (severity === '1' || severity.includes('warn')) {
    return 'warn';
  }
  return severity;
}

function lint(oxlintPath, config, files, expectedStatus, flags = []) {
  const { stdout } = run(oxlintPath, ['--config', config, '--format', 'json', ...flags, ...files], {
    cwd: consumerDirectory,
    expectedStatus,
  });
  return diagnosticsFrom(stdout);
}

function assertDiagnostic(diagnostics, id, severity) {
  const diagnostic = diagnostics.find((entry) => ruleIdOf(entry) === id);
  assert.ok(
    diagnostic,
    `expected ${id} ${severity}; received: ${JSON.stringify(diagnostics, null, 2)}`,
  );
  assert.equal(severityOf(diagnostic), severity, JSON.stringify(diagnostic, null, 2));
}

function assertNoDiagnostic(diagnostics, id) {
  assert.equal(
    diagnostics.some((entry) => ruleIdOf(entry) === id),
    false,
    `unexpected ${id}: ${JSON.stringify(diagnostics, null, 2)}`,
  );
}

function configFor(imports) {
  return `import { defineConfig } from 'oxlint'\nimport { ${imports} } from '@sonsu-lee/oxc-config/oxlint'\nexport default defineConfig({ extends: [${imports}] })\n`;
}

function factoryConfig(options = '') {
  return `import sonsu from '@sonsu-lee/oxc-config/oxlint'\nexport default sonsu(${options})\n`;
}

try {
  mkdirSync(packageDirectory);
  mkdirSync(consumerDirectory);
  writeFileSync(
    join(consumerDirectory, 'package.json'),
    JSON.stringify({ private: true, type: 'module', packageManager }),
  );

  const packed = run('pnpm', ['pack', '--json', '--pack-destination', packageDirectory], {
    cwd: repositoryRoot,
  });
  const metadata = JSON.parse(packed.stdout);
  const packedPaths = new Set(metadata.files.map((file) => file.path));
  for (const path of [
    'package.json',
    'README.md',
    'dist/oxlint/index.js',
    'dist/oxlint/index.d.ts',
    'dist/oxfmt/index.js',
    'dist/oxfmt/index.d.ts',
  ]) {
    assert.ok(packedPaths.has(path), `tarball is missing ${path}`);
  }
  for (const path of packedPaths) {
    assert.ok(
      path === 'README.md' || path === 'package.json' || path.startsWith('dist/'),
      `tarball contains development-only file ${path}`,
    );
  }

  const tarballPath = resolve(packageDirectory, metadata.filename);
  run(
    'pnpm',
    [
      'add',
      '--save-dev',
      '--save-exact',
      '--store-dir',
      storeDirectory,
      tarballPath,
      ...toolVersions,
    ],
    { cwd: consumerDirectory },
  );

  const oxlintPath = join(consumerDirectory, 'node_modules/.bin/oxlint');
  const oxfmtPath = join(consumerDirectory, 'node_modules/.bin/oxfmt');
  const tscPath = join(consumerDirectory, 'node_modules/.bin/tsc');

  writeFile('src/values.js', 'export const a = 1\nexport const b = 2\n');
  writeFile('src/core-invalid.js', 'debugger\n');
  writeFile('src/core-valid.js', 'export const ready = true\n');
  writeFile(
    'src/import-invalid.ts',
    "import { b, a } from './values.js'\nimport { a as duplicate } from './values.js'\nvoid [a, b, duplicate]\n",
  );
  writeFile('src/import-valid.ts', "import { a, b } from './values.js'\nvoid [a, b]\n");
  writeFile('src/require-invalid.ts', "const fs = require('node:fs')\nvoid fs\n");
  writeFile('src/require-valid.mts', "import { readFile } from 'node:fs'\nvoid readFile\n");
  writeFile(
    'src/react-invalid.tsx',
    "import { useState } from 'react'\nexport function Broken({ ready }) {\n  if (ready) useState(0)\n  return <div />\n}\n",
  );
  writeFile('src/react-valid.tsx', 'export function Ready() { return <main /> }\n');
  writeFile(
    'src/a11y-invalid.tsx',
    'export function Image() { return <img src="/image.png" /> }\n',
  );
  writeFile(
    'src/a11y-valid.tsx',
    'export function Image() { return <img src="/image.png" alt="A view" /> }\n',
  );
  writeFile(
    'src/next-invalid.tsx',
    "'use client'\nexport default async function ClientPage() { return <main /> }\n",
  );
  writeFile(
    'src/next-valid.tsx',
    "'use client'\nexport function ClientPage() { return <main /> }\n",
  );
  writeFile(
    'src/override.tsx',
    'import { useState } from \'react\'\nexport function Overridden({ ready }) {\n  if (ready) useState(0)\n  return <img src="/image.png" />\n}\n',
  );
  writeFile(
    'src/not-test.ts',
    "import { it } from 'vitest'\nit.only('focused', () => {})\nvoid it\n",
  );
  writeFile('src/ignored.cts', "const fs = require('node:fs')\nvoid fs\n");
  writeFile(
    'outside/react-invalid.tsx',
    'import { useState } from \'react\'\nexport function Broken({ ready }) { if (ready) useState(0); return <img src="/x.png" /> }\n',
  );
  writeFile(
    'outside/focused.test.ts',
    "import { it } from 'vitest'\nit.only('focused', () => {})\nvoid it\n",
  );
  writeFile('tests/focused.test.ts', "import { it } from 'vitest'\nit.only('focused', () => {})\n");
  writeFile(
    'tests/normal.test.ts',
    "import { it, expect } from 'vitest'\nit('works', () => { expect(1).toBe(1) })\n",
  );

  const areaExpressions = {
    javascript: 'javascript',
    imports: 'imports',
    typescript: 'typescript',
    react: "react({ files: ['src/**/*.{ts,tsx,js,jsx}'] })",
    jsxA11y: "jsxA11y({ files: ['src/**/*.{tsx,jsx}'] })",
    nextjs: "nextjs({ files: ['src/**/*.{ts,tsx,js,jsx}'] })",
    vitest: "vitest({ files: ['tests/**/*.test.ts', 'tests/**/*.e2e-spec.ts'] })",
  };

  for (const [name, expression] of Object.entries(areaExpressions)) {
    const imports = name;
    writeFile(
      `oxlint-${name}.config.mts`,
      configFor(imports).replace(`[${imports}]`, `[${expression}]`),
    );
  }

  // Reuse the saved input sources; expected levels come from the reviewed contract,
  // while each isolated rule value is imported from the installed tarball.
  const readEvidence = (name) =>
    JSON.parse(readFileSync(join(repositoryRoot, 'docs/evidence', name), 'utf8'));
  const historicalFiles = readEvidence('rule-fixtures.json').rules;
  const standaloneCases = [
    ...readEvidence('base-rule-probes.json'),
    ...readEvidence('followup-probes.json').isolatedRules,
  ];
  // The archived "invalid" async describe actually produced zero diagnostics.
  // Vitest permits async suites; use callback arguments for a real violation.
  standaloneCases.find((entry) => entry.rule === 'vitest/valid-describe-callback').invalidSource =
    "import { describe } from 'vitest'; describe('suite', (unexpected) => { void unexpected });";
  const expectedConfig = JSON.parse(
    readFileSync(join(repositoryRoot, 'test/fixtures/selected-rules.json'), 'utf8'),
  );
  const expectedRules = Object.assign(
    {},
    expectedConfig.rules,
    ...expectedConfig.overrides.map((entry) => entry.rules),
  );
  const areaOf = (id) =>
    id.startsWith('jsx-a11y/')
      ? 'jsxA11y'
      : id.startsWith('import/') || id === 'sort-imports'
        ? 'imports'
        : id.includes('/')
          ? id.split('/')[0]
          : 'javascript';
  const ruleInputs = (id, kind) => {
    const standalone = standaloneCases.find((entry) => entry.rule === id);
    let inputs;
    if (standalone) {
      inputs = { 'input.test.tsx': standalone[`${kind}Source`] };
    } else {
      assert.ok(historicalFiles[id], `missing historical inputs for ${id}`);
      inputs = Object.fromEntries(
        Object.entries(historicalFiles[id].files)
          .filter(
            ([path]) =>
              !path.endsWith('.json') &&
              (path.startsWith(`${kind}/`) ||
                path === `${kind}.tsx` ||
                path === `${kind}.ts` ||
                path.endsWith(`-${kind}.tsx`)),
          )
          .map(([path, source]) => [path.replace(new RegExp(`^${kind}/`), ''), source]),
      );
    }
    assert.ok(Object.keys(inputs).length, `${id} ${kind} must have a source`);
    return inputs;
  };
  const ruleFailures = [];
  for (const [id, expectedValue] of Object.entries(expectedRules)) {
    try {
      const name = areaOf(id);
      const expression = ['react', 'jsxA11y', 'nextjs', 'vitest'].includes(name)
        ? `${name}({ files: ['**/*'] })`
        : name;
      const severity = Array.isArray(expectedValue) ? expectedValue[0] : expectedValue;
      for (const kind of ['invalid', 'valid']) {
        const directory = `rule-cases/${id.replace('/', '-')}/${kind}`;
        const inputs = ruleInputs(id, kind);
        for (const [path, source] of Object.entries(inputs))
          writeFile(`${directory}/${path}`, source);
        writeFile(
          `${directory}/oxlint.config.mts`,
          `import { defineConfig } from 'oxlint'\nimport { ${name} } from '@sonsu-lee/oxc-config/oxlint'\nconst fragment = ${expression}\nconst area = fragment.rules ? fragment : fragment.overrides[0]\nexport default defineConfig({ categories: { correctness: 'off' }, plugins: area.plugins, rules: { ${JSON.stringify(id)}: area.rules[${JSON.stringify(id)}] } })\n`,
        );
        const result = run(
          oxlintPath,
          ['--config', 'oxlint.config.mts', '--format', 'json', ...Object.keys(inputs)],
          {
            cwd: join(consumerDirectory, directory),
            expectedStatus: kind === 'invalid' && severity === 'error' ? 1 : 0,
          },
        );
        const diagnostics = diagnosticsFrom(result.stdout);
        if (kind === 'invalid') assertDiagnostic(diagnostics, id, severity);
        else
          assert.equal(
            diagnostics.length,
            0,
            `${id} normal fixture: ${JSON.stringify(diagnostics)}`,
          );
      }
    } catch (error) {
      ruleFailures.push(`${id}: ${error.message}`);
    }
  }
  assert.deepEqual(ruleFailures, [], 'per-rule installed-consumer regressions');
  console.log(
    `Verified normal/violation inputs and exit status for all ${Object.keys(expectedRules).length} selected rules.`,
  );

  // Run the same inputs through the README factory with consumer path globs.
  // Other rules may also report; only the target is asserted.
  const composedConfig = factoryConfig(`{
  react: { files: ['src/**/*.{ts,tsx,js,jsx}'] },
  jsxA11y: { files: ['src/**/*.{tsx,jsx}'] },
  nextjs: { files: ['src/**/*.{ts,tsx,js,jsx}'] },
  vitest: { files: ['tests/**/*.{test,spec}.{ts,tsx,js,jsx}'] },
}`);
  writeFile('oxlint-composed.config.mts', composedConfig);
  const nextRouterPaths = {
    app: {
      'src/app/page.tsx': 'src/app/page.tsx',
      'src/pages/index.tsx': 'src/app/page.tsx',
      'src/pages/about.tsx': 'src/app/about/page.tsx',
    },
    pages: {
      'src/app/page.tsx': 'src/pages/index.tsx',
      'src/pages/index.tsx': 'src/pages/index.tsx',
      'src/pages/about.tsx': 'src/pages/about.tsx',
    },
  };
  const composedFailures = [];
  for (const [id, expectedValue] of Object.entries(expectedRules)) {
    const area = areaOf(id);
    const severity = Array.isArray(expectedValue) ? expectedValue[0] : expectedValue;
    for (const kind of ['invalid', 'valid']) {
      for (const router of area === 'nextjs' ? ['app', 'pages'] : [undefined]) {
        try {
          const directory = `composed-cases/${id.replace('/', '-')}/${router ? `${kind}-${router}` : kind}`;
          const placedPaths = Object.entries(ruleInputs(id, kind)).map(([path, source]) => {
            const placed = router
              ? nextRouterPaths[router][path]
              : `${area === 'vitest' ? 'tests' : 'src'}/${path}`;
            assert.ok(placed, `no ${router} router placement for ${path}`);
            writeFile(`${directory}/${placed}`, source);
            return placed;
          });
          writeFile(`${directory}/oxlint.config.mts`, composedConfig);
          const { stdout, status } = run(
            oxlintPath,
            ['--config', 'oxlint.config.mts', '--format', 'json', ...placedPaths],
            { cwd: join(consumerDirectory, directory), expectedStatus: null },
          );
          const diagnostics = diagnosticsFrom(stdout);
          const targets = diagnostics.filter((diagnostic) => ruleIdOf(diagnostic) === id);
          if (kind === 'invalid') {
            assert.ok(targets.length > 0, `${id} not reported: ${JSON.stringify(diagnostics)}`);
            for (const diagnostic of targets)
              assert.equal(severityOf(diagnostic), severity, JSON.stringify(diagnostic));
          } else {
            assert.equal(targets.length, 0, `unexpected ${id}: ${JSON.stringify(targets)}`);
          }
          const errorStatus = diagnostics.some((diagnostic) => severityOf(diagnostic) === 'error')
            ? 1
            : 0;
          assert.equal(status, errorStatus, `exit status for ${JSON.stringify(diagnostics)}`);
        } catch (error) {
          composedFailures.push(`${id} ${kind}${router ? ` (${router})` : ''}: ${error.message}`);
        }
      }
    }
  }
  assert.deepEqual(composedFailures, [], 'composed installed-consumer regressions');
  console.log(
    `Verified all ${Object.keys(expectedRules).length} selected rules through the README composition, including nextjs rules under src/app and src/pages.`,
  );

  writeFile('oxlint-baseline.config.mts', factoryConfig());
  writeFile(
    'oxlint.config.mts',
    factoryConfig(`{
  react: { files: ['src/**/*.{ts,tsx,js,jsx}'] },
  jsxA11y: { files: ['src/**/*.{tsx,jsx}'] },
  nextjs: { files: ['src/**/*.{ts,tsx,js,jsx}'] },
  vitest: { files: ['tests/**/*.{test,spec}.{ts,tsx,js,jsx}', 'tests/**/*.e2e-spec.ts'] },
  ignorePatterns: ['ignored-first/**', 'ignored-second/**'],
  overrides: [
    { files: ['src/override.tsx'], plugins: ['react', 'jsx-a11y'], rules: { 'react/rules-of-hooks': 'warn', 'jsx-a11y/alt-text': 'warn' } },
    { files: ['src/override.tsx'], plugins: ['react', 'jsx-a11y'], rules: { 'react/rules-of-hooks': 'off', 'jsx-a11y/alt-text': 'off' } },
  ],
  settings: { react: { version: '19.0.0' } },
}`),
  );
  writeFile('oxlint-custom-root.config.mts', factoryConfig("{ rules: { 'no-debugger': 'warn' } }"));
  writeFile(
    'oxlint-user-extends.config.mts',
    factoryConfig(`{
  react: { files: ['src/**/*.tsx'] },
  extends: [
    { rules: { 'no-debugger': 'off' } },
    {
      rules: { 'no-debugger': 'warn' },
      overrides: [{ files: ['src/react-invalid.tsx'], plugins: ['react'], rules: { 'react/rules-of-hooks': 'off' } }],
    },
  ],
}`),
  );
  writeFile(
    'oxlint-root-scoped.config.mts',
    factoryConfig(`{
  react: { files: ['src/**/*.tsx'] },
  plugins: ['react'],
  rules: { 'react/rules-of-hooks': 'off' },
}`),
  );
  writeFile(
    'factory-types.mts',
    `import sonsu, { type SonsuOptions } from '@sonsu-lee/oxc-config/oxlint'
import type { OxlintConfig } from 'oxlint'
const options: SonsuOptions = {
  react: { files: ['src/**/*.tsx'] },
  jsxA11y: { files: ['src/**/*.jsx'] },
  nextjs: { files: ['src/app/**/*.tsx'] },
  vitest: { files: ['tests/**/*.test.ts'] },
  extends: [{ rules: { 'no-debugger': 'warn' } }],
  rules: { 'no-debugger': 'off' },
  ignorePatterns: ['generated/**', 'vendor/**'],
  overrides: [{ files: ['src/**/*.tsx'], plugins: ['react'], rules: { 'react/rules-of-hooks': 'off' } }],
}
const config: OxlintConfig = sonsu(options)
const empty: OxlintConfig = sonsu({})
const omitted: OxlintConfig = sonsu()
void [config, empty, omitted]
${['react', 'jsxA11y', 'nextjs', 'vitest']
  .map(
    (name) => `// @ts-expect-error ${name} requires explicit files
sonsu({ ${name}: {} })
// @ts-expect-error ${name} does not accept boolean toggles
sonsu({ ${name}: true })`,
  )
  .join('\n')}
// @ts-expect-error disabling an area means omitting it, not passing false
sonsu({ react: false })
// @ts-expect-error files must be an array
sonsu({ react: { files: 'src/**/*.tsx' } })
// @ts-expect-error unsupported factory option
sonsu({ autodetect: true })
// @ts-expect-error scoped options only accept native supported fields
sonsu({ vitest: { files: ['tests/**/*.ts'], autodetect: true } })
`,
  );
  writeFile(
    'oxfmt.config.mts',
    "import { defineConfig } from 'oxfmt'\nimport { shared } from '@sonsu-lee/oxc-config/oxfmt'\nexport default defineConfig({ ...shared, ignorePatterns: [...shared.ignorePatterns, '.wrangler/', 'vendor/'], overrides: [{ files: ['format/special.ts'], options: { singleQuote: false } }] })\n",
  );

  const typeConfigs = [
    'oxlint.config.mts',
    'oxfmt.config.mts',
    'factory-types.mts',
    ...readdirSync(consumerDirectory).filter(
      (file) => file.startsWith('oxlint-') && file.endsWith('.config.mts'),
    ),
  ];
  run(
    tscPath,
    [
      '--noEmit',
      '--strict',
      '--module',
      'NodeNext',
      '--moduleResolution',
      'NodeNext',
      '--target',
      'ES2022',
      ...typeConfigs,
    ],
    { cwd: consumerDirectory },
  );

  writeFile('oxlint-malformed-glob.config.mts', factoryConfig("{ react: { files: ['src/['] } }"));
  const malformedGlob = run(
    oxlintPath,
    ['--config', 'oxlint-malformed-glob.config.mts', '--print-config', 'src/react-invalid.tsx'],
    { cwd: consumerDirectory, expectedStatus: 1 },
  );
  assert.match(`${malformedGlob.stdout}\n${malformedGlob.stderr}`, /Invalid glob pattern/);

  const checks = {
    javascript: {
      bad: 'src/core-invalid.js',
      good: 'src/core-valid.js',
      code: 'no-debugger',
      severity: 'error',
    },
    imports: {
      bad: 'src/import-invalid.ts',
      good: 'src/import-valid.ts',
      code: 'import/no-duplicates',
      severity: 'warn',
    },
    typescript: {
      bad: 'src/require-invalid.ts',
      good: 'src/require-valid.mts',
      code: 'typescript/no-require-imports',
      severity: 'warn',
    },
    react: {
      bad: 'src/react-invalid.tsx',
      good: 'src/react-valid.tsx',
      code: 'react/rules-of-hooks',
      severity: 'error',
    },
    jsxA11y: {
      bad: 'src/a11y-invalid.tsx',
      good: 'src/a11y-valid.tsx',
      code: 'jsx-a11y/alt-text',
      severity: 'error',
    },
    nextjs: {
      bad: 'src/next-invalid.tsx',
      good: 'src/next-valid.tsx',
      code: 'nextjs/no-async-client-component',
      severity: 'error',
    },
    vitest: {
      bad: 'tests/focused.test.ts',
      good: 'tests/normal.test.ts',
      code: 'vitest/no-focused-tests',
      severity: 'error',
    },
  };

  for (const [name, check] of Object.entries(checks)) {
    const config = `oxlint-${name}.config.mts`;
    const invalid = lint(oxlintPath, config, [check.bad], check.severity === 'error' ? 1 : 0);
    assertDiagnostic(invalid, check.code, check.severity);
    const valid = lint(oxlintPath, config, [check.good], 0);
    assertNoDiagnostic(valid, check.code);
  }

  const baselineConfig = 'oxlint-baseline.config.mts';
  for (const name of ['javascript', 'imports', 'typescript']) {
    const check = checks[name];
    assertDiagnostic(
      lint(oxlintPath, baselineConfig, [check.bad], check.severity === 'error' ? 1 : 0),
      check.code,
      check.severity,
    );
  }
  // The baseline scopes TypeScript to ts/tsx/mts, not JavaScript or CommonJS cts.
  for (const [extension, scoped] of [
    ['tsx', true],
    ['mts', true],
    ['js', false],
    ['cts', false],
  ]) {
    const path = `src/require-scope.${extension}`;
    writeFile(path, "const fs = require('node:fs')\nvoid fs\n");
    const diagnostics = lint(oxlintPath, baselineConfig, [path], 0);
    if (scoped) assertDiagnostic(diagnostics, 'typescript/no-require-imports', 'warn');
    else assertNoDiagnostic(diagnostics, 'typescript/no-require-imports');
  }
  const optionalAreas = ['react', 'jsxA11y', 'nextjs', 'vitest'];
  const baselineOptIns = lint(
    oxlintPath,
    baselineConfig,
    optionalAreas.map((name) => checks[name].bad),
    0,
  );
  for (const name of optionalAreas) assertNoDiagnostic(baselineOptIns, checks[name].code);

  assertDiagnostic(
    lint(oxlintPath, 'oxlint-custom-root.config.mts', ['src/core-invalid.js'], 0),
    'no-debugger',
    'warn',
  );
  const extended = lint(
    oxlintPath,
    'oxlint-user-extends.config.mts',
    ['src/core-invalid.js', 'src/react-invalid.tsx'],
    0,
  );
  assertDiagnostic(extended, 'no-debugger', 'warn');
  assertNoDiagnostic(extended, 'react/rules-of-hooks');
  // Native scoped overrides win over root rules, even when the root says off.
  assertDiagnostic(
    lint(oxlintPath, 'oxlint-root-scoped.config.mts', ['src/react-invalid.tsx'], 1),
    'react/rules-of-hooks',
    'error',
  );

  writeFile('ignored-first/error.js', 'debugger\n');
  writeFile('ignored-second/error.js', 'debugger\n');
  const ignored = lint(
    oxlintPath,
    'oxlint.config.mts',
    ['ignored-first/error.js', 'ignored-second/error.js', 'src/core-invalid.js'],
    1,
  );
  assertDiagnostic(ignored, 'no-debugger', 'error');
  assert.equal(
    ignored.filter((diagnostic) => ruleIdOf(diagnostic) === 'no-debugger').length,
    1,
    'both ignorePatterns must suppress their invalid files, but not the control',
  );
  writeFile(
    'tests/focused.e2e-spec.ts',
    "import { it } from 'vitest'\nit.only('focused', () => {})\n",
  );
  assertDiagnostic(
    lint(oxlintPath, 'oxlint.config.mts', ['tests/focused.e2e-spec.ts'], 1),
    'vitest/no-focused-tests',
    'error',
  );

  writeFile(
    'tests/contextual.test.ts',
    "import { beforeEach, describe, expect, it } from 'vitest'\nbeforeEach(() => { expect(1).toBe(1) })\ndescribe('suite', () => it('works', () => { expect(1).toBe(1) }))\n",
  );
  const contextualTests = lint(
    oxlintPath,
    'oxlint-vitest.config.mts',
    ['tests/contextual.test.ts'],
    0,
  );
  assertDiagnostic(contextualTests, 'vitest/no-standalone-expect', 'warn');
  assertDiagnostic(contextualTests, 'vitest/valid-describe-callback', 'warn');
  writeFile(
    'tests/async-suite.test.ts',
    "import { describe, expect, it } from 'vitest'\ndescribe('suite', async () => { it('works', () => { expect(1).toBe(1) }) })\n",
  );
  assert.equal(
    lint(oxlintPath, 'oxlint-vitest.config.mts', ['tests/async-suite.test.ts'], 0).length,
    0,
  );

  writeFile(
    'src/a11y-normal.tsx',
    'export function Decoration() { return <img src="/decoration.png" alt="" /> }\nexport function Search() { return <input aria-label="Search" aria-activedescendant="choice" tabIndex={-1} /> }\n',
  );
  assert.equal(lint(oxlintPath, 'oxlint-jsxA11y.config.mts', ['src/a11y-normal.tsx'], 0).length, 0);

  const polyfillCases = [
    ['https://polyfill.io/v3/polyfill.min.js', true],
    ['https://cdn.polyfill.io/v3/polyfill.min.js', false],
    [
      'https://cdnjs.cloudflare.com/polyfill/v3/polyfill.min.js?features=Array.prototype.includes',
      true,
    ],
    [
      'https://cdnjs.cloudflare.com/polyfill/v3/polyfill.min.js?features=IntersectionObserver',
      false,
    ],
  ];
  for (const [url, detected] of polyfillCases) {
    writeFile(
      'src/polyfill.tsx',
      `export default function Page() { return <script src="${url}" /> }\n`,
    );
    const diagnostics = lint(
      oxlintPath,
      'oxlint-nextjs.config.mts',
      ['src/polyfill.tsx'],
      detected ? 1 : 0,
    );
    if (detected) assertDiagnostic(diagnostics, 'nextjs/no-unwanted-polyfillio', 'error');
    else assertNoDiagnostic(diagnostics, 'nextjs/no-unwanted-polyfillio');
  }

  const importsConfig = 'oxlint-imports.config.mts';
  const importDiagnostics = lint(oxlintPath, importsConfig, ['src/import-invalid.ts'], 0);
  assertDiagnostic(importDiagnostics, 'sort-imports', 'warn');

  const typescriptConfig = 'oxlint-typescript.config.mts';
  const deniedWarning = lint(oxlintPath, typescriptConfig, ['src/require-invalid.ts'], 1, [
    '--deny-warnings',
  ]);
  assertDiagnostic(deniedWarning, 'typescript/no-require-imports', 'warn');
  assert.equal(
    lint(oxlintPath, typescriptConfig, ['src/require-valid.mts'], 0, ['--deny-warnings']).length,
    0,
  );
  assertDiagnostic(
    lint(oxlintPath, 'oxlint-javascript.config.mts', ['src/core-invalid.js'], 1, [
      '--deny-warnings',
    ]),
    'no-debugger',
    'error',
  );
  assert.equal(
    lint(oxlintPath, 'oxlint.config.mts', ['src/override.tsx'], 0, ['--deny-warnings']).length,
    0,
  );
  const ctsDiagnostics = lint(oxlintPath, typescriptConfig, ['src/ignored.cts'], 0);
  assertNoDiagnostic(ctsDiagnostics, 'typescript/no-require-imports');

  // Run the repository's own `lint` script through pnpm, not the binary: warnings must
  // stay visible and nonblocking while errors still fail. The nested project limits `.`
  // to these inputs and resolves the installed package from the consumer.
  writeFile(
    'lint-script/package.json',
    JSON.stringify({ private: true, type: 'module', scripts: { lint: scripts.lint } }),
  );
  writeFile('lint-script/oxlint.config.ts', factoryConfig());
  writeFile('lint-script/warning.ts', "const fs = require('node:fs')\nvoid fs\n");
  const lintScript = {
    cwd: join(consumerDirectory, 'lint-script'),
    env: {
      ...process.env,
      PATH: `${join(consumerDirectory, 'node_modules/.bin')}${delimiter}${process.env.PATH}`,
    },
  };
  const warningOnlyLint = run('pnpm', ['run', 'lint'], lintScript);
  assert.match(warningOnlyLint.stdout, /no-require-imports/, 'pnpm run lint must report warnings');
  writeFile('lint-script/error.js', 'debugger\n');
  const erroringLint = run('pnpm', ['run', 'lint'], { ...lintScript, expectedStatus: 1 });
  assert.match(erroringLint.stdout, /no-debugger/, 'pnpm run lint must report errors');

  const reactConfig = 'oxlint-react.config.mts';
  assertNoDiagnostic(
    lint(oxlintPath, reactConfig, ['outside/react-invalid.tsx'], 0),
    'react/rules-of-hooks',
  );
  const vitestConfig = 'oxlint-vitest.config.mts';
  assertNoDiagnostic(
    lint(oxlintPath, vitestConfig, ['outside/focused.test.ts'], 0),
    'vitest/no-focused-tests',
  );
  assertNoDiagnostic(
    lint(oxlintPath, vitestConfig, ['src/not-test.ts'], 0),
    'vitest/no-focused-tests',
  );

  const combinedDiagnostics = lint(
    oxlintPath,
    'oxlint.config.mts',
    [
      'src/core-invalid.js',
      'src/require-invalid.ts',
      'src/react-invalid.tsx',
      'src/a11y-invalid.tsx',
      'tests/focused.test.ts',
    ],
    1,
  );
  assertDiagnostic(combinedDiagnostics, 'no-debugger', 'error');
  assertDiagnostic(combinedDiagnostics, 'typescript/no-require-imports', 'warn');
  assertDiagnostic(combinedDiagnostics, 'react/rules-of-hooks', 'error');
  assertDiagnostic(combinedDiagnostics, 'jsx-a11y/alt-text', 'error');
  assertDiagnostic(combinedDiagnostics, 'vitest/no-focused-tests', 'error');
  assert.equal(
    lint(oxlintPath, 'oxlint.config.mts', ['src/override.tsx'], 0).length,
    0,
    'later root overrides must win over selected presets and earlier root overrides',
  );

  const printConfig = run(
    oxlintPath,
    ['--config', 'oxlint.config.mts', '--print-config', 'src/react-invalid.tsx'],
    { cwd: consumerDirectory },
  ).stdout;
  assert.ok(printConfig.includes('react/rules-of-hooks'));
  assert.match(printConfig, /jsx[_-]a11y\/alt-text/);
  const effectiveConfig = JSON.parse(printConfig);
  assert.deepEqual(effectiveConfig.categories, {});
  assert.equal(effectiveConfig.settings.react.version, '19.0.0');

  const formatPath = writeFile(
    'format/card.tsx',
    'const label = "ready"\nconst card = <Card title="first" count={2} />\nvoid [label, card]\n',
  );
  const orderPath = writeFile(
    'format/order.mjs',
    "import './z-polyfill.mjs'\nimport value from './z.mjs'\nimport './a-polyfill.mjs'\nvoid value\n",
  );
  const overridePath = writeFile('format/special.ts', "const label = 'override'\nvoid label\n");
  const packageJsonPath = writeFile(
    'format/package.json',
    '{\n  "name": "format-fixture",\n  "scripts": {\n    "zeta": "node zeta.js",\n    "alpha": "node alpha.js",\n    "middle": "node middle.js"\n  }\n}\n',
  );
  writeFile('format/z-polyfill.mjs', "globalThis.events.push('z-polyfill')\n");
  writeFile('format/z.mjs', 'export default 1\n');
  writeFile('format/a-polyfill.mjs', "globalThis.events.push('a-polyfill')\n");
  writeFile('.next/generated.ts', 'const generated={ready:"yes"}\n');
  const wranglerGenerated = writeFile('.wrangler/generated.ts', 'const generated={ready:"yes"}\n');
  const vendorGenerated = writeFile('vendor/generated.ts', 'const generated={ready:"yes"}\n');

  run(oxfmtPath, ['--write', '.'], { cwd: consumerDirectory });
  const formattedCard = readFileSync(formatPath, 'utf8');
  assert.ok(formattedCard.includes("const label = 'ready'"), formattedCard);
  assert.match(formattedCard, /title="first"\n\s+count=\{2\}/);
  assert.match(readFileSync(overridePath, 'utf8'), /const label = "override"/);
  assert.deepEqual(Object.keys(JSON.parse(readFileSync(packageJsonPath, 'utf8')).scripts), [
    'alpha',
    'middle',
    'zeta',
  ]);
  const orderedImports = readFileSync(orderPath, 'utf8')
    .split('\n')
    .filter((line) => line.startsWith('import '))
    .map((line) =>
      line
        .match(/from ['"]([^'"]+)['"]|^import ['"]([^'"]+)['"]/)
        .slice(1)
        .find(Boolean),
    );
  assert.deepEqual(orderedImports, ['./z-polyfill.mjs', './z.mjs', './a-polyfill.mjs']);
  for (const path of [
    join(consumerDirectory, '.next/generated.ts'),
    wranglerGenerated,
    vendorGenerated,
  ]) {
    assert.equal(readFileSync(path, 'utf8'), 'const generated={ready:"yes"}\n');
  }

  writeFile('.next/generated.ts', 'const generated={ready:"still ignored"}\n');
  writeFile('.wrangler/generated.ts', 'const generated={ready:"still ignored"}\n');
  writeFile('vendor/generated.ts', 'const generated={ready:"still ignored"}\n');
  run(oxfmtPath, ['--check', '.'], { cwd: consumerDirectory });

  console.log(
    `Verified packed factory baseline, opt-ins, native precedence, seven advanced Oxlint fragments, installed TypeScript declarations, and Oxfmt options, import order, scripts sorting, overrides, and ignores using ${toolVersions.join(', ')}.`,
  );
} finally {
  if (keepTemporaryFiles) {
    console.log(`Temporary consumer retained at ${temporaryRoot}`);
  } else {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}
