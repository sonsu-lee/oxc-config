import type { OxlintConfig } from 'oxlint';
import { type FilesPresetOptions, scopedPreset } from '../scoped.ts';

// Differences from the inherited correctness preset (error) for the vitest plugin.
const rules = {
  'vitest/no-identical-title': 'warn',
  'vitest/no-standalone-expect': 'warn',
  'vitest/valid-describe-callback': 'warn',
  'vitest/valid-title': 'warn',
  'vitest/warn-todo': 'warn',
  'vitest/expect-expect': 'off',
  'vitest/no-conditional-expect': 'off',
  'vitest/no-disabled-tests': 'off',
  'vitest/require-mock-type-parameters': 'off',
} satisfies NonNullable<OxlintConfig['rules']>;

export function vitest(options: FilesPresetOptions): OxlintConfig {
  return scopedPreset('vitest', 'vitest', rules, options);
}
