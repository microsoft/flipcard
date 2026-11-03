// @vitest-environment node
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const docsRequire = createRequire(new URL('../docs/package.json', import.meta.url));
const match = require('@microsoft/flipcard-minimatch-compat');

describe('scoped patched dependency compatibility', () => {
  it.each([
    ['src/card.ts', '**/*.ts', {}, true],
    ['src/card.tsx', '**/*.{ts,tsx}', {}, true],
    ['src/card.js', '**/*.ts', {}, false],
    ['.hidden', '*', {}, false],
    ['.hidden', '*', { dot: true }, true],
    ['card.ts', '!*.js', {}, true],
    ['card.js', '!*.js', {}, false],
    ['src/card.ts', 'src/@(card|tile).ts', {}, true],
    ['C:/cards/tile.ts', 'C:\\cards\\*.ts', { windowsPathsNoEscape: true }, true],
  ])('matches %s using %s', (path, pattern, options, expected) => {
    expect(match(path, pattern, options)).toBe(expected);
    expect(new match.Minimatch(pattern, options).match(path)).toBe(expected);
  });

  it('retains the match and filter entry points used by legacy consumers', () => {
    expect(match.match(['one.ts', 'two.js'], '*.ts')).toEqual(['one.ts']);
    expect(['one.ts', 'two.js'].filter(match.filter('*.ts'))).toEqual(['one.ts']);
  });

  it('installs only fixed minimatch implementations and removes deepmerge from docs', () => {
    for (const path of ['../package-lock.json', '../docs/package-lock.json']) {
      const lock = JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
      for (const [location, value] of Object.entries(lock.packages)) {
        const entry = value as { name?: string; version?: string };
        if (location.endsWith('/minimatch') || location.endsWith('/minimatch-modern')) {
          expect(
            entry.name === '@microsoft/flipcard-minimatch-compat' ||
              entry.version === '11.0.1',
            `${location}: ${entry.version}`,
          ).toBe(true);
        }
        if (path.includes('/docs/')) expect(location.endsWith('/deepmerge')).toBe(false);
      }
    }
  });

  it('keeps the original SVG optimizer and produces usable React SVG output', async () => {
    const plugin = docsRequire('@svgr/plugin-svgo');
    const { transform } = docsRequire('@svgr/core');
    const source = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M1 1h10v10H1z"/></svg>';
    expect(plugin(source, { svgo: false }, {})).toBe(source);
    const output = await transform(source, {
      plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
      icon: true,
    }, { componentName: 'TestIcon' });
    expect(output).toContain('TestIcon');
    expect(output).toContain('viewBox="0 0 24 24"');
    expect(output).toContain('<path');
  });

  it('pins the fixed Joi release and handles multiple email validation', () => {
    const joi = docsRequire('joi');
    expect(joi.version).toBe('17.13.9');
    const schema = joi.string().email({ multiple: true });
    expect(schema.validate('first@example.com, second@example.org').error).toBeUndefined();
    expect(schema.validate(','.repeat(100_000)).error).toBeDefined();
  });
});
