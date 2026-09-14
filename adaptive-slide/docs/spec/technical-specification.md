# Adaptive Slide — Technical Specification

**Version:** 0.1.0  
**Status:** Draft  
**Schema Base:** Adaptive Cards 1.6

---

## 1. Overview

Adaptive Slide is a schema-driven presentation format that layers a presentation model on top of the [Adaptive Cards](https://adaptivecards.io/) open card exchange format. The goal: portable, schema-validated slide decks that can be authored by any tool and rendered by any Adaptive Cards host.

### 1.1 Design Principles

| Principle | Description |
|-----------|-------------|
| **Schema-first** | Every element is defined by a JSON Schema. No implicit structure. |
| **Composable** | Tiles compose into slides, slides compose into decks. Container tiles enable nesting. |
| **Portable** | A `.deck.json` file is self-contained and renderable without external dependencies. |
| **Extensible** | Custom tile types can be registered via schema extension. |
| **Adaptive Cards native** | Tiles map cleanly to Adaptive Cards elements for host compatibility. |

### 1.2 Terminology

| Term | Definition |
|------|-----------|
| **Deck** | A complete presentation — ordered slides plus metadata and theme |
| **Slide** | A single page — an Adaptive Card bucket that contains tiles |
| **Bucket** | The Adaptive Card root element of a slide — the composition surface |
| **Tile** | An atomic content unit (text, image, code, chart, media, container) |
| **Tile Card Schema** | The JSON Schema defining a specific tile type's shape |

---

## 2. Data Model

### 2.1 Hierarchy

```
AdaptiveDeck
├── metadata: DeckMetadata
├── theme: Theme
├── defaults: SlideDefaults
└── slides: AdaptiveSlide[]
     ├── layout: LayoutConfig
     ├── background: Background
     ├── body: AdaptiveTile[]          ← the bucket
     │    ├── Tile.Text
     │    ├── Tile.Image
     │    ├── Tile.Code
     │    ├── Tile.Chart
     │    ├── Tile.Media
     │    └── Tile.Container
     │         └── items: AdaptiveTile[]   ← recursive nesting
     └── actions: Action[]
```

### 2.2 Type Discriminators

All top-level objects use a `type` discriminator:

| Object | `type` value |
|--------|-------------|
| Deck | `"AdaptiveDeck"` |
| Slide | `"AdaptiveSlide"` |
| Text tile | `"Tile.Text"` |
| Image tile | `"Tile.Image"` |
| Code tile | `"Tile.Code"` |
| Chart tile | `"Tile.Chart"` |
| Media tile | `"Tile.Media"` |
| Container tile | `"Tile.Container"` |

### 2.3 Schema URIs

```
schemas/
├── deck.schema.json          → AdaptiveDeck
├── slide.schema.json         → AdaptiveSlide
├── tile.schema.json          → AdaptiveTile (union/discriminated)
└── tiles/
    ├── text-tile.schema.json
    ├── image-tile.schema.json
    ├── code-tile.schema.json
    ├── chart-tile.schema.json
    ├── media-tile.schema.json
    └── container-tile.schema.json
```

---

## 3. Schema Details

### 3.1 Deck Schema (`AdaptiveDeck`)

**Required fields:** `$schema`, `type`, `version`, `slides`

| Field | Type | Description |
|-------|------|-------------|
| `$schema` | string | Schema URI for validation |
| `type` | `"AdaptiveDeck"` | Type discriminator |
| `version` | string | Semver format version |
| `metadata` | DeckMetadata | Title, author, tags, dates |
| `theme` | Theme | Colors, fonts, dark mode |
| `slides` | AdaptiveSlide[] | Ordered slide array (≥1) |
| `defaults` | SlideDefaults | Layout, transition, padding defaults |

### 3.2 Slide Schema (`AdaptiveSlide`)

**Required fields:** `type`, `body`

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"AdaptiveSlide"` | Type discriminator |
| `id` | string | Unique slide ID |
| `title` | string | Slide title for navigation |
| `notes` | string | Speaker notes |
| `layout` | LayoutConfig | Layout mode and alignment |
| `background` | Background | Color, image, or gradient |
| `transition` | enum | Entry transition effect |
| `body` | AdaptiveTile[] | The bucket — array of tiles |
| `actions` | Action[] | Slide-level actions |

### 3.3 Tile Base Properties

All tiles inherit these common properties:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | string | — | Tile type discriminator |
| `id` | string | — | Unique tile ID |
| `isVisible` | boolean | `true` | Visibility toggle |
| `spacing` | enum | `"default"` | Spacing above tile |
| `separator` | boolean | `false` | Separator line above tile |
| `gridPosition` | GridPosition | — | Position in grid layout |
| `freeformPosition` | FreeformPosition | — | Position in freeform layout |

### 3.4 Layout Modes

| Mode | Description | Positioning |
|------|-------------|-------------|
| **stack** | Vertical flow (default) | Sequential, top-to-bottom |
| **grid** | CSS-grid-like | `gridPosition` (column, row, spans) |
| **freeform** | Absolute positioning | `freeformPosition` (x, y, width, height as %) |

---

## 4. Adaptive Cards Mapping

Tiles map to Adaptive Cards elements for rendering on any AC host:

| Tile Type | Adaptive Cards Element |
|-----------|----------------------|
| `Tile.Text` | `TextBlock` / `RichTextBlock` |
| `Tile.Image` | `Image` |
| `Tile.Code` | `TextBlock` with `fontType: "monospace"` + `CodeBlock` (v1.6) |
| `Tile.Chart` | Custom extension (rendered to `Image` on unsupported hosts) |
| `Tile.Media` | `Media` |
| `Tile.Container` | `Container` / `ColumnSet` |

### 4.1 Fallback Strategy

When a host doesn't support a tile type natively:

1. **Tile.Chart** → Render chart server-side, emit as `Image` with `altText`
2. **Tile.Code** → Fall back to `TextBlock` with monospace font
3. **Custom tiles** → Use the tile's `fallback` property (AC 1.2+)

---

## 5. Rendering Pipeline

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│  .deck.json │ ──▶ │    Parser    │ ──▶ │   Resolver    │ ──▶ │   Renderer   │
│   (input)   │     │ (validate +  │     │ (theme merge, │     │ (AC cards or │
│             │     │  deserialize)│     │  defaults,    │     │  native UI)  │
└─────────────┘     └──────────────┘     │  layout calc) │     └──────────────┘
                                         └───────────────┘
```

### 5.1 Parser Phase
- Load JSON from file/URL/string
- Validate against `deck.schema.json` using AJV
- Deserialize into typed Deck → Slide[] → Tile[] tree

### 5.2 Resolver Phase
- Merge deck `defaults` into each slide (slide overrides win)
- Apply `theme` colors/fonts to tiles without explicit styling
- Calculate layout positions for grid/freeform tiles
- Resolve `$ref` and external resource URIs

### 5.3 Renderer Phase
- Convert each slide's tile tree into Adaptive Card JSON
- Apply host-specific adaptations and fallbacks
- Output renderable AC cards or native UI elements

---

## 6. File Format

### 6.1 Extension

Deck files use the `.deck.json` extension:

```
my-presentation.deck.json
```

### 6.2 MIME Type

```
application/vnd.adaptive-slide.deck+json
```

### 6.3 Versioning

The `version` field in the deck uses semantic versioning. The schema itself is versioned via `$schema` URIs:

```json
{
  "$schema": "https://adaptive-slide.dev/schemas/deck.schema.json",
  "version": "1.0.0"
}
```

---

## 7. Extension Points

### 7.1 Custom Tile Types

Developers can register custom tile types by:

1. Authoring a JSON Schema for the tile that extends `TileBase`
2. Using the `Tile.` namespace prefix for the type discriminator
3. Providing a renderer function for the tile type
4. Optionally providing an Adaptive Cards fallback

```json
{
  "type": "Tile.Diagram",
  "diagramType": "mermaid",
  "source": "graph TD; A-->B; B-->C;"
}
```

### 7.2 Theme Extensions

Themes support `additionalProperties: true`, allowing host-specific theming:

```json
{
  "theme": {
    "primaryColor": "#0078d4",
    "custom": {
      "slideNumberFormat": "{{current}} / {{total}}",
      "headerFont": "Segoe UI Semibold"
    }
  }
}
```

---

## 8. Security Considerations

- **URI validation:** All `url` fields validate against `format: "uri"`
- **No script execution:** Tiles are declarative; no embedded JavaScript
- **Content sanitization:** Markdown in text tiles is sanitized before rendering
- **External resources:** Renderers should implement CSP-compatible resource loading
- **Schema strictness:** `additionalProperties: false` on tiles prevents injection

---

## 9. MCP App Plugin

Adaptive Slide includes an MCP App plugin that serves decks as interactive presentations inside MCP-compatible hosts (Claude Desktop, VS Code Copilot, etc.).

### 9.1 Plugin Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│  .deck.json │ ──▶ │  MCP Server  │ ──▶ │   MCP Host    │ ──▶ │ Viewer App   │
│   (input)   │     │ present-deck │     │ (Claude, etc) │     │ (iframe)     │
│             │     │ list-slides  │     │               │     │              │
└─────────────┘     └──────────────┘     └───────────────┘     └──────────────┘
```

### 9.2 Tools

| Tool | Description | Input |
|------|-------------|-------|
| `present-deck` | Render deck as interactive MCP App | `deck`: JSON string |
| `list-slides` | Return slide metadata | `deck`: JSON string |

### 9.3 Viewer

The viewer is a self-contained HTML page implementing the MCP App postMessage protocol. It receives deck JSON from the host and renders it with full navigation, keyboard shortcuts, theme support, and all 6 tile types.

### 9.4 Transport

The server uses StreamableHTTPServerTransport over Express, serving on `/mcp`. Compatible with any MCP client that supports HTTP transport.

---

## 10. Future Considerations

- **Animations:** Per-tile entry/exit animations
- **Data binding:** Template expressions for dynamic content
- **Collaboration:** Real-time co-editing protocol
- **Export:** PDF, PPTX, and HTML export targets
- **Accessibility:** WCAG 2.1 AA compliance requirements for renderers
