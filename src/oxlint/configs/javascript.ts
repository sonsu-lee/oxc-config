import type { OxlintConfig } from 'oxlint';

// Oxlint's correctness category is the inherited preset; only differences are listed.
export const javascript: OxlintConfig = {
  plugins: ['oxc', 'unicorn'],
  categories: { correctness: 'error' },
  rules: {
    eqeqeq: ['error', 'smart'],
  },
};
