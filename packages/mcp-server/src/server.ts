import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerFlipCardResources } from './resources.js';
import { registerFlipCardTools } from './tools.js';

const DEFAULT_SERVER_NAME = 'flipcard-mcp';
const DEFAULT_SERVER_VERSION = '0.1.0';

export interface CreateFlipCardServerOptions {
  name?: string;
  version?: string;
}

export function createFlipCardServer(options: CreateFlipCardServerOptions = {}): McpServer {
  const server = new McpServer({
    name: options.name ?? DEFAULT_SERVER_NAME,
    version: options.version ?? DEFAULT_SERVER_VERSION,
  });

  registerFlipCardTools(server);
  registerFlipCardResources(server);

  return server;
}
