import { readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
for (const group of ['packages', 'apps']) {
  const entries = await readdir(resolve(root, group), { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      await rm(resolve(root, group, entry.name, 'dist'), { recursive: true, force: true });
    }
  }
}
await rm(resolve(root, '.turbo'), { recursive: true, force: true });
