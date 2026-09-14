# Schema Reference

Complete reference for all Adaptive Slide JSON Schemas.

---

## Deck — `AdaptiveDeck`

**Schema:** [`schemas/deck.schema.json`](../../schemas/deck.schema.json)  
**Type discriminator:** `"AdaptiveDeck"`

### Properties

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `$schema` | string | ✅ | — | Schema URI |
| `type` | `"AdaptiveDeck"` | ✅ | — | Type discriminator |
| `version` | string (semver) | ✅ | — | Deck format version |
| `metadata` | [DeckMetadata](#deckmetadata) | — | — | Presentation metadata |
| `theme` | [Theme](#theme) | — | — | Visual theme |
| `slides` | [AdaptiveSlide](#slide--adaptiveslide)[] | ✅ | — | Slide array (≥1) |
| `defaults` | [SlideDefaults](#slidedefaults) | — | — | Default slide settings |

### DeckMetadata

| Property | Type | Description |
|----------|------|-------------|
| `title` | string | Presentation title |
| `description` | string | Summary |
| `author` | string | Author name |
| `created` | date-time | Creation timestamp |
| `modified` | date-time | Last modified timestamp |
| `tags` | string[] | Categorization tags |
| `language` | string | BCP 47 language tag |

### Theme

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Theme name |
| `primaryColor` | hex color | Primary brand color |
| `accentColor` | hex color | Accent/highlight color |
| `backgroundColor` | hex color | Default background |
| `fontFamily` | string | Default font family |
| `darkMode` | boolean | Enable dark mode (default: `false`) |

### SlideDefaults

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `layout` | `"stack"` \| `"grid"` \| `"freeform"` | `"stack"` | Default layout mode |
| `transition` | enum | `"none"` | Default slide transition |
| `padding` | `"none"` \| `"small"` \| `"default"` \| `"large"` | `"default"` | Default padding |

---

## Slide — `AdaptiveSlide`

**Schema:** [`schemas/slide.schema.json`](../../schemas/slide.schema.json)  
**Type discriminator:** `"AdaptiveSlide"`

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `"AdaptiveSlide"` | ✅ | Type discriminator |
| `id` | string | — | Unique slide ID |
| `title` | string | — | Slide title |
| `notes` | string | — | Speaker notes |
| `layout` | [LayoutConfig](#layoutconfig) | — | Layout configuration |
| `background` | [Background](#background) | — | Background settings |
| `transition` | enum | — | Entry transition |
| `body` | [AdaptiveTile](#tiles)[] | ✅ | Tile array (the bucket) |
| `actions` | [Action](#actions)[] | — | Slide-level actions |

### LayoutConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `mode` | `"stack"` \| `"grid"` \| `"freeform"` | `"stack"` | Layout mode |
| `columns` | integer (1–12) | — | Grid column count |
| `gap` | enum | `"default"` | Gap between tiles |
| `horizontalAlignment` | enum | `"stretch"` | Horizontal alignment |
| `verticalAlignment` | enum | `"top"` | Vertical alignment |

### Background

Supports three exclusive options: `color`, `image`, or `gradient`.

### Actions

| Type | Description |
|------|-------------|
| `Action.OpenUrl` | Open a URL |
| `Action.Submit` | Submit data |
| `Action.GoToSlide` | Navigate to slide by ID |
| `Action.NextSlide` | Go to next slide |
| `Action.PrevSlide` | Go to previous slide |

---

## Tiles

**Base schema:** [`schemas/tile.schema.json`](../../schemas/tile.schema.json)

All tiles share these base properties:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | string | — | Tile type discriminator (required) |
| `id` | string | — | Unique tile ID |
| `isVisible` | boolean | `true` | Visibility |
| `spacing` | enum | `"default"` | Spacing above |
| `separator` | boolean | `false` | Show separator line |
| `gridPosition` | object | — | Grid layout position |
| `freeformPosition` | object | — | Freeform layout position |

---

### `Tile.Text`

**Schema:** [`schemas/tiles/text-tile.schema.json`](../../schemas/tiles/text-tile.schema.json)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `text` | string | — | Text content (markdown subset) ✅ |
| `style` | enum | `"body"` | heading, subheading, body, caption, quote |
| `size` | enum | `"default"` | Text size |
| `weight` | enum | `"default"` | Font weight |
| `color` | enum | `"default"` | Semantic color |
| `horizontalAlignment` | enum | `"left"` | Text alignment |
| `wrap` | boolean | `true` | Enable text wrapping |
| `maxLines` | integer | — | Maximum visible lines |
| `fontType` | enum | `"default"` | default or monospace |

---

### `Tile.Image`

**Schema:** [`schemas/tiles/image-tile.schema.json`](../../schemas/tiles/image-tile.schema.json)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `url` | URI | — | Image URL ✅ |
| `altText` | string | — | Accessible alt text |
| `size` | enum | `"auto"` | Image sizing |
| `horizontalAlignment` | enum | `"center"` | Alignment |
| `backgroundColor` | string | — | Background behind image |
| `aspectRatio` | string | — | Ratio constraint (e.g. `"16:9"`) |
| `caption` | string | — | Caption text |

---

### `Tile.Code`

**Schema:** [`schemas/tiles/code-tile.schema.json`](../../schemas/tiles/code-tile.schema.json)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `code` | string | — | Source code ✅ |
| `language` | string | — | Language for highlighting |
| `showLineNumbers` | boolean | `true` | Show line numbers |
| `startLineNumber` | integer | `1` | First line number |
| `highlightLines` | integer[] | — | Lines to emphasize |
| `maxHeight` | string | — | Max height (CSS) |
| `title` | string | — | Filename/title |
| `theme` | enum | `"auto"` | light, dark, auto |

---

### `Tile.Chart`

**Schema:** [`schemas/tiles/chart-tile.schema.json`](../../schemas/tiles/chart-tile.schema.json)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `chartType` | enum | — | bar, line, pie, donut, area, scatter ✅ |
| `title` | string | — | Chart title |
| `data` | [ChartData](#chartdata) | — | Chart dataset ✅ |
| `showLegend` | boolean | `true` | Show legend |
| `showGrid` | boolean | `true` | Show grid lines |
| `colors` | string[] | — | Custom color palette |
| `aspectRatio` | string | `"16:9"` | Aspect ratio |

#### ChartData

| Property | Type | Description |
|----------|------|-------------|
| `labels` | string[] | Category labels |
| `datasets` | Dataset[] | Data series (≥1) |

Each dataset: `{ label, values: number[], color }`

---

### `Tile.Media`

**Schema:** [`schemas/tiles/media-tile.schema.json`](../../schemas/tiles/media-tile.schema.json)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `sources` | MediaSource[] | — | Media sources (≥1) ✅ |
| `poster` | URI | — | Poster/thumbnail |
| `altText` | string | — | Accessible text |
| `autoplay` | boolean | `false` | Auto-play |
| `loop` | boolean | `false` | Loop playback |
| `muted` | boolean | `false` | Muted by default |
| `aspectRatio` | string | `"16:9"` | Aspect ratio |

---

### `Tile.Container`

**Schema:** [`schemas/tiles/container-tile.schema.json`](../../schemas/tiles/container-tile.schema.json)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `items` | AdaptiveTile[] | — | Nested tiles ✅ |
| `layout` | enum | `"stack"` | stack, row, wrap |
| `style` | enum | `"default"` | Container style |
| `bleed` | boolean | `false` | Bleed to parent edge |
| `minHeight` | string | — | Min height (CSS) |
| `verticalContentAlignment` | enum | `"top"` | Content alignment |
| `backgroundImage` | object | — | Background image |
