# Adaptive Slide Wiki

Welcome to the Adaptive Slide wiki — the comprehensive guide for building, viewing, and extending schema-driven presentations.

## What is Adaptive Slide?

Adaptive Slide is a presentation format built on the [Adaptive Cards](https://adaptivecards.io/) open card exchange format. It brings the portability and schema-validation of Adaptive Cards to the presentation domain.

**Key idea:** Each slide is an Adaptive Card bucket containing Adaptive Tiles. Tiles are the atomic content blocks — text, images, code, charts — each defined by its own card schema.

## Pages

| Page | Description |
|------|-------------|
| [Architecture](Architecture.md) | System design, data model, and rendering pipeline |
| [Schema Reference](Schema-Reference.md) | Complete reference for all schemas and tile types |
| [Getting Started](Getting-Started.md) | Build your first deck in 5 minutes |
| [MCP App Plugin](MCP-App-Plugin.md) | Render decks as interactive MCP Apps |

## Quick Links

- [Technical Specification](../spec/technical-specification.md)
- [Example Deck](../../examples/hello-world.deck.json)
- [Adaptive Cards Docs](https://adaptivecards.io/)
- [JSON Schema Spec](https://json-schema.org/draft/2020-12/json-schema-core)

## Core Concepts

```
Deck ──▶ contains Slides ──▶ each Slide has a Bucket ──▶ Bucket holds Tiles
```

| Concept | Description |
|---------|-------------|
| **Deck** | The presentation — metadata, theme, and an ordered list of slides |
| **Slide** | A single page with layout, background, and a body of tiles |
| **Bucket** | The slide's Adaptive Card root — the composition surface |
| **Tile** | An atomic content unit with its own tile card schema |

## Tile Types

| Type | Description |
|------|-------------|
| `Tile.Text` | Rich text — headings, body, captions, quotes |
| `Tile.Image` | Images with alt text, sizing, and captions |
| `Tile.Code` | Syntax-highlighted code blocks |
| `Tile.Chart` | Data visualizations — bar, line, pie, etc. |
| `Tile.Media` | Embedded video/audio |
| `Tile.Container` | Nests other tiles for complex layouts |
