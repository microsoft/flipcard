---
sidebar_position: 2
title: Authoring manifests
---

# Authoring manifests

A FlipCard manifest is plain JSON. You can hand‑write it, generate it from a build step, or have an LLM produce it via the MCP server. This page covers the hand‑authoring path.

## Minimum viable manifest

```json
{
  "$schema": "https://microsoft.github.io/flipcard/schema/v0.1.json",
  "id": "welcome",
  "title": "Welcome"
}
```

Both `id` and `title` are optional in the core schema but recommended.
The core schema has no required top-level fields, so `{}` is also valid.
This minimum is not a renderable asset.

## Authoring convention

The MCP tools use this convention. Core treats `design` and `schema` as opaque
payloads, and the renderer APIs do not interpret `design.front` automatically:

```jsonc
{
  "$schema": "https://microsoft.github.io/flipcard/schema/v0.1.json",
  "version": "0.1.0",
  "id": "welcome",
  "title": "Welcome card",

  "design": {
    "category": "teal",
    "front": {
      "title": "Hello FlipCard",
      "summary": "Click to flip and see the manifest."
    }
  },

  "schema": {
    "back": {
      "title": "Welcome",
      "fields": [
        { "name": "title",    "type": "string", "example": "Hello FlipCard" },
        { "name": "category", "type": "string", "example": "teal" }
      ]
    }
  },

  "workflow": {
    "onFlip": "flipcard.flip",
    "actions": [
      {
        "id": "log-flip",
        "type": "telemetry",
        "data": { "event": "flipcard.flip", "category": "teal" }
      }
    ]
  },

  "metadata": {
    "owner": "ux-team",
    "createdAt": "2026-04-24T18:00:00Z"
  }
}
```

## Validation

Two layers:

1. **Static** — point your editor at the public schema:

   ```json
   { "$schema": "https://microsoft.github.io/flipcard/schema/v0.1.json" }
   ```

   VS Code, JetBrains, and most editors will give you completion and inline validation for free.

2. **Runtime** — call the validator:

   ```ts
   import { validateManifest } from '@microsoft/flipcard-core';

   const result = validateManifest(myManifest);
   if (!result.valid) console.error(result.errors);
   ```

   This is a narrow shape check, not full JSON Schema validation. For full
   draft-07 validation use [Ajv](https://ajv.js.org/) against
   `flipCardManifestSchema`, with URI format support configured. Neither check
   validates opaque design/schema payloads or grants permission to run actions.

## Patterns

### Card grid from a list of records

`FlipCardCatalog` takes assets, not bare manifests. Map records into the
renderer-specific shape (with the [renderer CSS](../packages/react.md) loaded):

```tsx
import { FlipCardCatalog, type FlipCardRenderableAsset } from '@microsoft/flipcard-react';

const records = [
  { id: 'release', name: 'Release', description: 'Ready to review', status: 'ready' },
];
const assets: FlipCardRenderableAsset[] = records.map((r) => ({
  id: r.id,
  category: 'status',
  title: r.name,
  summary: r.description,
  theme: 'light',
  manifest: {
    $schema: 'https://microsoft.github.io/flipcard/schema/v0.1.json',
    id: r.id,
    title: r.name,
    design: { kind: 'status', headline: r.name, summary: r.description },
    schema: { status: r.status },
    metadata: { category: 'status', theme: 'light', tags: [] },
  },
}));

export function RecordCards() {
  return <FlipCardCatalog assets={assets} />;
}
```

Vanilla's `FlipCardAssetEntry` additionally requires manifest `design`, `schema`,
and `metadata` (including category, theme, and tags). The two renderers do not
promise identical output or support every Adaptive Card feature.

### Versioning

Bump `version` when a card's shape changes in a way clients should detect. Keep `id` stable across versions so links still resolve.

### Free‑form metadata

Core `metadata` is a free `Record<string, unknown>` — use it for ownership,
build numbers, and telemetry IDs. Asset metadata has additional typed fields.
Both asset renderers serialize the whole manifest on the back; metadata is not
a place to hide secrets.

## See also

- **[Manifest reference](../reference/manifest)** — the full JSON Schema.
- **[Agent authoring](./agent-authoring)** — let an LLM do the work.
