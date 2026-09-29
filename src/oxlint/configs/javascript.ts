import type { OxlintConfig } from 'oxlint';

export const javascript: OxlintConfig = {
  categories: { correctness: 'off' },
  rules: {
    'no-debugger': 'error',
    'no-eval': 'error',
    'no-unreachable': 'error',
    'no-const-assign': 'error',
    'no-duplicate-case': 'error',
    'no-async-promise-executor': 'error',
    eqeqeq: ['error', 'smart'],
  },
};
