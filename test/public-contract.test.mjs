import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import * as oxlint from '../dist/oxlint/index.js';
import * as oxfmt from '../dist/oxfmt/index.js';

const evidence = JSON.parse(
  readFileSync(new URL('./fixtures/selected-rules.json', import.meta.url), 'utf8'),
);

const candidateRules = {
  javascript: Object.fromEntries(
    Object.entries(evidence.rules).filter(
      ([id]) => !id.startsWith('import/') && id !== 'sort-imports',
    ),
  ),
  imports: Object.fromEntries(
    Object.entries(evidence.rules).filter(
      ([id]) => id.startsWith('import/') || id === 'sort-imports',
    ),
  ),
  typescript: evidence.overrides[0].rules,
  jsxA11y: Object.fromEntries(
    Object.entries(evidence.overrides[1].rules).filter(([id]) => id.startsWith('jsx-a11y/')),
  ),
  react: Object.fromEntries(
    Object.entries(evidence.overrides[1].rules).filter(([id]) => id.startsWith('react/')),
  ),
  nextjs: evidence.overrides[2].rules,
  vitest: evidence.overrides[3].rules,
};

const pathPresets = {
  react: oxlint.react,
  jsxA11y: oxlint.jsxA11y,
  nextjs: oxlint.nextjs,
  vitest: oxlint.vitest,
};

function rulesIn(config) {
  const rules = { ...config.rules };
  for (const override of config.overrides ?? []) {
    Object.assign(rules, override.rules);
  }
  return rules;
}

function optionsIn(rules) {
  return Object.fromEntries(
    Object.entries(rules).map(([id, value]) => [id, Array.isArray(value) ? value.slice(1) : []]),
  );
}

function severityOf(value) {
  return Array.isArray(value) ? value[0] : value;
}

test('exports the seven designed Oxlint areas and shared Oxfmt settings', () => {
  assert.deepEqual(Object.keys(oxlint).sort(), [
    'imports',
    'javascript',
    'jsxA11y',
    'nextjs',
    'react',
    'typescript',
    'vitest',
  ]);
  assert.deepEqual(Object.keys(oxfmt), ['shared']);
});

test('preserves the current 74-rule regression baseline and options', () => {
  const fragments = {
    javascript: oxlint.javascript,
    imports: oxlint.imports,
    typescript: oxlint.typescript,
    react: oxlint.react({ files: ['src/**/*.{ts,tsx,js,jsx}'] }),
    jsxA11y: oxlint.jsxA11y({ files: ['src/**/*.{tsx,jsx}'] }),
    nextjs: oxlint.nextjs({ files: ['src/**/*.{ts,tsx,js,jsx}'] }),
    vitest: oxlint.vitest({ files: ['tests/**/*.{test,spec}.{ts,tsx,js,jsx}'] }),
  };

  for (const [name, fragment] of Object.entries(fragments)) {
    assert.deepEqual(
      optionsIn(rulesIn(fragment)),
      optionsIn(candidateRules[name]),
      `${name} rule IDs/options drifted`,
    );
  }

  const actualIds = Object.values(fragments).flatMap((fragment) => Object.keys(rulesIn(fragment)));
  const expectedIds = Object.values(candidateRules).flatMap((rules) => Object.keys(rules));
  assert.equal(actualIds.length, 74);
  assert.equal(new Set(actualIds).size, 74);
  assert.deepEqual([...actualIds].sort(), [...expectedIds].sort());
});

test('preserves per-rule severity and leaves warnings nonblocking by default', () => {
  const fragments = {
    javascript: oxlint.javascript,
    imports: oxlint.imports,
    typescript: oxlint.typescript,
    react: oxlint.react({ files: ['src/**/*.{ts,tsx,js,jsx}'] }),
    jsxA11y: oxlint.jsxA11y({ files: ['src/**/*.{tsx,jsx}'] }),
    nextjs: oxlint.nextjs({ files: ['src/**/*.{ts,tsx,js,jsx}'] }),
    vitest: oxlint.vitest({ files: ['tests/**/*.{test,spec}.{ts,tsx,js,jsx}'] }),
  };

  for (const [name, fragment] of Object.entries(fragments)) {
    assert.equal(
      fragment.categories?.correctness,
      'off',
      `${name} must suppress implicit correctness rules`,
    );
  }

  for (const [name, fragment] of Object.entries(fragments)) {
    const severities = (rules) =>
      Object.fromEntries(Object.entries(rules).map(([id, value]) => [id, severityOf(value)]));
    assert.deepEqual(severities(rulesIn(fragment)), severities(candidateRules[name]), name);
  }
  const { scripts } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(scripts.lint, 'oxlint .', 'default lint must honor nonblocking warnings');
});

test('requires explicit non-empty file patterns and copies them for every builder', () => {
  for (const [name, build] of Object.entries(pathPresets)) {
    assert.throws(() => build(), TypeError, `${name} must require options`);
    assert.throws(() => build({ files: [] }), TypeError, `${name} must reject empty files`);
    assert.throws(
      () => build({ files: new Array(1) }),
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
