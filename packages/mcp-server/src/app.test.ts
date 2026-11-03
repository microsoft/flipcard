// @vitest-environment node
import { readFile } from 'node:fs/promises';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Window } from 'happy-dom';
import { Client, StreamableHTTPClientTransport, type Transport, type JSONRPCMessage } from '@modelcontextprotocol/client';
import { AppBridge } from '@modelcontextprotocol/ext-apps/app-bridge';
import { createViewerApp } from './viewer-app.js';
import { startFlipCardHttpServer } from './http.js';
import { createStarterManifest } from './tools.js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

beforeAll(async () => {
  const cwd = fileURLToPath(new URL('..', import.meta.url));
  if (process.platform === 'win32') {
    await promisify(execFile)(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', 'npm run build:viewer'], { cwd });
  } else {
    await promisify(execFile)('npm', ['run', 'build:viewer'], { cwd });
  }
}, 60000);

function linkedTransports(messages: JSONRPCMessage[]): [Transport, Transport] {
  let a: Transport;
  let b: Transport;
  a = {
    async start() {}, async close() { a.onclose?.(); },
    async send(message) { messages.push(message); queueMicrotask(() => b.onmessage?.(message)); },
  };
  b = {
    async start() {}, async close() { b.onclose?.(); },
    async send(message) { queueMicrotask(() => a.onmessage?.(message)); },
  };
  return [a, b];
}

describe('FlipCard MCP App', () => {
  it('boots the shipped inline bundle over postMessage and calls the real tool', async () => {
    const dom = new Window({ settings: { enableJavaScriptEvaluation: true } });
    const running = await startFlipCardHttpServer({ port: 0 });
    const client = new Client({ name: 'bundle-host', version: '1' }, { versionNegotiation: { mode: 'auto' } });
    const bridge = new AppBridge(null, { name: 'Bundle host', version: '1' }, { serverTools: {} });
    // Match postMessage's target-realm cloning and the iframe's parent identity.
    const source = dom.eval('window.parent');
    const hostTransport: Transport = {
      async start() {},
      async close() { hostTransport.onclose?.(); },
      async send(message) {
        queueMicrotask(() => dom.dispatchEvent(new dom.MessageEvent('message', {
          data: dom.JSON.parse(JSON.stringify(message)), source,
        })));
      },
    };
    dom.postMessage = message => {
      queueMicrotask(() => hostTransport.onmessage?.(JSON.parse(JSON.stringify(message)) as JSONRPCMessage));
    };
    let initialized = false;
    bridge.oninitialized = () => { initialized = true; };
    bridge.oncalltool = params => client.callTool(params);
    try {
      await client.connect(new StreamableHTTPClientTransport(new URL(running.url)));
      await bridge.connect(hostTransport);
      dom.document.write(await readFile(new URL('../dist/viewer.html', import.meta.url), 'utf8'));
      await vi.waitFor(() => expect(initialized).toBe(true));
      (dom.document.getElementById('title') as unknown as HTMLInputElement).value = 'From the bundled app';
      dom.document.getElementById('generate')!.dispatchEvent(new dom.Event('submit', { cancelable: true }));
      await vi.waitFor(() => expect(dom.document.getElementById('front-title')!.textContent).toBe('From the bundled app'));
      await bridge.teardownResource({});
      expect((dom.document.getElementById('regenerate') as unknown as HTMLButtonElement).disabled).toBe(true);
    } finally {
      dom.dispatchEvent(new dom.Event('pagehide'));
      await bridge.close(); await client.close(); await running.close(); await dom.happyDOM.close();
    }
  });

  it('serves the tool-bound self-contained resource and a valid structured manifest', async () => {
    const running = await startFlipCardHttpServer({ port: 0 });
    const client = new Client({ name: 'app-test', version: '1' }, { versionNegotiation: { mode: 'auto' } });
    try {
      await client.connect(new StreamableHTTPClientTransport(new URL(running.url)));
      const tools = await client.listTools();
      const tool = tools.tools.find(item => item.name === 'generate_manifest')!;
      expect(tool._meta).toMatchObject({ ui: { resourceUri: 'ui://flipcard/viewer' } });
      const result = await client.readResource({ uri: 'ui://flipcard/viewer' });
      const resource = result.contents[0]!;
      expect(resource.mimeType).toBe('text/html;profile=mcp-app');
      expect(resource._meta).toMatchObject({ ui: { csp: { connectDomains: [], resourceDomains: [], frameDomains: [] } } });
      const html = 'text' in resource ? resource.text : '';
      expect(html).toContain('<script>');
      expect(html).not.toMatch(/<script[^>]*src=|<link[^>]*href=|<!-- APP_SCRIPT -->/);
      const manifest = await client.callTool({ name: 'generate_manifest', arguments: {} });
      const validation = await client.callTool({ name: 'validate_manifest', arguments: { manifest: (manifest.structuredContent as { manifest: unknown }).manifest } });
      expect(validation.content).toContainEqual({ type: 'text', text: JSON.stringify({ valid: true, errors: [] }, null, 2) });
    } finally { await client.close(); await running.close(); }
  });

  it('completes SDK initialization, receives tool input/result, flips, and calls the real server tool', async () => {
    const dom = new Window();
    dom.document.write(await readFile(new URL('./viewer.html', import.meta.url), 'utf8'));
    const running = await startFlipCardHttpServer({ port: 0 });
    const client = new Client({ name: 'mock-host', version: '1' }, { versionNegotiation: { mode: 'auto' } });
    const app = createViewerApp(dom.document as unknown as Document);
    const bridge = new AppBridge(null, { name: 'Fixture host', version: '1' }, { serverTools: {} }, { hostContext: { theme: 'dark' } });
    const messages: JSONRPCMessage[] = [];
    const [appTransport, hostTransport] = linkedTransports(messages);
    let initialized = false;
    const calls: string[] = [];
    bridge.oninitialized = () => { initialized = true; };
    bridge.oncalltool = async params => {
      calls.push(params.name);
      return client.callTool(params);
    };
    try {
      await client.connect(new StreamableHTTPClientTransport(new URL(running.url)));
      await bridge.connect(hostTransport);
      await app.connect(appTransport);
      expect(initialized).toBe(true);
      expect(dom.document.documentElement.dataset.theme).toBe('dark');
      expect(messages.filter(message => 'method' in message).map(message => 'method' in message && message.method))
        .toEqual(['ui/initialize', 'ui/notifications/initialized']);
      expect(messages[0]).toMatchObject({ params: { protocolVersion: '2026-01-26' } });
      await bridge.sendToolInput({ arguments: { category: 'gold', frontTitle: 'Input title' } });
      await new Promise(resolve => setTimeout(resolve, 0));
      expect((dom.document.getElementById('title') as unknown as HTMLInputElement).value).toBe('Input title');
      const title = '<img src=x onerror=alert(1)>';
      await bridge.sendToolResult({ content: [], structuredContent: { manifest: createStarterManifest({ frontTitle: title }) } });
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(dom.document.getElementById('front-title')!.textContent).toBe(title);
      expect(dom.document.querySelector('img')).toBeNull();
      (dom.document.getElementById('flip') as unknown as HTMLButtonElement).click();
      expect((dom.document.getElementById('back') as unknown as HTMLElement).hidden).toBe(false);
      (dom.document.getElementById('title') as unknown as HTMLInputElement).value = 'Regenerated';
      dom.document.getElementById('generate')!.dispatchEvent(new dom.Event('submit', { cancelable: true }));
      await new Promise<void>((resolve, reject) => {
        const timer = setInterval(() => {
          if (dom.document.getElementById('front-title')!.textContent === 'Regenerated') {
            clearInterval(timer); clearTimeout(timeout); resolve();
          }
        }, 10);
        const timeout = setTimeout(() => { clearInterval(timer); reject(new Error('Tool result never rendered')); }, 5000);
      });
      expect(calls).toEqual(['generate_manifest']);
      await bridge.sendHostContextChange({ theme: 'light' });
      await vi.waitFor(() => expect(dom.document.documentElement.dataset.theme).toBe('light'));
      await bridge.sendToolResult({ content: [], isError: true });
      await vi.waitFor(() => expect(dom.document.getElementById('status')!.textContent).toContain('could not generate'));
      await bridge.sendToolCancelled({ reason: 'Cancelled by user' });
      await vi.waitFor(() => expect(dom.document.getElementById('status')!.textContent).toContain('cancelled'));

      let finish: (() => void) | undefined;
      bridge.oncalltool = async params => {
        calls.push(params.name);
        const result = await client.callTool(params);
        await new Promise<void>(resolve => { finish = resolve; });
        return result;
      };
      (dom.document.getElementById('title') as unknown as HTMLInputElement).value = 'Late result';
      dom.document.getElementById('generate')!.dispatchEvent(new dom.Event('submit', { cancelable: true }));
      await vi.waitFor(() => expect(finish).toBeTypeOf('function'));
      await bridge.teardownResource({});
      finish!();
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(dom.document.getElementById('front-title')!.textContent).toBe('Regenerated');
      expect((dom.document.getElementById('regenerate') as unknown as HTMLButtonElement).disabled).toBe(true);
      expect((dom.document.getElementById('flip') as unknown as HTMLButtonElement).disabled).toBe(true);
      dom.document.getElementById('generate')!.dispatchEvent(new dom.Event('submit', { cancelable: true }));
      expect(calls).toHaveLength(2);
    } finally {
      await app.close(); await bridge.close(); await client.close(); await running.close(); await dom.happyDOM.close();
    }
  });
});
