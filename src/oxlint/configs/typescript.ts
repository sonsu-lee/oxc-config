import type { OxlintConfig } from 'oxlint';

export const typescript: OxlintConfig = {
  categories: { correctness: 'off' },
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
