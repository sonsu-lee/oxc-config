import { defineConfig } from 'oxlint';
import { imports, javascript, typescript } from './src/oxlint/index.ts';

export default defineConfig({
  extends: [javascript, imports, typescript],
  ignorePatterns: ['dist/', 'docs/evidence/', 'test/fixtures/'],
});
