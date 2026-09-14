import { describe, expect, it } from 'vitest';
import { FLIPCARD_SCHEMA_URL, type FlipCardManifest } from '@microsoft/flipcard-core';
import {
  CATEGORY_DESCRIPTIONS,
  createStarterManifest,
  flipCardToolDefinitions,
} from './tools.js';
import { getCategoriesResource, getExampleResource, getSchemaResource } from './resources.js';

function getTool<TName extends (typeof flipCardToolDefinitions)[number]['name']>(name: TName) {
  const tool = flipCardToolDefinitions.find((entry) => entry.name === name);
  if (!tool) {
    throw new Error(`Tool not found: ${name}`);
  }
  return tool;
}

async function invokeTool(name: (typeof flipCardToolDefinitions)[number]['name'], input: unknown) {
  const tool = getTool(name);
  const response = await tool.handler(input as never);
  const textContent = response.content.find((entry) => entry.type === 'text');

  if (!textContent) {
    throw new Error(`Tool ${name} did not return text content`);
  }

  return JSON.parse(textContent.text) as unknown;
}

describe('flipCardToolDefinitions', () => {
  it('lists the seven supported categories', async () => {
    const result = (await invokeTool('list_categories', {})) as typeof CATEGORY_DESCRIPTIONS;

    expect(result).toHaveLength(7);
    expect(result.map((entry) => entry.category)).toEqual(
      CATEGORY_DESCRIPTIONS.map((entry) => entry.category),
    );
  });

  it('returns the manifest schema', async () => {
    const result = (await invokeTool('get_schema', {})) as Record<string, unknown>;

    expect(result.$schema).toBe('http://json-schema.org/draft-07/schema#');
    expect(result.properties).toBeTypeOf('object');
  });

  it('accepts a valid manifest', async () => {
    const manifest: FlipCardManifest = {
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'valid-card',
      title: 'Valid card',
      metadata: { category: 'teal' },
    };

    const result = (await invokeTool('validate_manifest', { manifest })) as {
      valid: boolean;
      errors: string[];
    };

    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('rejects an invalid manifest', async () => {
    const result = (await invokeTool('validate_manifest', { manifest: { id: 123 } })) as {
      valid: boolean;
      errors: string[];
    };

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('id must be a string');
  });

  it('generates a manifest that validates cleanly', async () => {
    const manifest = (await invokeTool('generate_manifest', {
      category: 'navy',
      frontTitle: 'Docs',
      backTitle: 'Docs spec',
      includeWorkflow: true,
    })) as FlipCardManifest;

    expect(manifest.metadata).toMatchObject({ category: 'navy', generatedBy: 'flipcard-mcp' });

    const validation = (await invokeTool('validate_manifest', { manifest })) as {
      valid: boolean;
      errors: string[];
    };

    expect(validation).toEqual({ valid: true, errors: [] });
  });

  it('includes optional workflow actions when requested', () => {
    const manifest = createStarterManifest({ category: 'green', includeWorkflow: true });

    expect(manifest.workflow?.actions).toHaveLength(1);
    expect(manifest.workflow?.onFlip).toBe('flipcard.flip');
  });

  it.each(['react', 'vanilla', 'core'] as const)(
    'describes the %s component surface',
    async (framework) => {
      const result = (await invokeTool('describe_component', { framework })) as {
        framework: string;
        markdown: string;
      };

      expect(result.framework).toBe(framework);
      expect(result.markdown.length).toBeGreaterThan(30);
      expect(result.markdown).toContain('#');
    },
  );
});

describe('flipCard resources', () => {
  it('returns schema and category resources as JSON', () => {
    expect(getSchemaResource().contents[0]).toMatchObject({
      uri: 'flipcard://schema',
      mimeType: 'application/schema+json',
    });

    expect(getCategoriesResource().contents[0]).toMatchObject({
      uri: 'flipcard://categories',
      mimeType: 'application/json',
    });
  });

  it('returns a starter example resource for a category', () => {
    const resource = getExampleResource('plum');
    const manifest = JSON.parse(resource.contents[0]!.text) as FlipCardManifest;

    expect(resource.contents[0]!.uri).toBe('flipcard://examples/plum');
    expect(manifest.metadata).toMatchObject({ category: 'plum' });
  });
});
