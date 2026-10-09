// Resolves the rules `sonsu()` enables with every area selected: Oxlint's category
// preset for the enabled plugins, then this package's explicit adjustments. The result
// is committed as test/fixtures/effective-rules.json so an Oxlint upgrade shows every
// rule that entered, left or changed in the inherited preset as a reviewable diff.
//
//   node scripts/effective-rules.mjs --write   regenerate the fixture after a build
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const fixtureUrl = new URL('../test/fixtures/effective-rules.json', import.meta.url);

const allAreas = {
  react: { files: ['**/*'] },
  jsxA11y: { files: ['**/*'] },
  nextjs: { files: ['**/*'] },
  vitest: { files: ['**/*'] },
};

function oxlintOutput(oxlintBin, args) {
  const result = spawnSync(oxlintBin, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`oxlint ${args.join(' ')} failed:\n${result.stderr}`);
  return result.stdout;
}

/**
 * @param {{ default: (options: object) => { extends: object[] } }} oxlint the package's `/oxlint` module
 * @param {string} oxlintBin path to the Oxlint executable whose rule catalog is used
 */
export function effectiveRules(oxlint, oxlintBin) {
  const version = oxlintOutput(oxlintBin, ['--version']).match(/\d+\.\d+\.\d+\S*/)?.[0];
  const catalog = new Map(
    JSON.parse(oxlintOutput(oxlintBin, ['--rules', '--format=json'])).map((rule) => {
      const plugin = rule.scope === 'jsx_a11y' ? 'jsx-a11y' : rule.scope;
      const id = plugin === 'eslint' ? rule.value : `${plugin}/${rule.value}`;
      return [id, { plugin, category: rule.category, typeAware: rule.type_aware }];
    }),
  );

  const fragments = oxlint.default(allAreas).extends;
  const categories = Object.assign({}, ...fragments.map((fragment) => fragment.categories));
  const plugins = new Set(['eslint']);
  const adjustments = {};
  for (const fragment of fragments) {
    for (const plugin of fragment.plugins ?? []) plugins.add(plugin);
    Object.assign(adjustments, fragment.rules);
  }
  // Oxlint applies matching overrides after root rules.
  for (const fragment of fragments) {
    for (const override of fragment.overrides ?? []) {
      for (const plugin of override.plugins ?? []) plugins.add(plugin);
      Object.assign(adjustments, override.rules);
    }
  }

  const unknown = Object.keys(adjustments).filter((id) => !catalog.has(id));
  if (unknown.length) {
    throw new Error(`Oxlint ${version} has no rule ${unknown.join(', ')}; update the adjustment`);
  }

  const rules = {};
  for (const [id, rule] of catalog) {
    const preset = plugins.has(rule.plugin) ? categories[rule.category] : undefined;
    const adjusted = Object.hasOwn(adjustments, id);
    if ((preset === undefined || preset === 'off') && !adjusted) continue;
    rules[id] = {
      value: adjusted ? adjustments[id] : preset,
      source: adjusted ? 'adjusted' : 'preset',
      ...(rule.typeAware ? { typeAware: true } : {}),
    };
  }
  return {
    oxlint: version,
    categories,
    rules: Object.fromEntries(Object.entries(rules).sort(([a], [b]) => a.localeCompare(b))),
  };
}

// One rule per line keeps upgrade diffs readable.
export function serialize(snapshot) {
  const entries = Object.entries(snapshot.rules).map(
    ([id, rule]) => `    ${JSON.stringify(id)}: ${JSON.stringify(rule)}`,
  );
  return `{\n  "oxlint": ${JSON.stringify(snapshot.oxlint)},\n  "categories": ${JSON.stringify(snapshot.categories)},\n  "rules": {\n${entries.join(',\n')}\n  }\n}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!process.argv.includes('--write')) {
    console.error('Usage: node scripts/effective-rules.mjs --write');
    process.exit(2);
  }
  const oxlint = await import('../dist/oxlint/index.js');
  const oxlintBin = fileURLToPath(new URL('../node_modules/.bin/oxlint', import.meta.url));
  const next = effectiveRules(oxlint, oxlintBin);
  let previous = { rules: {} };
  try {
    previous = JSON.parse(readFileSync(fixtureUrl, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const changes = [];
  for (const id of new Set([...Object.keys(previous.rules), ...Object.keys(next.rules)])) {
    const before = JSON.stringify(previous.rules[id]?.value);
    const after = JSON.stringify(next.rules[id]?.value);
    if (before !== after) changes.push(`${id}: ${before ?? '(absent)'} -> ${after ?? '(absent)'}`);
  }
  writeFileSync(fixtureUrl, serialize(next));
  console.log(
    `Oxlint ${previous.oxlint ?? '(none)'} -> ${next.oxlint}: ${changes.length} effective rule change(s)`,
  );
  for (const change of changes) console.log(`  ${change}`);
}
