import type { OxlintConfig } from 'oxlint';
import { type FilesPresetOptions, scopedPreset } from '../scoped.ts';

// Differences from the inherited correctness preset (error) for the jsx-a11y plugin.
const rules = {
  'jsx-a11y/anchor-is-valid': 'warn',
  'jsx-a11y/click-events-have-key-events': 'warn',
  'jsx-a11y/control-has-associated-label': 'warn',
  'jsx-a11y/img-redundant-alt': 'warn',
  'jsx-a11y/interactive-supports-focus': 'warn',
  'jsx-a11y/label-has-associated-control': 'warn',
  'jsx-a11y/media-has-caption': 'warn',
  'jsx-a11y/mouse-events-have-key-events': 'warn',
  'jsx-a11y/no-access-key': 'warn',
  'jsx-a11y/no-autofocus': 'warn',
  'jsx-a11y/no-noninteractive-element-interactions': 'warn',
  'jsx-a11y/no-noninteractive-tabindex': 'warn',
  'jsx-a11y/no-redundant-roles': 'warn',
  'jsx-a11y/no-static-element-interactions': 'warn',
  'jsx-a11y/tabindex-no-positive': 'warn',
  'jsx-a11y/autocomplete-valid': 'off',
  'jsx-a11y/no-noninteractive-element-to-interactive-role': 'off',
  'jsx-a11y/prefer-tag-over-role': 'off',
} satisfies NonNullable<OxlintConfig['rules']>;

export function jsxA11y(options: FilesPresetOptions): OxlintConfig {
  return scopedPreset('jsxA11y', 'jsx-a11y', rules, options);
}
