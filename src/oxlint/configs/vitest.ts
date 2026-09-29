import type { OxlintConfig } from 'oxlint';
import { type FilesPresetOptions, scopedPreset } from '../scoped.ts';

const rules = {
  'vitest/no-focused-tests': 'error',
  'vitest/no-identical-title': 'warn',
  'vitest/no-standalone-expect': 'warn',
  'vitest/valid-expect': 'error',
  'vitest/valid-title': 'warn',
  'vitest/valid-describe-callback': 'warn',
  'vitest/require-awaited-expect-poll': 'error',
} satisfies NonNullable<OxlintConfig['rules']>;

export function vitest(options: FilesPresetOptions): OxlintConfig {
  return scopedPreset('vitest', 'vitest', rules, options);
}
