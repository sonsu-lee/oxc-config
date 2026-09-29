import type { OxlintConfig } from 'oxlint';

export const imports: OxlintConfig = {
  categories: { correctness: 'off' },
  plugins: ['import'],
  rules: {
    'import/no-duplicates': 'warn',
    'sort-imports': ['warn', { ignoreDeclarationSort: true }],
  },
};
