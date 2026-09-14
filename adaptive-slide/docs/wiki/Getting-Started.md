# Getting Started

Build your first Adaptive Slide deck in 5 minutes.

## Prerequisites

- Node.js 18+
- npm or yarn

## Setup

```bash
git clone <repo-url>
cd adaptive-slide
npm install
```

## Your First Deck

Create a file called `my-first.deck.json`:

```json
{
  "$schema": "./schemas/deck.schema.json",
  "type": "AdaptiveDeck",
  "version": "1.0.0",
  "metadata": {
    "title": "My First Deck",
    "author": "You"
  },
  "slides": [
    {
      "type": "AdaptiveSlide",
      "id": "title-slide",
      "title": "Welcome",
      "body": [
        {
          "type": "Tile.Text",
          "text": "Hello, Adaptive Slide!",
          "style": "heading",
          "size": "extraLarge",
          "horizontalAlignment": "center"
        },
        {
          "type": "Tile.Text",
          "text": "A schema-driven presentation format",
          "style": "subheading",
          "color": "accent",
          "horizontalAlignment": "center"
        }
      ]
    },
    {
      "type": "AdaptiveSlide",
      "id": "content-slide",
      "title": "Key Concepts",
      "body": [
        {
          "type": "Tile.Text",
          "text": "The Building Blocks",
          "style": "heading"
        },
        {
          "type": "Tile.Text",
          "text": "- **Deck** — the presentation container\n- **Slide** — a single page\n- **Tile** — an atomic content block",
          "style": "body"
        },
        {
          "type": "Tile.Code",
          "language": "json",
          "title": "tile.schema.json",
          "code": "{ \"type\": \"Tile.Text\", \"text\": \"Hello!\" }"
        }
      ]
    }
  ]
}
```

## Validate

```bash
npm run validate
```

## Concepts

### Deck
The root object. Contains metadata (title, author), a theme, and an ordered array of slides.

### Slide
A single page in the presentation. Each slide is an Adaptive Card bucket — its `body` array is where you place tiles.

### Tiles
The atomic content units. Six built-in types:

| Tile | Use for |
|------|---------|
| `Tile.Text` | Headings, body text, quotes |
| `Tile.Image` | Photos, diagrams, logos |
| `Tile.Code` | Code snippets with syntax highlighting |
| `Tile.Chart` | Bar, line, pie charts |
| `Tile.Media` | Video and audio |
| `Tile.Container` | Group and nest other tiles |

### Layouts

Each slide supports three layout modes:

- **stack** (default) — tiles flow vertically
- **grid** — CSS-grid-like with `gridPosition` on each tile
- **freeform** — absolute positioning with `freeformPosition`

```json
{
  "type": "AdaptiveSlide",
  "layout": { "mode": "grid", "columns": 2 },
  "body": [
    { "type": "Tile.Text", "text": "Left column", "gridPosition": { "column": 1, "row": 1 } },
    { "type": "Tile.Image", "url": "...", "gridPosition": { "column": 2, "row": 1 } }
  ]
}
```

## Next Steps

- Read the [Architecture](Architecture.md) for system design details
- Browse the [Schema Reference](Schema-Reference.md) for all properties
- Study the [Technical Specification](../spec/technical-specification.md) for the full spec
- Check out [`examples/hello-world.deck.json`](../../examples/hello-world.deck.json)
