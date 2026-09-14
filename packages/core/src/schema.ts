/** Public URL where the FlipCard manifest JSON Schema is published. */
export const FLIPCARD_SCHEMA_URL = 'https://microsoft.github.io/flipcard/schema/v0.1.json';

/**
 * JSON Schema (draft-07) describing a {@link FlipCardManifest}.
 *
 * Suitable for publishing to a static URL and referencing from manifest
 * documents via the `$schema` property.
 */
export const flipCardManifestSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: FLIPCARD_SCHEMA_URL,
  title: 'FlipCardManifest',
  type: 'object',
  properties: {
    $schema: { type: 'string', format: 'uri' },
    version: { type: 'string' },
    id: { type: 'string' },
    title: { type: 'string' },
    design: {},
    schema: {},
    workflow: {
      type: 'object',
      properties: {
        onFlip: { type: 'string' },
        actions: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'type'],
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              data: {},
            },
          },
        },
      },
    },
    metadata: { type: 'object', additionalProperties: true },
  },
  additionalProperties: false,
} as const;

/**
 * Lightweight, dependency-free runtime check for a FlipCard manifest.
 *
 * This is intentionally narrow — for full draft-07 validation use Ajv against
 * {@link flipCardManifestSchema}.
 */
export function validateManifest(input: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (typeof input !== 'object' || input === null) {
    return { valid: false, errors: ['manifest must be an object'] };
  }
  const obj = input as Record<string, unknown>;
  for (const k of ['$schema', 'version', 'id', 'title'] as const) {
    if (k in obj && typeof obj[k] !== 'string') errors.push(`${k} must be a string`);
  }
  if ('workflow' in obj && (typeof obj.workflow !== 'object' || obj.workflow === null)) {
    errors.push('workflow must be an object');
  }
  if ('metadata' in obj && (typeof obj.metadata !== 'object' || obj.metadata === null)) {
    errors.push('metadata must be an object');
  }
  return { valid: errors.length === 0, errors };
}
