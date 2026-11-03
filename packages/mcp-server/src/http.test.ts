// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { request } from 'node:http';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { createFlipCardServer } from './server.js';
import { startFlipCardHttpServer, type FlipCardHttpServer } from './http.js';

let running: FlipCardHttpServer | undefined;
const clients: Client[] = [];
afterEach(async () => {
  await Promise.all(clients.splice(0).map(client => client.close()));
  await running?.close();
  running = undefined;
});

async function connect(mode: 'auto' | 'legacy', name: string = mode): Promise<Client> {
  const client = new Client({ name, version: '1.0.0' }, { versionNegotiation: { mode } });
  clients.push(client);
  await client.connect(new StreamableHTTPClientTransport(new URL(running!.url)));
  return client;
}

describe('stateless HTTP', () => {
  it.each(['auto', 'legacy'] as const)('serves %s clients with a new closed server for each request', async mode => {
    const instances: ReturnType<typeof createFlipCardServer>[] = [];
    const closes: ReturnType<typeof vi.fn>[] = [];
    const eras: string[] = [];
    running = await startFlipCardHttpServer({ port: 0, factory: ctx => {
      const server = createFlipCardServer();
      instances.push(server);
      eras.push(ctx.era);
      const onclose = vi.fn();
      server.server.onclose = onclose;
      closes.push(onclose);
      server.registerTool('request_identity', { inputSchema: {} }, async () => ({
        content: [{ type: 'text' as const, text: String(instances.indexOf(server)) }],
      }));
      return server;
    } });
    const methods: string[] = [];
    const sessionHeaders: unknown[] = [];
    const responseSessions: unknown[] = [];
    running.server.on('request', req => {
      if (req.headers['mcp-method']) methods.push(String(req.headers['mcp-method']));
      if (req.headers['mcp-session-id']) sessionHeaders.push(req.headers['mcp-session-id']);
    });
    running.server.on('request', (_req, res) => {
      res.on('finish', () => { if (res.hasHeader('mcp-session-id')) responseSessions.push(res.getHeader('mcp-session-id')); });
    });
    const [a, b] = await Promise.all([connect(mode, 'a'), connect(mode, 'b')]);
    expect(a.getNegotiatedProtocolVersion()).toBe(mode === 'auto' ? '2026-07-28' : '2025-11-25');
    const tools = await a.listTools();
    expect(tools.tools.find(tool => tool.name === 'generate_manifest')?._meta).toMatchObject({
      ui: { resourceUri: 'ui://flipcard/viewer' },
    });
    const [first, second, third] = await Promise.all([
      a.callTool({ name: 'request_identity' }),
      b.callTool({ name: 'request_identity' }),
      a.callTool({ name: 'request_identity' }),
    ]);
    expect(new Set([first, second, third].map(result => JSON.stringify(result.content))).size).toBe(3);
    const manifest = await b.callTool({ name: 'generate_manifest', arguments: { frontTitle: 'Isolated', category: 'plum' } });
    expect(manifest.structuredContent).toMatchObject({ manifest: { design: { front: { title: 'Isolated' } } } });
    expect(new Set(instances).size).toBe(instances.length);
    await vi.waitFor(() => expect(closes.every(close => close.mock.calls.length > 0)).toBe(true));
    expect(sessionHeaders).toEqual([]);
    expect(responseSessions).toEqual([]);
    if (mode === 'auto') {
      expect(methods).toContain('server/discover');
      expect(methods).toContain('tools/call');
      expect(methods).not.toContain('initialize');
      expect(eras).toContain('modern');
    } else {
      expect(eras.every(era => era === 'legacy')).toBe(true);
    }
  });

  it('rejects remote Host and Origin, and leaves protocol errors to the SDK', async () => {
    running = await startFlipCardHttpServer({ port: 0 });
    for (const method of ['GET', 'DELETE', 'PUT', 'OPTIONS']) {
      const result = await fetch(running.url, { method });
      expect(result.status).toBe(405);
      expect(result.headers.get('allow')).toBe('POST');
      expect(await result.json()).toMatchObject({ jsonrpc: '2.0', error: { code: expect.any(Number) } });
    }
    for (const headers of [{ Origin: 'https://evil.example' }, { Origin: 'null' }]) {
      const result = await fetch(running.url, { method: 'POST', headers });
      expect(result.status).toBe(403);
      expect(result.headers.get('access-control-allow-origin')).toBeNull();
      await result.text();
    }
    const hostileHost = await new Promise<number | undefined>((resolve, reject) => {
      const req = request(running!.url, { method: 'POST', headers: { Host: 'evil.example' } }, res => {
        res.resume();
        res.on('end', () => resolve(res.statusCode));
      });

      req.on('error', reject);
      req.end();
    });
    expect(hostileHost).toBe(403);
    const malformed = await fetch(running.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: '{',
    });
    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toMatchObject({ jsonrpc: '2.0', error: { code: -32700 } });
    const client = await connect('auto');
    await expect(client.callTool({ name: 'missing' })).rejects.toThrow();
    const localOrigin = await fetch(running.url, {
      method: 'POST',
      headers: {
        Origin: 'http://localhost:3000',
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        'Mcp-Method': 'tools/list',
        'MCP-Protocol-Version': '2026-07-28',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {
        _meta: {
          'io.modelcontextprotocol/protocolVersion': '2026-07-28',
          'io.modelcontextprotocol/clientInfo': { name: 'raw-client', version: '1' },
          'io.modelcontextprotocol/clientCapabilities': {},
        },
      } }),
    });
    expect(localOrigin.status).toBe(200);
    expect(await localOrigin.json()).toMatchObject({ result: { tools: expect.any(Array) } });
  });

  it('serves modern and legacy clients simultaneously with unchanged tool/resource contracts', async () => {
    running = await startFlipCardHttpServer({ port: 0 });
    const [modern, legacy] = await Promise.all([connect('auto'), connect('legacy')]);
    const results = await Promise.all([modern, legacy].map(async client => {
      const categories = await client.callTool({ name: 'list_categories', arguments: {} });
      const schema = await client.readResource({ uri: 'flipcard://schema' });
      const example = await client.readResource({ uri: 'flipcard://examples/gold' });
      const templates = await client.listResourceTemplates();
      return { categories, schema, example, templates };
    }));
    for (const result of results) {
      expect(JSON.parse((result.categories.content as { text: string }[])[0]!.text)).toHaveLength(7);
      expect(result.schema.contents[0]?.mimeType).toBe('application/schema+json');
      expect(JSON.parse((result.example.contents[0] as { text: string }).text)).toMatchObject({ design: { category: 'gold' } });
      expect(result.templates.resourceTemplates[0]?.uriTemplate).toBe('flipcard://examples/{category}');
    }
    expect(modern.getNegotiatedProtocolVersion()).toBe('2026-07-28');
    expect(legacy.getNegotiatedProtocolVersion()).toBe('2025-11-25');
    const head = await fetch(running.url, { method: 'HEAD' });
    expect(head.status).toBe(405);
    expect(await head.text()).toBe('');
    const missing = await fetch(running.url.replace('/mcp', '/other'), { method: 'POST' });
    expect(missing.status).toBe(404);
    await missing.text();
    for (const method of ['GET', 'DELETE']) {
      const response = await fetch(running.url, { method, headers: { 'MCP-Protocol-Version': '2026-07-28' } });
      expect(response.status).toBe(405);
      await response.text();
    }
  });

  it('rejects a modern metadata header mismatch without a protocol session', async () => {
    running = await startFlipCardHttpServer({ port: 0 });
    const response = await fetch(running.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json', accept: 'application/json, text/event-stream',
        'MCP-Protocol-Version': '2026-07-28', 'Mcp-Method': 'tools/call',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 8, method: 'tools/list', params: {
        _meta: {
          'io.modelcontextprotocol/protocolVersion': '2026-07-28',
          'io.modelcontextprotocol/clientInfo': { name: 'raw-client', version: '1' },
          'io.modelcontextprotocol/clientCapabilities': {},
        },
      } }),
    });
    expect(response.status).toBe(400);
    expect(response.headers.get('mcp-session-id')).toBeNull();
    expect(await response.json()).toMatchObject({
      jsonrpc: '2.0', id: 8,
      error: { code: expect.any(Number), message: expect.stringMatching(/method/i) },
    });
  });
});
