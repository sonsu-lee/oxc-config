import type { OxfmtConfig as PublicOxfmtConfig } from 'oxfmt';

// A type alias (unlike an interface) gets an implicit index signature, so `shared`
// stays assignable to oxfmt's `defineConfig(config: T & OxfmtConfig)` without spreading.
export type OxfmtConfig = {
  singleQuote: boolean;
  singleAttributePerLine: boolean;
  sortImports: false;
  sortPackageJson: { sortScripts: boolean };
  ignorePatterns: string[];
};

export const shared: OxfmtConfig = {
  singleQuote: true,
  singleAttributePerLine: true,
  sortImports: false,
  sortPackageJson: { sortScripts: true },
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'out/',
    'dist/',
    'coverage/',
    'next-env.d.ts',
    '*.tsbuildinfo',
  ],
} satisfies PublicOxfmtConfig;
