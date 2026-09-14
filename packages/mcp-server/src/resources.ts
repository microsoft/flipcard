import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { flipCardManifestSchema } from '@microsoft/flipcard-core';
import { CATEGORY_DESCRIPTIONS, CATEGORY_VALUES, createStarterManifest, type FlipCardCategory } from './tools.js';

export interface ResourceResponse {
  [key: string]: unknown;
  contents: Array<{
    uri: string;
    mimeType: string;
    text: string;
  }>;
}

export type ResourceRegistrar = Pick<
  import('@modelcontextprotocol/sdk/server/mcp.js').McpServer,
  'registerResource'
>;

function toResource(uri: string, mimeType: string, value: unknown): ResourceResponse {
  return {
    contents: [
      {
        uri,
        mimeType,
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

export function getSchemaResource(): ResourceResponse {
  return toResource('flipcard://schema', 'application/schema+json', flipCardManifestSchema);
}

export function getCategoriesResource(): ResourceResponse {
  return toResource('flipcard://categories', 'application/json', CATEGORY_DESCRIPTIONS);
}

export function getExampleResource(category: FlipCardCategory): ResourceResponse {
  return toResource(`flipcard://examples/${category}`, 'application/json', createStarterManifest({ category }));
}

export function registerFlipCardResources(server: ResourceRegistrar): void {
  server.registerResource(
    'flipcard-schema',
    'flipcard://schema',
    { title: 'FlipCard manifest schema', mimeType: 'application/schema+json' },
    async () => getSchemaResource(),
  );
  server.registerResource(
    'flipcard-categories',
    'flipcard://categories',
    { title: 'FlipCard categories', mimeType: 'application/json' },
    async () => getCategoriesResource(),
  );
  server.registerResource(
    'flipcard-example',
    new ResourceTemplate('flipcard://examples/{category}', {
      list: undefined,
      complete: {
        category: () => [...CATEGORY_VALUES],
      },
    }),
    { title: 'FlipCard starter manifest', mimeType: 'application/json' },
    async (_uri: URL, params: Record<string, string | string[]>) => {
      const category = Array.isArray(params.category) ? params.category[0] : params.category;

      if (
        category == null ||
        !CATEGORY_VALUES.includes(category as FlipCardCategory)
      ) {
        throw new Error(`Unsupported FlipCard category: ${String(category)}`);
      }

      return getExampleResource(category as FlipCardCategory);
    },
  );
}
