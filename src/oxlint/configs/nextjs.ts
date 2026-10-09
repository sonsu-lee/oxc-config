import type { OxlintConfig } from 'oxlint';
import { type FilesPresetOptions, scopedPreset } from '../scoped.ts';

// Differences from the inherited correctness preset (error) for the nextjs plugin.
const rules = {
  'nextjs/google-font-display': 'warn',
  'nextjs/google-font-preconnect': 'warn',
  'nextjs/next-script-for-ga': 'warn',
  'nextjs/no-css-tags': 'warn',
  'nextjs/no-html-link-for-pages': 'warn',
  'nextjs/no-page-custom-font': 'warn',
  'nextjs/no-styled-jsx-in-document': 'warn',
  'nextjs/no-sync-scripts': 'warn',
  'nextjs/no-title-in-document-head': 'warn',
  'nextjs/no-typos': 'warn',
  'nextjs/no-before-interactive-script-outside-document': 'off',
  'nextjs/no-head-element': 'off',
  'nextjs/no-img-element': 'off',
} satisfies NonNullable<OxlintConfig['rules']>;

export function nextjs(options: FilesPresetOptions): OxlintConfig {
  return scopedPreset('nextjs', 'nextjs', rules, options);
}
