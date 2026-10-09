import type { OxlintConfig } from 'oxlint';

export const imports: OxlintConfig = {
  plugins: ['import'],
  categories: { correctness: 'error' },
  rules: {
    'import/no-duplicates': 'warn',
    'sort-imports': ['warn', { ignoreDeclarationSort: true }],
  },
};
