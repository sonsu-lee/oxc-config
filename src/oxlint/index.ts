import type { OxlintConfig, OxlintOverride as PublicOxlintOverride } from 'oxlint';

export type RuleSeverity = 'off' | 'allow' | 'warn' | 'deny' | 'error' | 0 | 1 | 2;
export type RuleOption = string | number | boolean | null | object;
export type RuleValue = RuleSeverity | [RuleSeverity, ...RuleOption[]];
export type OxlintOverride = PublicOxlintOverride;
export type OxlintConfigFragment = OxlintConfig;

export type { FilesPresetOptions } from './scoped.ts';

export { javascript } from './configs/javascript.ts';
export { imports } from './configs/imports.ts';
export { typescript } from './configs/typescript.ts';
export { react } from './configs/react.ts';
export { jsxA11y } from './configs/jsx-a11y.ts';
export { nextjs } from './configs/nextjs.ts';
export { vitest } from './configs/vitest.ts';
