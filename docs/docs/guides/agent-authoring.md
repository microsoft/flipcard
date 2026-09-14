---
sidebar_position: 3
title: Agent authoring
---

# Agent authoring

FlipCard is designed to be authored by humans **or** LLM agents. The `@microsoft/flipcard-mcp` server gives any MCP‑capable host a small, opinionated tool surface for producing valid manifests.

## Configure the host

Add the server to your MCP client (Copilot Studio, Claude Desktop, VS Code MCP, etc.):

```jsonc
{
  "mcpServers": {
    "flipcard": {
      "command": "npx",
      "args": ["-y", "@microsoft/flipcard-mcp"]
    }
  }
}
```

## Recommended agent loop

A reliable agent loop for producing a card looks like this:

1. **Discover** — call `list_categories` to learn the seven presets and their intent. Do this once per session.
2. **Plan** — pick the category whose intent matches the user's request.
3. **Generate** — call `generate_manifest` with the chosen category and any provided titles.
4. **Refine** — edit `design.front`, `schema.back.fields`, and `workflow.actions` in place.
5. **Validate** — call `validate_manifest` on the final draft.
6. **Persist** — write the JSON wherever your application stores cards.

## Prompt scaffolding

A short system prompt that works well:

> You are a FlipCard authoring assistant. When the user asks for a card:
> 1. Call `list_categories` once to ground yourself.
> 2. Pick a category whose **intent** matches — never the closest color.
> 3. Call `generate_manifest` with `category`, `frontTitle`, and `backTitle`.
> 4. Edit the result so `design.front.summary` is one sentence and `schema.back.fields` reflects the data the user described.
> 5. Call `validate_manifest` and report the result.
> 6. Output the final JSON in a fenced `json` block.

## Quality bar

Before returning a manifest:

- `id` is stable, kebab‑case, and unique within the user's collection.
- `title` is human‑readable, not a duplicate of `id`.
- `design.front.title` is short enough to fit a card header.
- `design.front.summary` is one sentence and adds information the title doesn't.
- The category matches intent, not color preference.
- `validate_manifest` returns `{ valid: true }`.

## See also

- **[`@microsoft/flipcard-mcp`](../packages/mcp-server)** — the full tool/resource list.
- **[Categories & themes](./categories-and-themes)** — pick the right preset.
- **[Authoring manifests](./authoring-manifests)** — the underlying shape.
