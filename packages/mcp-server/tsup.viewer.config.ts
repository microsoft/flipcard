import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/viewer.ts'],
  format: ['iife'],
  platform: 'browser',
  outDir: 'dist/ui',
  noExternal: [/.*/],
  minify: true,
  splitting: false,
});
