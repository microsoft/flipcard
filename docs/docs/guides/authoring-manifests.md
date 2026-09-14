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

Both `id` and `title` are optional but recommended — `id` for stable references, `title` for the back‑face header.

## Recommended shape

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
   { "$schema": "https://microsoft.github.io/flipcard/schema/v0.1.json", ... }
   ```

   VS Code, JetBrains, and most editors will give you completion and inline validation for free.

2. **Runtime** — call the validator:

   ```ts
   import { validateManifest } from '@microsoft/flipcard-core';

   const result = validateManifest(myManifest);
   if (!result.valid) console.error(result.errors);
   ```

   For full draft‑07 validation use [Ajv](https://ajv.js.org/) against `flipCardManifestSchema`.

## Patterns

### Card grid from a list of records

Store one manifest per record, then render them with `<FlipCardCatalog>`:

```ts
const cards = records.map((r) => ({
  $schema: 'https://microsoft.github.io/flipcard/schema/v0.1.json',
  id: r.id,
  title: r.name,
  design: { category: r.status === 'green' ? 'green' : 'red',
            front: { title: r.name, summary: r.description } },
  schema: { back: { title: r.name, fields: Object.entries(r) } },
}));
```

### Versioning

Bump `version` when a card's shape changes in a way clients should detect. Keep `id` stable across versions so links still resolve.

### Free‑form metadata

`metadata` is a free `Record<string, unknown>` — use it for ownership, build numbers, telemetry IDs, anything you want surfaced on the back face but not part of the visible design.

## See also

- **[Manifest reference](../reference/manifest)** — the full JSON Schema.
- **[Agent authoring](./agent-authoring)** — let an LLM do the work.
