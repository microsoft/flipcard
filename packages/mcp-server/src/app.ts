import { readFile } from 'node:fs/promises';
import type { McpServer } from '@modelcontextprotocol/server';
import { registerAppResource, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';

export const FLIPCARD_APP_URI = 'ui://flipcard/viewer';
export const FLIPCARD_APP_META = {
  ui: {
    prefersBorder: true,
    csp: { connectDomains: [], resourceDomains: [], frameDomains: [], baseUriDomains: [] },
  },
};

export function registerFlipCardApp(server: Pick<McpServer, 'registerResource'>): void {
  registerAppResource(server, 'flipcard-viewer', FLIPCARD_APP_URI, {
    title: 'FlipCard viewer',
    description: 'Interactive card preview, back face, manifest, and regeneration controls.',
    _meta: FLIPCARD_APP_META,
  }, async () => ({
    contents: [{
      uri: FLIPCARD_APP_URI,
      mimeType: RESOURCE_MIME_TYPE,
      text: await readFile(new URL('../dist/viewer.html', import.meta.url), 'utf8'),
      _meta: FLIPCARD_APP_META,
    }],
  }));
}
