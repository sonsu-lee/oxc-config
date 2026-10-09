import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import sonsu, * as oxlint from '../dist/oxlint/index.js';
import * as oxfmt from '../dist/oxfmt/index.js';
import { effectiveRules, fixtureUrl } from '../scripts/effective-rules.mjs';

const oxlintBin = fileURLToPath(new URL('../node_modules/.bin/oxlint', import.meta.url));

const pathPresets = {
  react: oxlint.react,
  jsxA11y: oxlint.jsxA11y,
  nextjs: oxlint.nextjs,
  vitest: oxlint.vitest,
};

// A one-slot array with no element, built without the linted `new Array(n)` form.
const sparseFiles = [];
sparseFiles.length = 1;

test('matches the reviewed effective rule snapshot for the installed Oxlint', () => {
  const reviewed = JSON.parse(readFileSync(fixtureUrl, 'utf8'));
  assert.deepEqual(
    effectiveRules(oxlint, oxlintBin),
    reviewed,
    'Effective rules drifted. Run `pnpm run rules:update`, review the printed changes, and record decisions in docs/rule-ledger.md.',
  );
});

test('inherits the correctness preset from base fragments only', () => {
  for (const [name, fragment] of Object.entries({
    javascript: oxlint.javascript,
    imports: oxlint.imports,
    typescript: oxlint.typescript,
  })) {
    assert.deepEqual(fragment.categories, { correctness: 'error' }, name);
  }
  // A scoped category would apply to every file, so area builders only add overrides.
  for (const [name, build] of Object.entries(pathPresets)) {
    assert.deepEqual(Object.keys(build({ files: ['app/**'] })), ['overrides'], name);
  }
});

test('requires explicit non-empty file patterns and copies them for every builder', () => {
  for (const [name, build] of Object.entries(pathPresets)) {
    assert.throws(() => build(), TypeError, `${name} must require options`);
    assert.throws(() => build({ files: [] }), TypeError, `${name} must reject empty files`);
    assert.throws(
      () => build({ files: sparseFiles }),
      TypeError,
      `${name} must reject sparse files`,
    );
    assert.throws(() => build({ files: [''] }), TypeError, `${name} must reject empty patterns`);
    assert.throws(
      () => build({ files: ['  '] }),
      TypeError,
      `${name} must reject whitespace patterns`,
    );
    assert.throws(
      () => build({ files: ['src/**', 42] }),
      TypeError,
      `${name} must reject non-string patterns`,
    );

    const options = { files: ['src/**/*.{tsx,jsx}'] };
    const config = build(options);
    options.files[0] = 'tests/**';
    assert.deepEqual(config.overrides[0].files, ['src/**/*.{tsx,jsx}']);
  }
});

test('keeps rule mutations local to each scoped builder result', () => {
  for (const [name, build] of Object.entries(pathPresets)) {
    const first = build({ files: ['app/**'] });
    const expected = structuredClone(first.overrides[0].rules);
    const rule = Object.keys(expected)[0];
    first.overrides[0].rules[rule] = 'off';

    if (name === 'react') {
      first.overrides[0].rules['react/jsx-key'][1].warnOnDuplicates = false;
    }

    const second = build({ files: ['components/**'] });
    assert.deepEqual(second.overrides[0].rules, expected, `${name} leaked a rule mutation`);
  }
});

test('rejects invalid scoped options through the factory rather than silently disabling them', () => {
  const invalidOptions = [
    false,
    true,
    null,
    {},
    { files: [] },
    { files: sparseFiles },
    { files: [''] },
    { files: [' src/**'] },
    { files: ['src/**', 42] },
  ];

  for (const name of Object.keys(pathPresets)) {
    for (const options of invalidOptions) {
      assert.throws(
        () => sonsu({ [name]: options }),
        TypeError,
        `${name} must reject invalid scoped options`,
      );
    }
  }
});

test('isolates built-in factory rules and overrides from other calls and named baselines', () => {
  const options = Object.fromEntries(
    Object.keys(pathPresets).map((name) => [name, { files: ['app/**'] }]),
  );
  const baselines = [oxlint.javascript, oxlint.imports, oxlint.typescript];
  const expectedBaselines = structuredClone(baselines);
  const first = sonsu(options);
  const second = sonsu(options);
  const expected = structuredClone(second);

  for (const preset of first.extends) {
    if (preset.rules) {
      for (const rule of Object.keys(preset.rules)) {
        const value = preset.rules[rule];
        if (Array.isArray(value)) {
          value[0] = 'off';
          if (value[1] && typeof value[1] === 'object') {
            value[1].ignoreDeclarationSort = false;
          }
        } else {
          preset.rules[rule] = 'off';
        }
      }
    }
    for (const override of preset.overrides ?? []) {
      override.files[0] = 'other/**';
      override.plugins.push('import');
      for (const rule of Object.keys(override.rules)) {
        const value = override.rules[rule];
        if (Array.isArray(value)) {
          value[1].warnOnDuplicates = false;
        } else {
          override.rules[rule] = 'off';
        }
      }
    }
  }

  assert.deepEqual(second, expected, 'mutations leaked into an existing factory result');
  assert.deepEqual(sonsu(options), expected, 'mutations leaked into a later factory result');
  assert.deepEqual(baselines, expectedBaselines, 'mutations leaked into named baselines');
});

test('uses the non-reordering shared Oxfmt contract and generated-file exclusions', () => {
  assert.equal(oxfmt.shared.singleQuote, true);
  assert.equal(oxfmt.shared.singleAttributePerLine, true);
  assert.equal(oxfmt.shared.sortImports, false);
  assert.deepEqual(oxfmt.shared.sortPackageJson, { sortScripts: true });
  assert.deepEqual(oxfmt.shared.ignorePatterns, [
    'node_modules/',
    '.next/',
    'out/',
    'dist/',
    'coverage/',
    'next-env.d.ts',
    '*.tsbuildinfo',
  ]);
});
