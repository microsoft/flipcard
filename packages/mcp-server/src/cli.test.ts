import { describe, expect, it } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createFlipCardServer } from './server.js';
import { flipCardToolDefinitions } from './tools.js';

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
    ]);
    expect(Object.keys(server._registeredResourceTemplates)).toEqual(['flipcard-example']);
  });
});
