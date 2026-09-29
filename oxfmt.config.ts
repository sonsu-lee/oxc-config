import { defineConfig } from 'oxfmt';
import { shared } from './src/oxfmt/index.ts';

export default defineConfig({
  ...shared,
  ignorePatterns: [...shared.ignorePatterns, 'docs/evidence/', 'test/fixtures/'],
});
