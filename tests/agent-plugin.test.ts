// @vitest-environment node
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../', import.meta.url));

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(resolve(root, path), 'utf8'));
}

describe('Agent Plugins 1.0.0 distribution', () => {
  it('conforms to the published manifest and MCP schemas', async () => {
    const ajv = new Ajv2020({ allErrors: true });
    for (const filename of ['plugin', 'mcp']) {
      const schema = JSON.parse(
        await readFile(resolve(root, `schemas/agent-plugins/1.0.0/${filename}.schema.json`), 'utf8'),
      );
      const validate = ajv.compile(schema);
      expect(validate(await readJson(`${filename}.json`)), JSON.stringify(validate.errors)).toBe(true);
    }
  });

  it('points to a built local server without requiring an unpublished npm package', async () => {
    const config = await readJson('mcp.json');
    expect(config).toEqual({
      $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
      mcpServers: {
        flipcard: {
          type: 'stdio',
          command: 'node',
          args: ['${PLUGIN_ROOT}/packages/mcp-server/dist/cli.js'],
          cwd: '${PLUGIN_ROOT}',
        },
      },
    });
    await expect(access(resolve(root, 'packages/mcp-server/dist/cli.js'))).resolves.toBeUndefined();
  });

  it('uses the specification version separately from the plugin release version', async () => {
    const plugin = await readJson('plugin.json');
    expect(plugin).toMatchObject({
      $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
      name: 'flipcard',
      version: '0.1.0',
    });
  });
});
