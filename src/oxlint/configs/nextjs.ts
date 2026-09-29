import type { OxlintConfig } from 'oxlint';
import { type FilesPresetOptions, scopedPreset } from '../scoped.ts';

const rules = {
  'nextjs/inline-script-id': 'error',
  'nextjs/no-assign-module-variable': 'error',
  'nextjs/no-async-client-component': 'error',
  'nextjs/no-html-link-for-pages': 'warn',
  'nextjs/no-sync-scripts': 'warn',
  'nextjs/no-unwanted-polyfillio': 'error',
} satisfies NonNullable<OxlintConfig['rules']>;

export function nextjs(options: FilesPresetOptions): OxlintConfig {
  return scopedPreset('nextjs', 'nextjs', rules, options);
}
