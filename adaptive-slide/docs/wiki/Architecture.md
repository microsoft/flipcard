# Architecture

## System Overview

Adaptive Slide follows a three-phase pipeline:

```
 Parse ──▶ Resolve ──▶ Render
```

### Parse
- Load a `.deck.json` file
- Validate against JSON Schemas (AJV)
- Deserialize into a typed object tree: `Deck → Slide[] → Tile[]`

### Resolve
- Merge deck-level defaults into each slide
- Apply theme colors/fonts to unstyled tiles
- Calculate layout positions (stack, grid, freeform)
- Resolve external resource URIs

### Render
- Convert each slide's tile tree into renderable output
- Map tiles to Adaptive Cards elements (or native UI)
- Apply host-specific fallbacks for unsupported tile types

---

## Data Model

```
AdaptiveDeck
├── metadata: { title, author, tags, dates }
├── theme: { colors, fonts, darkMode }
├── defaults: { layout, transition, padding }
└── slides: AdaptiveSlide[]
     ├── id, title, notes
     ├── layout: { mode, columns, gap, alignment }
     ├── background: { color | image | gradient }
     ├── body: AdaptiveTile[]           ← the bucket
     │    ├── Tile.Text     { text, style, size, weight, color }
     │    ├── Tile.Image    { url, altText, size, caption }
     │    ├── Tile.Code     { code, language, lineNumbers }
     │    ├── Tile.Chart    { chartType, data, legend }
     │    ├── Tile.Media    { sources, poster, autoplay }
     │    └── Tile.Container
     │         └── items: AdaptiveTile[]    ← recursive
     └── actions: Action[]
```

---

## Layout Modes

### Stack (default)
Tiles flow vertically, top to bottom. Spacing controls gaps.

### Grid
CSS-grid-like layout. Each tile specifies `gridPosition` with `column`, `row`, `columnSpan`, `rowSpan`. The slide's `layout.columns` sets the grid column count.

### Freeform
Absolute positioning. Each tile specifies `freeformPosition` with `x`, `y`, `width`, `height` (all as percentages 0–100), plus optional `rotation` and `zIndex`.

---

## Adaptive Cards Mapping

The rendering phase maps tiles to native AC elements:

| Tile | AC Element | Notes |
|------|-----------|-------|
| `Tile.Text` | `TextBlock` | `style: "heading"` → large bold |
| `Tile.Image` | `Image` | Direct 1:1 mapping |
| `Tile.Code` | `CodeBlock` (v1.6) | Falls back to monospace `TextBlock` |
| `Tile.Chart` | Extension | Server-rendered to `Image` on basic hosts |
| `Tile.Media` | `Media` | Direct 1:1 mapping |
| `Tile.Container` | `Container` | Nested tiles become nested AC elements |

---

## Extension Model

### Custom Tiles

1. Define a JSON Schema extending `TileBase`
2. Use `Tile.YourType` as the discriminator
3. Register a renderer function
4. Provide an AC fallback for basic hosts

### Theme Extensions

Themes are open for extension (`additionalProperties: true`). Host-specific properties go under a namespaced key.

---

## Source Structure

```
adaptive-slide/
├── schemas/                  ← JSON Schema definitions
│   ├── deck.schema.json
│   ├── slide.schema.json
│   ├── tile.schema.json
│   └── tiles/
│       ├── text-tile.schema.json
│       ├── image-tile.schema.json
│       ├── code-tile.schema.json
│       ├── chart-tile.schema.json
│       ├── media-tile.schema.json
│       └── container-tile.schema.json
├── docs/
│   ├── spec/                 ← Technical specification
│   └── wiki/                 ← This wiki
├── src/                      ← TypeScript implementation
│   ├── types/                ← Generated/hand-written types
│   ├── parser/               ← Schema validation + deserialization
│   ├── renderer/             ← Tile → AC card conversion
│   └── builder/              ← Fluent API for deck construction
├── examples/                 ← Example .deck.json files
└── tests/                    ← Validation + rendering tests
```
