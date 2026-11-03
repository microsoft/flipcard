import { readFile, writeFile } from 'node:fs/promises';

const template = await readFile(new URL('../src/viewer.html', import.meta.url), 'utf8');
const script = await readFile(new URL('../dist/ui/viewer.global.js', import.meta.url), 'utf8');
await writeFile(new URL('../dist/viewer.html', import.meta.url),
  template.replace('<!-- APP_SCRIPT -->', () => `<script>${script.replace(/<\/script/gi, '<\\/script')}</script>`));
