#!/usr/bin/env node
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { createFlipCardServer } from './server.js';
import { startFlipCardHttpServer } from './http.js';
import { parseCliArgs } from './cli-options.js';

async function main(): Promise<void> {
  const options = parseCliArgs(process.argv.slice(2));
  if (options.help) {
    console.log('flipcard-mcp [--transport stdio|http] [--host 127.0.0.1|localhost|::1] [--port 1..65535]\nHTTP is localhost-only and has no authentication. Default: stdio.');
    return;
  }
  const running = options.transport === 'http'
    ? await startFlipCardHttpServer(options)
    : await serveStdio(() => createFlipCardServer());
  if ('url' in running) console.error(`FlipCard MCP listening on ${running.url}`);
  const shutdown = (): void => {
    void running.close().then(() => process.exit(0), error => {
      console.error(error);
      process.exit(1);
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
