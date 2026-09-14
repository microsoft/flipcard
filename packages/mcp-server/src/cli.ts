#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createFlipCardServer } from './server.js';

async function main(): Promise<void> {
  const server = createFlipCardServer();
  const transport = new StdioServerTransport();

  const shutdown = async (): Promise<void> => {
    await Promise.allSettled([server.close(), transport.close?.()]);
    process.exit(0);
  };

  process.once('SIGINT', () => {
    void shutdown();
  });
  process.once('SIGTERM', () => {
    void shutdown();
  });

  await server.connect(transport);
  await new Promise<void>(() => undefined);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
