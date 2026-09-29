import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);

// Remove previous output so renamed source files cannot survive in the tarball.
rmSync(new URL('dist/', root), { recursive: true, force: true });

const result = spawnSync(
  process.execPath,
  [
    fileURLToPath(new URL('../node_modules/typescript/bin/tsc', import.meta.url)),
    '-p',
    'tsconfig.json',
  ],
  { cwd: fileURLToPath(root), stdio: 'inherit' },
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
