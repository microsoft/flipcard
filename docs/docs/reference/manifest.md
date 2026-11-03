---
sidebar_position: 1
title: Manifest schema
---

# Manifest schema

The FlipCard manifest is a JSON Schema (draft‑07) document published at:

> **https://microsoft.github.io/flipcard/schema/v0.1.json**

Reference it from any manifest via `$schema` to get editor completion and validation:

```json
{ "$schema": "https://microsoft.github.io/flipcard/schema/v0.1.json" }
```

## Schema (draft‑07)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://microsoft.github.io/flipcard/schema/v0.1.json",
  "title": "FlipCardManifest",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "$schema":  { "type": "string", "format": "uri" },
    "version":  { "type": "string" },
    "id":       { "type": "string" },
    "title":    { "type": "string" },
    "design":   {},
    "schema":   {},
    "workflow": {
      "type": "object",
      "properties": {
        "onFlip":  { "type": "string" },
        "actions": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["id", "type"],
            "properties": {
              "id":   { "type": "string" },
              "type": { "type": "string" },
              "data": {}
            }
          }
        }
      }
    },
    "metadata": { "type": "object", "additionalProperties": true }
  }
}
```

You can also fetch the same object at runtime:

```ts
import { flipCardManifestSchema, FLIPCARD_SCHEMA_URL } from '@microsoft/flipcard-core';
```

## Field semantics

All top-level fields are optional; the schema accepts `{}` but rejects unknown
top-level properties. `design` and `schema` have unconstrained schemas: a
draft-07 validation pass does not validate their contents or guarantee a
renderable card.

| Field | Type | Notes |
|---|---|---|
| `$schema` | `string (uri)` | Should always point at the published schema URL. |
| `version` | `string` | Manifest semver. Bump when the shape changes meaningfully. |
| `id` | `string` | Stable identifier. Recommend kebab‑case. |
| `title` | `string` | Human‑readable label, typically used on the back face. |
| `design` | `unknown` | Opaque to core. MCP starters use `{ category, front: { title, summary } }`; asset renderers instead require `kind` and `headline`. |
| `schema` | `unknown` | Structured payload exposed on the back face. The conventional shape is `{ back: { title, fields: [] } }`. |
| `workflow` | `object` | Optional. `onFlip` is an event name; `actions[]` are declarative descriptors. |
| `workflow.actions[]` | `object` | Each requires `id` and `type`; `data` is free‑form. |
| `metadata` | `Record<string, unknown>` | Free‑form. Use it for ownership, build IDs, telemetry IDs, etc. |

## Runtime validator

`validateManifest` from `@microsoft/flipcard-core` provides a quick, dependency‑free shape check:

```ts
import { validateManifest } from '@microsoft/flipcard-core';

validateManifest({ id: 'x', title: 'Hello' });
// → { valid: true, errors: [] }

validateManifest({ id: 5 });
// → { valid: false, errors: ['id must be a string'] }
```

The runtime check currently checks only non-null object input, string values
for `$schema`/`version`/`id`/`title`, and non-null object values for `workflow`
and `metadata`. It does not reject arrays, unknown properties, invalid URI
formats, or malformed nested actions. A result of `valid: true` is not a
complete draft-07 validation result.

Use [Ajv](https://ajv.js.org/) against `flipCardManifestSchema`, with URI format
support configured, for full draft-07 validation in build pipelines. Validate
renderer assets, Adaptive Card payloads, and authorized workflow behavior
separately. Workflow descriptors never execute themselves.
