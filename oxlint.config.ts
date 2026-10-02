import sonsu from './src/oxlint/index.ts';

export default sonsu({
  ignorePatterns: ['dist/', 'docs/evidence/', 'test/fixtures/'],
});
