import type { OxfmtConfig as PublicOxfmtConfig } from 'oxfmt';

export interface OxfmtConfig {
  singleQuote: boolean;
  singleAttributePerLine: boolean;
  sortImports: false;
  sortPackageJson: { sortScripts: boolean };
  ignorePatterns: string[];
}

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
