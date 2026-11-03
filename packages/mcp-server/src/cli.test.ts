// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { McpServer } from '@modelcontextprotocol/server';
import { createFlipCardServer } from './server.js';
import { flipCardToolDefinitions } from './tools.js';
import { parseCliArgs } from './cli-options.js';

describe('createFlipCardServer', () => {
  it('creates an McpServer instance', () => {
    const server = createFlipCardServer();

    expect(server).toBeInstanceOf(McpServer);
  });

  it('registers the expected tools and resources', () => {
    const server = createFlipCardServer() as unknown as {
      _registeredTools: Record<string, unknown>;
      _registeredResources: Record<string, unknown>;
      _registeredResourceTemplates: Record<string, unknown>;
    };

    expect(Object.keys(server._registeredTools)).toEqual(
      flipCardToolDefinitions.map((tool) => tool.name),
    );
    expect(Object.keys(server._registeredResources)).toEqual([
      'flipcard://schema',
      'flipcard://categories',
      'ui://flipcard/viewer',
    ]);
    expect(Object.keys(server._registeredResourceTemplates)).toEqual(['flipcard-example']);
  });

  describe('CLI arguments', () => {
    it('keeps stdio as the default', () => {
      expect(parseCliArgs([])).toMatchObject({ transport: 'stdio', host: '127.0.0.1' });
      expect(parseCliArgs(['--transport', 'http', '--port', '4321'])).toMatchObject({ transport: 'http', port: 4321 });
    });
    it.each([
      ['--port', '3'], ['--transport', 'sse'], ['--transport'],
      ['--transport', 'http', '--port', '12bad'],
      ['--transport', 'http', '--port', '0'],
      ['--transport', 'http', '--port', '-1'],
      ['--transport', 'http', '--port', '65536'],
      ['--transport', 'http', '--host', '0.0.0.0'],
      ['--transport', 'http', '--host', 'example.com'],
      ['--wat'], ['--transport', 'http', '--transport', 'stdio'],
    ])('rejects invalid arguments %j', (...args) => {
      expect(() => parseCliArgs(args)).toThrow();
    });
  });
});
