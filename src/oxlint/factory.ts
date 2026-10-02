import type { OxlintConfig } from 'oxlint';
import { imports } from './configs/imports.ts';
import { javascript } from './configs/javascript.ts';
import { jsxA11y } from './configs/jsx-a11y.ts';
import { nextjs } from './configs/nextjs.ts';
import { react } from './configs/react.ts';
import { typescript } from './configs/typescript.ts';
import { vitest } from './configs/vitest.ts';
import type { FilesPresetOptions } from './scoped.ts';

export interface SonsuOptions extends OxlintConfig {
  react?: FilesPresetOptions;
  jsxA11y?: FilesPresetOptions;
  nextjs?: FilesPresetOptions;
  vitest?: FilesPresetOptions;
}

export default function sonsu(options: SonsuOptions = {}): OxlintConfig {
  const {
    react: reactOptions,
    jsxA11y: jsxA11yOptions,
    nextjs: nextjsOptions,
    vitest: vitestOptions,
    extends: extensions = [],
    ...config
  } = options;
  const presets = structuredClone([javascript, imports, typescript]);

  if (reactOptions !== undefined) presets.push(react(reactOptions));
  if (jsxA11yOptions !== undefined) presets.push(jsxA11y(jsxA11yOptions));
  if (nextjsOptions !== undefined) presets.push(nextjs(nextjsOptions));
  if (vitestOptions !== undefined) presets.push(vitest(vitestOptions));

  return { ...config, extends: [...presets, ...extensions] };
}
