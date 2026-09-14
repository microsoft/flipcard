import { describe, it, expect } from 'vitest';
import {
  validateManifest,
  flipCardManifestSchema,
  FLIPCARD_SCHEMA_URL,
} from './schema';

describe('flipCardManifestSchema', () => {
  it('exposes the published $id URL', () => {
    expect(flipCardManifestSchema.$id).toBe(FLIPCARD_SCHEMA_URL);
    expect(flipCardManifestSchema.title).toBe('FlipCardManifest');
  });
});

describe('validateManifest', () => {
  it('accepts an empty object', () => {
    expect(validateManifest({})).toEqual({ valid: true, errors: [] });
  });

  it('accepts a fully populated manifest', () => {
    const result = validateManifest({
      $schema: FLIPCARD_SCHEMA_URL,
      version: '0.1.0',
      id: 'card-1',
      title: 'Hello',
      design: { kind: 'AdaptiveCard' },
      schema: { foo: 'bar' },
      workflow: { onFlip: 'flipped', actions: [{ id: 'a', type: 'noop' }] },
      metadata: { tag: 'demo' },
    });
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('rejects non-objects', () => {
    expect(validateManifest(null).valid).toBe(false);
    expect(validateManifest('hello').valid).toBe(false);
    expect(validateManifest(42).valid).toBe(false);
  });

  it('rejects wrong property types', () => {
    const result = validateManifest({ id: 123, workflow: 'oops', metadata: 5 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('id must be a string');
    expect(result.errors).toContain('workflow must be an object');
    expect(result.errors).toContain('metadata must be an object');
  });
});
