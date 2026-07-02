// Adaptive Cards 1.6 transformer.
//
// Converts an AdaptiveSlide (Adaptive Slide DSL) into a fully compliant
// AdaptiveCard 1.6 document. Reference:
//   http://adaptivecards.io/schemas/1.6.0/adaptive-card.json
//
// Every output passes JSON Schema validation against the official AC 1.6
// schema (see scripts/validate.js).

const TEXT_COLOR_MAP = {
  default: undefined,
  dark: "Dark",
  light: "Light",
  accent: "Accent",
  good: "Good",
  warning: "Warning",
  attention: "Attention",
};

const TEXT_SIZE_MAP = {
  small: "Small",
  default: undefined,
  medium: "Medium",
  large: "Large",
  extraLarge: "ExtraLarge",
};

const TEXT_WEIGHT_MAP = {
  lighter: "Lighter",
  default: undefined,
  bolder: "Bolder",
};

const SPACING_MAP = {
  none: "none",
  small: "small",
  default: "default",
  medium: "medium",
  large: "large",
  extraLarge: "extraLarge",
  padding: "padding",
};

const CONTAINER_STYLE_MAP = {
  default: "default",
  emphasis: "emphasis",
  good: "good",
  attention: "attention",
  warning: "warning",
  accent: "accent",
};

// AC 1.6 CodeBlock supported language enum.
const AC_CODE_LANGUAGES = new Set([
  "PlainText", "Bash", "C", "Cpp", "CSharp", "Css", "CMake", "Dart", "Dockerfile",
  "Elixir", "Fortran", "FSharp", "Go", "Graphql", "Haskell", "Html", "Java",
  "JavaScript", "Json", "Julia", "Kotlin", "Latex", "Lua", "Markdown", "MatLab",
  "Objc", "Perl", "Php", "PowerShell", "Python", "R", "Ruby", "Rust", "Sql",
  "Swift", "TypeScript", "VB", "Verilog", "Vhdl", "Xml", "Yaml",
]);

const LANGUAGE_ALIAS = {
  js: "JavaScript",
  ts: "TypeScript",
  "c++": "Cpp",
  cpp: "Cpp",
  cs: "CSharp",
  "c#": "CSharp",
  sh: "Bash",
  shell: "Bash",
  yml: "Yaml",
  yaml: "Yaml",
  py: "Python",
  rb: "Ruby",
  ps1: "PowerShell",
  pwsh: "PowerShell",
  md: "Markdown",
};

function normalizeLanguage(lang) {
  if (!lang) return "PlainText";
  const lower = lang.toLowerCase();
  if (LANGUAGE_ALIAS[lower]) return LANGUAGE_ALIAS[lower];
  // Title-case match against the enum
  for (const allowed of AC_CODE_LANGUAGES) {
    if (allowed.toLowerCase() === lower) return allowed;
  }
  return "PlainText";
}

function applyCommonProps(element, tile) {
  if (!element) return element;
  if (tile.id) element.id = tile.id;
  if (tile.spacing && SPACING_MAP[tile.spacing]) element.spacing = SPACING_MAP[tile.spacing];
  if (tile.separator) element.separator = true;
  if (tile.isVisible === false) element.isVisible = false;
  return element;
}

function tileTextToTextBlock(tile) {
  const block = {
    type: "TextBlock",
    text: tile.text ?? "",
    wrap: tile.wrap !== false,
  };
  const size = TEXT_SIZE_MAP[tile.size ?? "default"];
  const weight = TEXT_WEIGHT_MAP[tile.weight ?? "default"];
  const color = TEXT_COLOR_MAP[tile.color ?? "default"];
  if (size) block.size = size;
  if (weight) block.weight = weight;
  if (color) block.color = color;
  if (tile.horizontalAlignment) block.horizontalAlignment = tile.horizontalAlignment;
  if (tile.maxLines) block.maxLines = tile.maxLines;
  if (tile.fontType === "monospace") block.fontType = "Monospace";
  if (tile.style === "heading") {
    block.style = "heading";
  } else if (tile.style === "caption") {
    block.isSubtle = true;
  }
  return applyCommonProps(block, tile);
}

function tileImageToImage(tile) {
  const allowedSizes = new Set(["auto", "stretch", "small", "medium", "large"]);
  const sizeMap = {
    auto: "auto",
    stretch: "stretch",
    small: "small",
    medium: "medium",
    large: "large",
  };
  const img = { type: "Image", url: tile.url };
  if (tile.altText) img.altText = tile.altText;
  if (tile.size && allowedSizes.has(tile.size)) img.size = sizeMap[tile.size];
  if (tile.horizontalAlignment) img.horizontalAlignment = tile.horizontalAlignment;
  if (tile.backgroundColor) img.backgroundColor = tile.backgroundColor;
  if (!tile.caption) {
    return applyCommonProps(img, tile);
  }
  // Caption isn't native to Image in AC 1.6 — wrap in Container with TextBlock.
  return applyCommonProps(
    {
      type: "Container",
      items: [
        img,
        {
          type: "TextBlock",
          text: tile.caption,
          wrap: true,
          isSubtle: true,
          size: "Small",
        },
      ],
    },
    tile,
  );
}

function tileCodeToCodeBlock(tile) {
  const block = {
    type: "CodeBlock",
    codeSnippet: tile.code ?? "",
    language: normalizeLanguage(tile.language),
  };
  if (typeof tile.startLineNumber === "number") {
    block.startLineNumber = tile.startLineNumber;
  }
  return applyCommonProps(block, tile);
}

function tileChartToFactSet(tile) {
  const dataset = tile.data?.datasets?.[0];
  if (!dataset || !Array.isArray(tile.data?.labels)) return null;
  const facts = tile.data.labels.map((label, i) => ({
    title: String(label),
    value: String(dataset.values?.[i] ?? ""),
  }));
  const items = [];
  if (tile.title) {
    items.push({
      type: "TextBlock",
      text: tile.title,
      weight: "Bolder",
      size: "Medium",
      wrap: true,
    });
  }
  items.push({ type: "FactSet", facts });
  return applyCommonProps({ type: "Container", items }, tile);
}

function tileMediaToMedia(tile) {
  const media = { type: "Media" };
  if (Array.isArray(tile.sources)) {
    media.sources = tile.sources.map((s) => {
      const out = { url: s.url };
      if (s.mimeType) out.mimeType = s.mimeType;
      return out;
    });
  } else {
    media.sources = [];
  }
  if (tile.poster) media.poster = tile.poster;
  if (tile.altText) media.altText = tile.altText;
  return applyCommonProps(media, tile);
}

function tileContainerToContainer(tile) {
  const items = (tile.items || [])
    .map((child) => tileToElement(child))
    .filter(Boolean);

  if (tile.layout === "row") {
    const cs = {
      type: "ColumnSet",
      columns: items.map((item) => ({
        type: "Column",
        width: "stretch",
        items: [item],
      })),
    };
    if (tile.style && CONTAINER_STYLE_MAP[tile.style]) cs.style = CONTAINER_STYLE_MAP[tile.style];
    if (tile.bleed) cs.bleed = true;
    if (tile.minHeight) cs.minHeight = tile.minHeight;
    return applyCommonProps(cs, tile);
  }

  const c = { type: "Container", items };
  if (tile.style && CONTAINER_STYLE_MAP[tile.style]) c.style = CONTAINER_STYLE_MAP[tile.style];
  if (tile.bleed) c.bleed = true;
  if (tile.minHeight) c.minHeight = tile.minHeight;
  if (tile.verticalContentAlignment) c.verticalContentAlignment = tile.verticalContentAlignment;
  if (tile.backgroundImage?.url) {
    c.backgroundImage = { url: tile.backgroundImage.url };
    if (tile.backgroundImage.fillMode) c.backgroundImage.fillMode = tile.backgroundImage.fillMode;
  }
  return applyCommonProps(c, tile);
}

const INPUT_TEXT_STYLE_MAP = {
  text: "Text",
  tel: "Tel",
  url: "Url",
  email: "Email",
  password: "Password",
};

const CHOICE_SET_STYLE_MAP = {
  compact: "compact",
  expanded: "expanded",
  filtered: "filtered",
};

function applyInputCommon(element, tile) {
  if (tile.label) element.label = tile.label;
  if (tile.isRequired) element.isRequired = true;
  if (tile.errorMessage) element.errorMessage = tile.errorMessage;
  return element;
}

function tileInputTextToInput(tile) {
  const input = { type: "Input.Text" };
  if (tile.placeholder) input.placeholder = tile.placeholder;
  if (tile.value !== undefined) input.value = String(tile.value);
  if (tile.isMultiline) input.isMultiline = true;
  if (typeof tile.maxLength === "number") input.maxLength = tile.maxLength;
  if (tile.style && INPUT_TEXT_STYLE_MAP[tile.style]) input.style = INPUT_TEXT_STYLE_MAP[tile.style];
  if (tile.regex) input.regex = tile.regex;
  applyInputCommon(input, tile);
  return applyCommonProps(input, tile);
}

function tileInputNumberToInput(tile) {
  const input = { type: "Input.Number" };
  if (tile.placeholder) input.placeholder = tile.placeholder;
  if (typeof tile.value === "number") input.value = tile.value;
  if (typeof tile.min === "number") input.min = tile.min;
  if (typeof tile.max === "number") input.max = tile.max;
  applyInputCommon(input, tile);
  return applyCommonProps(input, tile);
}

function tileInputChoiceSetToInput(tile) {
  const input = {
    type: "Input.ChoiceSet",
    choices: (tile.choices || []).map((c) => ({ title: c.title, value: c.value })),
  };
  if (tile.placeholder) input.placeholder = tile.placeholder;
  if (tile.value !== undefined) input.value = String(tile.value);
  if (tile.isMultiSelect) input.isMultiSelect = true;
  if (tile.style && CHOICE_SET_STYLE_MAP[tile.style]) input.style = CHOICE_SET_STYLE_MAP[tile.style];
  if (tile.wrap === true) input.wrap = true;
  applyInputCommon(input, tile);
  return applyCommonProps(input, tile);
}

function tileToElement(tile) {
  if (!tile) return null;
  switch (tile.type) {
    case "Tile.Text":
      return tileTextToTextBlock(tile);
    case "Tile.Image":
      return tileImageToImage(tile);
    case "Tile.Code":
      return tileCodeToCodeBlock(tile);
    case "Tile.Chart":
      return tileChartToFactSet(tile);
    case "Tile.Media":
      return tileMediaToMedia(tile);
    case "Tile.Container":
      return tileContainerToContainer(tile);
    case "Tile.Input.Text":
      return tileInputTextToInput(tile);
    case "Tile.Input.Number":
      return tileInputNumberToInput(tile);
    case "Tile.Input.ChoiceSet":
      return tileInputChoiceSetToInput(tile);
    default:
      return null;
  }
}

function actionToAdaptiveCardAction(action) {
  if (!action) return null;
  if (action.type === "Action.OpenUrl" && action.url) {
    return { type: "Action.OpenUrl", title: action.title, url: action.url };
  }
  if (action.type === "Action.Submit") {
    const out = { type: "Action.Submit", title: action.title };
    if (action.data !== undefined) out.data = action.data;
    return out;
  }
  // Action.GoToSlide / Action.NextSlide / Action.PrevSlide are Adaptive Slide
  // navigation actions and have no AC 1.6 equivalent. Skip them.
  return null;
}

// Convert a grid-layout slide body into an AC 1.6 element list.
// Tiles are grouped by gridPosition.row, each row becomes a ColumnSet with
// proportional column widths driven by columnSpan.
function slideBodyToElements(slide) {
  const tiles = (slide.body || []).filter((t) => t && t.isVisible !== false);
  const layout = slide.layout;
  if (!layout || layout.mode !== "grid" || !layout.columns) {
    return tiles.map(tileToElement).filter(Boolean);
  }
  const totalColumns = layout.columns;
  const rows = new Map();
  const orphans = [];
  for (const tile of tiles) {
    const row = tile.gridPosition?.row;
    if (row == null) {
      orphans.push(tile);
      continue;
    }
    const list = rows.get(row) ?? [];
    list.push({
      tile,
      column: tile.gridPosition.column ?? 1,
      span: Math.max(1, tile.gridPosition.columnSpan ?? 1),
    });
    rows.set(row, list);
  }
  const elements = orphans.map(tileToElement).filter(Boolean);
  const sortedRowKeys = Array.from(rows.keys()).sort((a, b) => a - b);
  for (const rowKey of sortedRowKeys) {
    const cells = Array.from(rows.get(rowKey)).sort((a, b) => a.column - b.column);

    // If the row is a single full-width tile, render it as a top-level element.
    if (cells.length === 1 && cells[0].span >= totalColumns) {
      const e = tileToElement(cells[0].tile);
      if (e) elements.push(e);
      continue;
    }

    const columns = [];
    let cursor = 1;
    for (const cell of cells) {
      while (cursor < cell.column) {
        columns.push({ type: "Column", width: "1", items: [] });
        cursor += 1;
      }
      const e = tileToElement(cell.tile);
      if (!e) continue;
      columns.push({ type: "Column", width: String(cell.span), items: [e] });
      cursor += cell.span;
    }
    elements.push({ type: "ColumnSet", columns });
  }
  return elements;
}

/**
 * Convert a single AdaptiveSlide into a valid AdaptiveCard 1.6 document.
 *
 * @param {object} slide  AdaptiveSlide object.
 * @param {object} [deck] Optional parent deck (used for language metadata).
 * @returns {object} A JSON Schema-compliant AdaptiveCard 1.6 document.
 */
export function slideToAdaptiveCard(slide, deck) {
  if (!slide) {
    throw new TypeError("slideToAdaptiveCard requires a slide");
  }
  const card = {
    type: "AdaptiveCard",
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.6",
    body: slideBodyToElements(slide),
  };
  if (deck?.metadata?.language) card.lang = deck.metadata.language;
  if (slide.background?.image?.url) {
    const backgroundImage = { url: slide.background.image.url };
    if (slide.background.image.fillMode) {
      backgroundImage.fillMode = slide.background.image.fillMode;
    }
    card.backgroundImage = backgroundImage;
  }
  const actions = (slide.actions || []).map(actionToAdaptiveCardAction).filter(Boolean);
  if (actions.length) card.actions = actions;
  return card;
}

/**
 * Convert every slide in an AdaptiveDeck into AC 1.6 cards.
 *
 * @param {object} deck AdaptiveDeck.
 * @returns {object[]} Array of AC 1.6 cards (one per slide).
 */
export function deckToAdaptiveCards(deck) {
  if (!deck || !Array.isArray(deck.slides)) return [];
  return deck.slides.map((slide) => slideToAdaptiveCard(slide, deck));
}
