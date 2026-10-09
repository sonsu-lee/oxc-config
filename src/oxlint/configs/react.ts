import type { OxlintConfig } from 'oxlint';
import { type FilesPresetOptions, scopedPreset } from '../scoped.ts';

// Differences from the inherited correctness preset (error) for the react plugin.
const rules = {
  'react/error-boundaries': 'warn',
  'react/exhaustive-deps': 'warn',
  'react/jsx-key': [
    'error',
    { checkFragmentShorthand: true, checkKeyMustBeforeSpread: true, warnOnDuplicates: true },
  ],
  'react/jsx-props-no-spread-multi': 'warn',
  'react/no-children-prop': 'warn',
  'react/refs': 'warn',
  'react/rules-of-hooks': 'error',
  'react/static-components': 'warn',
  'react/use-memo': 'warn',
  'react/void-use-memo': 'warn',
  'react/forward-ref-uses-ref': 'off',
  'react/incompatible-library': 'off',
  'react/no-did-mount-set-state': 'off',
  'react/no-did-update-set-state': 'off',
  'react/preserve-manual-memoization': 'off',
  'react/set-state-in-effect': 'off',
  'react/unsupported-syntax': 'off',
} satisfies NonNullable<OxlintConfig['rules']>;

export function react(options: FilesPresetOptions): OxlintConfig {
  return scopedPreset('react', 'react', rules, options);
}
