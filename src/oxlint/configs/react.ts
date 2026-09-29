import type { OxlintConfig } from 'oxlint';
import { type FilesPresetOptions, scopedPreset } from '../scoped.ts';

const rules = {
  'react/error-boundaries': 'warn',
  'react/exhaustive-deps': 'warn',
  'react/globals': 'error',
  'react/immutability': 'error',
  'react/jsx-key': [
    'error',
    { checkFragmentShorthand: true, checkKeyMustBeforeSpread: true, warnOnDuplicates: true },
  ],
  'react/jsx-no-duplicate-props': 'error',
  'react/jsx-no-undef': 'error',
  'react/jsx-props-no-spread-multi': 'warn',
  'react/no-children-prop': 'warn',
  'react/no-danger-with-children': 'error',
  'react/no-this-in-sfc': 'error',
  'react/purity': 'error',
  'react/refs': 'warn',
  'react/rules-of-hooks': 'error',
  'react/set-state-in-render': 'error',
  'react/static-components': 'warn',
  'react/use-memo': 'warn',
  'react/void-dom-elements-no-children': 'error',
  'react/void-use-memo': 'warn',
} satisfies NonNullable<OxlintConfig['rules']>;

export function react(options: FilesPresetOptions): OxlintConfig {
  return scopedPreset('react', 'react', rules, options);
}
