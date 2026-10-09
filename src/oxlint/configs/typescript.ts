import type { OxlintConfig } from 'oxlint';

export const typescript: OxlintConfig = {
  plugins: ['typescript'],
  categories: { correctness: 'error' },
  overrides: [
    {
      files: ['**/*.{ts,tsx,mts}'],
      plugins: ['typescript'],
      rules: {
        'typescript/no-require-imports': 'warn',
      },
    },
  ],
};
