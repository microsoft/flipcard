import { createServer, type Server } from 'node:http';
import { createMcpHandler, type McpServerFactory } from '@modelcontextprotocol/server';
import { localhostHostValidation, localhostOriginValidation, toNodeHandler } from '@modelcontextprotocol/node';
import { createFlipCardServer } from './server.js';

export interface HttpServerOptions {
  host?: string;
  port?: number;
  factory?: McpServerFactory;
}

export interface FlipCardHttpServer {
  server: Server;
  url: string;
  close: () => Promise<void>;
}

export function validateLocalHost(host: string): void {
  if (!['127.0.0.1', 'localhost', '::1'].includes(host)) {
    throw new Error('HTTP is an unauthenticated localhost profile; host must be 127.0.0.1, localhost, or ::1.');
  }
}

export async function startFlipCardHttpServer(options: HttpServerOptions = {}): Promise<FlipCardHttpServer> {
  const host = options.host ?? '127.0.0.1';
  const port = options.port ?? 3000;
  validateLocalHost(host);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid HTTP port.');
  const handler = createMcpHandler(options.factory ?? (() => createFlipCardServer()));
  const nodeHandler = toNodeHandler(handler);
  const validHost = localhostHostValidation();
  const validOrigin = localhostOriginValidation();
  const server = createServer((req, res) => {
    if (!validHost(req, res) || !validOrigin(req, res)) return;
    if (req.url?.split('?')[0] !== '/mcp') {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    void nodeHandler(req, res);
  });
  try {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, host, () => {
        server.off('error', reject);
        resolve();
      });
    });
  } catch (error) {
    await handler.close();
    throw error;
  }
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No HTTP listen address.');
  return {
    server,
    url: `http://${host.includes(':') ? `[${host}]` : host}:${address.port}/mcp`,
    close: async () => {
      await handler.close();
      await new Promise<void>((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
        server.closeIdleConnections();
      });
    },
  };
}
