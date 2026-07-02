// Industry-tailored AdaptiveDeck templates.
// Each deck's slide[0] is a dashboard-style "showcase" slide rendered in the
// template card preview. Subsequent slides form a usable presentation flow.

const themes = {
  training: {
    name: "Training Indigo",
    primaryColor: "#6366f1",
    accentColor: "#a78bfa",
    backgroundColor: "#1e1b4b",
    fontFamily: "Segoe UI, sans-serif",
    darkMode: true,
  },
  healthcare: {
    name: "Healthcare Teal",
    primaryColor: "#10b981",
    accentColor: "#5eead4",
    backgroundColor: "#064e3b",
    fontFamily: "Segoe UI, sans-serif",
    darkMode: true,
  },
  financial: {
    name: "Financial Navy",
    primaryColor: "#3b82f6",
    accentColor: "#fbbf24",
    backgroundColor: "#0c1f4d",
    fontFamily: "Segoe UI, sans-serif",
    darkMode: true,
  },
  retail: {
    name: "Retail Coral",
    primaryColor: "#fb7185",
    accentColor: "#fbbf24",
    backgroundColor: "#5c1a3b",
    fontFamily: "Segoe UI, sans-serif",
    darkMode: true,
  },
  manufacturing: {
    name: "Manufacturing Steel",
    primaryColor: "#f97316",
    accentColor: "#facc15",
    backgroundColor: "#1c2128",
    fontFamily: "Segoe UI, sans-serif",
    darkMode: true,
  },
  publicSector: {
    name: "Public Sector Forest",
    primaryColor: "#16a34a",
    accentColor: "#fbbf24",
    backgroundColor: "#14532d",
    fontFamily: "Segoe UI, sans-serif",
    darkMode: true,
  },
  education: {
    name: "Education Purple",
    primaryColor: "#a855f7",
    accentColor: "#fbbf24",
    backgroundColor: "#3b1466",
    fontFamily: "Segoe UI, sans-serif",
    darkMode: true,
  },
  sales: {
    name: "Sales Emerald",
    primaryColor: "#10b981",
    accentColor: "#06b6d4",
    backgroundColor: "#064e3b",
    fontFamily: "Segoe UI, sans-serif",
    darkMode: true,
  },
  support: {
    name: "Support Crimson",
    primaryColor: "#ef4444",
    accentColor: "#fb7185",
    backgroundColor: "#4c0519",
    fontFamily: "Segoe UI, sans-serif",
    darkMode: true,
  },
  generated: {
    name: "Generated Cyan",
    primaryColor: "#06b6d4",
    accentColor: "#a78bfa",
    backgroundColor: "#082f49",
    fontFamily: "Segoe UI, sans-serif",
    darkMode: true,
  },
  acPattern: {
    primaryColor: "#2563eb",
    accentColor: "#60a5fa",
    backgroundColor: "#0a1834",
    fontFamily: "Segoe UI, sans-serif",
    darkMode: true,
  },
  trainingCourse: {
    name: "Training Course Emerald",
    primaryColor: "#10b981",
    accentColor: "#34d399",
    backgroundColor: "#022c22",
    fontFamily: "Segoe UI, sans-serif",
    darkMode: true,
  },
};

const defaultDeckSettings = {
  layout: "stack",
  transition: "fade",
  padding: "default",
};

function deck({ title, description, tags, slides, theme }) {
  return {
    $schema: "./schemas/deck.schema.json",
    type: "AdaptiveDeck",
    version: "1.0.0",
    metadata: {
      title,
      description,
      author: "Adaptive Slide Templates",
      tags,
      language: "en-US",
    },
    theme,
    defaults: defaultDeckSettings,
    slides,
  };
}

function gradientBackground(theme, angle = 135) {
  return {
    gradient: {
      type: "linear",
      colors: [theme.backgroundColor, theme.primaryColor],
      angle,
    },
  };
}

// KPI/stat tile: large value over small label.
// The renderer detects this shape (Container with two Text items where the
// first has style "heading" and the second "caption") and renders as a stat block.
function statTile({ value, label, style = "accent", gridPosition }) {
  return {
    type: "Tile.Container",
    style,
    gridPosition,
    items: [
      {
        type: "Tile.Text",
        text: value,
        style: "heading",
        size: "extraLarge",
        weight: "bolder",
        color: "light",
        horizontalAlignment: "center",
      },
      {
        type: "Tile.Text",
        text: label,
        style: "caption",
        color: "light",
        horizontalAlignment: "center",
      },
    ],
  };
}

// Status tile: small subheading title + body status text + optional caption.
function statusTile({ label, status, detail, style = "emphasis", gridPosition }) {
  const items = [
    {
      type: "Tile.Text",
      text: label,
      style: "subheading",
      weight: "bolder",
      color: "accent",
    },
    {
      type: "Tile.Text",
      text: status,
      style: "body",
      color: "light",
    },
  ];
  if (detail) {
    items.push({
      type: "Tile.Text",
      text: detail,
      style: "caption",
      color: "light",
    });
  }
  return { type: "Tile.Container", style, gridPosition, items };
}

// List tile: subheading title + bullet list body.
function listTile({ title, items, style = "default", gridPosition }) {
  return {
    type: "Tile.Container",
    style,
    gridPosition,
    items: [
      {
        type: "Tile.Text",
        text: title,
        style: "subheading",
        weight: "bolder",
        color: "accent",
      },
      {
        type: "Tile.Text",
        text: items.map((item) => `- ${item}`).join("\n"),
        style: "body",
        color: "light",
      },
    ],
  };
}

function chartTile({ title, chartType = "bar", labels, values, color = "#a78bfa", gridPosition }) {
  return {
    type: "Tile.Chart",
    chartType,
    title,
    gridPosition,
    data: {
      labels,
      datasets: [{ label: title, values, color }],
    },
  };
}

function headerTile({ text, gridPosition }) {
  return {
    type: "Tile.Text",
    text,
    style: "heading",
    size: "large",
    weight: "bolder",
    color: "light",
    gridPosition,
  };
}

function subheaderTile({ text, gridPosition }) {
  return {
    type: "Tile.Text",
    text,
    style: "subheading",
    color: "accent",
    gridPosition,
  };
}

// Dashboard slide with grid layout.
// Title row, optional subtitle row, then composed body of stat/chart/list tiles.
function dashboardSlide({ id, title, subtitle, columns = 4, body, theme }) {
  return {
    type: "AdaptiveSlide",
    id,
    title,
    background: gradientBackground(theme),
    layout: { mode: "grid", columns, gap: "small" },
    body: [
      headerTile({ text: title, gridPosition: { column: 1, row: 1, columnSpan: columns } }),
      ...(subtitle
        ? [subheaderTile({ text: subtitle, gridPosition: { column: 1, row: 2, columnSpan: columns } })]
        : []),
      ...body,
    ],
  };
}

function titleSlide(id, title, subtitle, theme) {
  return {
    type: "AdaptiveSlide",
    id,
    title,
    background: gradientBackground(theme),
    body: [
      {
        type: "Tile.Text",
        text: title,
        style: "heading",
        size: "extraLarge",
        weight: "bolder",
        color: "light",
        horizontalAlignment: "center",
      },
      {
        type: "Tile.Text",
        text: subtitle,
        style: "subheading",
        color: "light",
        horizontalAlignment: "center",
      },
    ],
  };
}

function agendaSlide(id, title, items) {
  return {
    type: "AdaptiveSlide",
    id,
    title,
    layout: { mode: "grid", columns: 2, gap: "default" },
    body: [
      {
        type: "Tile.Text",
        text: title,
        style: "heading",
        size: "large",
        gridPosition: { column: 1, row: 1, columnSpan: 2 },
      },
      ...items.map((item, index) => ({
        type: "Tile.Container",
        style: index % 2 === 0 ? "accent" : "emphasis",
        gridPosition: { column: (index % 2) + 1, row: Math.floor(index / 2) + 2 },
        items: [
          {
            type: "Tile.Text",
            text: item.label,
            style: "subheading",
            weight: "bolder",
            color: "accent",
          },
          { type: "Tile.Text", text: item.detail, style: "body" },
        ],
      })),
    ],
  };
}

function checklistSlide(id, title, items) {
  return {
    type: "AdaptiveSlide",
    id,
    title,
    body: [
      { type: "Tile.Text", text: title, style: "heading", size: "large" },
      {
        type: "Tile.Text",
        text: items.map((item) => `- ${item}`).join("\n"),
        style: "body",
      },
    ],
  };
}

function closeSlide(id, title, subtitle, theme) {
  return {
    type: "AdaptiveSlide",
    id,
    title,
    background: { color: theme.primaryColor },
    body: [
      {
        type: "Tile.Text",
        text: title,
        style: "heading",
        size: "extraLarge",
        weight: "bolder",
        color: "light",
        horizontalAlignment: "center",
      },
      {
        type: "Tile.Text",
        text: subtitle,
        style: "body",
        color: "light",
        horizontalAlignment: "center",
      },
    ],
  };
}

// =============================================================================
// Adaptive Card layout-pattern helpers
//
// These factories mirror the eight "Card layouts" guidance from the official
// Adaptive Cards design best practices page (Hero, Thumbnail, List, Digest,
// Video/Media, Form, Quick input, Expandable). They produce visually faithful
// flipcards within the current renderer's capability set:
//
//   - Multi-column arrangements use slide-level grid (Container.layout="row"
//     is intentionally avoided because the website renderer ignores it).
//   - Mock buttons/inputs use container styles only (no className hooks exist
//     on the DSL).
//   - Tile.Media references a stable public sample so all three runtime
//     renderers (templates.js, viewer.html, src/transformer.ts) play cleanly.
// =============================================================================

const SAMPLE_VIDEO_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const SAMPLE_VIDEO_POSTER = "https://darbotlm.github.io/adaptive-slide/img/social-card.svg";
const SAMPLE_HERO_IMAGE = "https://darbotlm.github.io/adaptive-slide/img/social-card.svg";
const SAMPLE_THUMB_IMAGE = "https://darbotlm.github.io/adaptive-slide/img/logo.svg";
const SAMPLE_AVATAR = "https://darbotlm.github.io/adaptive-slide/img/favicon.svg";

function buttonMock({ label, style = "accent", gridPosition }) {
  return {
    type: "Tile.Container",
    style,
    gridPosition,
    items: [
      {
        type: "Tile.Text",
        text: label,
        style: "subheading",
        weight: "bolder",
        color: "light",
        horizontalAlignment: "center",
      },
    ],
  };
}

function inputMock({ label, placeholder, gridPosition }) {
  return {
    type: "Tile.Container",
    style: "emphasis",
    gridPosition,
    items: [
      {
        type: "Tile.Text",
        text: label,
        style: "caption",
        color: "accent",
        weight: "bolder",
      },
      {
        type: "Tile.Text",
        text: placeholder,
        style: "body",
        color: "light",
      },
    ],
  };
}

function listRowMock({ avatarUrl, title, subtitle, meta, row, columns = 4 }) {
  return [
    {
      type: "Tile.Image",
      url: avatarUrl,
      altText: title,
      gridPosition: { column: 1, row, columnSpan: 1 },
    },
    {
      type: "Tile.Container",
      style: "default",
      gridPosition: { column: 2, row, columnSpan: columns - 2 },
      items: [
        { type: "Tile.Text", text: title, style: "subheading", weight: "bolder", color: "accent" },
        { type: "Tile.Text", text: subtitle, style: "caption", color: "light" },
      ],
    },
    {
      type: "Tile.Text",
      text: meta,
      style: "caption",
      color: "light",
      horizontalAlignment: "right",
      gridPosition: { column: columns, row, columnSpan: 1 },
    },
  ];
}

function digestArticle({ imageUrl, title, summary, gridPosition }) {
  return {
    type: "Tile.Container",
    style: "default",
    gridPosition,
    items: [
      { type: "Tile.Image", url: imageUrl, altText: title },
      { type: "Tile.Text", text: title, style: "subheading", weight: "bolder", color: "accent" },
      { type: "Tile.Text", text: summary, style: "caption", color: "light" },
    ],
  };
}

function mediaTile({ url, mimeType = "video/mp4", poster, gridPosition }) {
  const tile = {
    type: "Tile.Media",
    sources: [{ url, mimeType }],
    aspectRatio: "16:9",
    gridPosition,
  };
  if (poster) tile.poster = poster;
  return tile;
}

function whenToUseSlide({ id, title, when, dont, theme }) {
  return {
    type: "AdaptiveSlide",
    id,
    title,
    background: gradientBackground(theme),
    layout: { mode: "grid", columns: 2, gap: "default" },
    body: [
      headerTile({ text: title, gridPosition: { column: 1, row: 1, columnSpan: 2 } }),
      {
        type: "Tile.Container",
        style: "good",
        gridPosition: { column: 1, row: 2 },
        items: [
          { type: "Tile.Text", text: "When to use", style: "subheading", weight: "bolder", color: "accent" },
          {
            type: "Tile.Text",
            text: when.map((item) => `- ${item}`).join("\n"),
            style: "body",
            color: "light",
          },
        ],
      },
      {
        type: "Tile.Container",
        style: "attention",
        gridPosition: { column: 2, row: 2 },
        items: [
          { type: "Tile.Text", text: "Avoid when", style: "subheading", weight: "bolder", color: "accent" },
          {
            type: "Tile.Text",
            text: dont.map((item) => `- ${item}`).join("\n"),
            style: "body",
            color: "light",
          },
        ],
      },
    ],
  };
}

function anatomySlide({ id, title, parts, theme }) {
  return {
    type: "AdaptiveSlide",
    id,
    title,
    background: gradientBackground(theme),
    layout: { mode: "grid", columns: 2, gap: "default" },
    body: [
      headerTile({ text: "Anatomy", gridPosition: { column: 1, row: 1, columnSpan: 2 } }),
      ...parts.map((part, index) => ({
        type: "Tile.Container",
        style: index % 2 === 0 ? "accent" : "emphasis",
        gridPosition: { column: (index % 2) + 1, row: Math.floor(index / 2) + 2 },
        items: [
          { type: "Tile.Text", text: part.label, style: "subheading", weight: "bolder", color: "accent" },
          { type: "Tile.Text", text: part.detail, style: "caption", color: "light" },
        ],
      })),
    ],
  };
}

// -----------------------------------------------------------------------------
// Layout-specific showcase slides
// -----------------------------------------------------------------------------

function heroLayoutSlide(theme) {
  return dashboardSlide({
    id: "hero-showcase",
    title: "Hero layout",
    subtitle: "An immersive image carries the narrative; one primary action sits below.",
    columns: 4,
    body: [
      {
        type: "Tile.Image",
        url: SAMPLE_HERO_IMAGE,
        altText: "Featured story image",
        gridPosition: { column: 1, row: 3, columnSpan: 4, rowSpan: 2 },
      },
      {
        type: "Tile.Text",
        text: "Adaptive Cards 1.6 — design system release",
        style: "heading",
        size: "large",
        color: "light",
        weight: "bolder",
        gridPosition: { column: 1, row: 5, columnSpan: 4 },
      },
      {
        type: "Tile.Text",
        text: "A refined token palette, dark-mode parity, and motion guidance for embedded experiences across Teams, Outlook, and Power Apps.",
        style: "body",
        color: "light",
        gridPosition: { column: 1, row: 6, columnSpan: 4 },
      },
      buttonMock({ label: "Read article", style: "accent", gridPosition: { column: 1, row: 7, columnSpan: 2 } }),
      buttonMock({ label: "Share", style: "default", gridPosition: { column: 3, row: 7, columnSpan: 2 } }),
    ],
    theme,
  });
}

function thumbnailLayoutSlide(theme) {
  return dashboardSlide({
    id: "thumbnail-showcase",
    title: "Thumbnail layout",
    subtitle: "Compact image plus actionable message — perfect for dense feeds.",
    columns: 4,
    body: [
      {
        type: "Tile.Image",
        url: SAMPLE_THUMB_IMAGE,
        altText: "Thumbnail",
        gridPosition: { column: 1, row: 3, columnSpan: 1, rowSpan: 3 },
      },
      {
        type: "Tile.Text",
        text: "Build status: passing",
        style: "subheading",
        weight: "bolder",
        color: "accent",
        gridPosition: { column: 2, row: 3, columnSpan: 3 },
      },
      {
        type: "Tile.Text",
        text: "All 247 tests passed on main. Ready to promote to release/2025.11.",
        style: "body",
        color: "light",
        gridPosition: { column: 2, row: 4, columnSpan: 3 },
      },
      buttonMock({ label: "Open run", style: "accent", gridPosition: { column: 2, row: 5, columnSpan: 3 } }),
    ],
    theme,
  });
}

function listLayoutSlide(theme) {
  const rows = [
    listRowMock({
      avatarUrl: SAMPLE_AVATAR,
      title: "Jordan Stevens",
      subtitle: "Adaptive Cards renderer regression",
      meta: "Active",
      row: 3,
    }),
    listRowMock({
      avatarUrl: SAMPLE_AVATAR,
      title: "Priya Raman",
      subtitle: "Schema 1.6 validation gap",
      meta: "Triage",
      row: 4,
    }),
    listRowMock({
      avatarUrl: SAMPLE_AVATAR,
      title: "Marco Lopez",
      subtitle: "Power Apps host parity audit",
      meta: "Backlog",
      row: 5,
    }),
    listRowMock({
      avatarUrl: SAMPLE_AVATAR,
      title: "Aiko Tanaka",
      subtitle: "Localization tokens for date/time",
      meta: "Ready",
      row: 6,
    }),
  ];
  return dashboardSlide({
    id: "list-showcase",
    title: "List layout",
    subtitle: "Pick one item from a scannable list — keep each row terse.",
    columns: 4,
    body: rows.flat(),
    theme,
  });
}

function digestLayoutSlide(theme) {
  return dashboardSlide({
    id: "digest-showcase",
    title: "Digest layout",
    subtitle: "News round-up — three article cards in one glance.",
    columns: 3,
    body: [
      digestArticle({
        imageUrl: SAMPLE_HERO_IMAGE,
        title: "Renderer parity",
        summary: "Outlook, Teams, and Power Apps now share a single host-config baseline.",
        gridPosition: { column: 1, row: 3 },
      }),
      digestArticle({
        imageUrl: SAMPLE_HERO_IMAGE,
        title: "Authoring guide",
        summary: "Updated DSL playbook with grid layout patterns and accessibility rules.",
        gridPosition: { column: 2, row: 3 },
      }),
      digestArticle({
        imageUrl: SAMPLE_HERO_IMAGE,
        title: "MCP server",
        summary: "Drop-in npx server brings Adaptive Slide tools to any MCP-aware client.",
        gridPosition: { column: 3, row: 3 },
      }),
    ],
    theme,
  });
}

function mediaLayoutSlide(theme) {
  return dashboardSlide({
    id: "media-showcase",
    title: "Video and media layout",
    subtitle: "Combine a media element with supporting text and one clear action.",
    columns: 4,
    body: [
      mediaTile({
        url: SAMPLE_VIDEO_URL,
        poster: SAMPLE_VIDEO_POSTER,
        gridPosition: { column: 1, row: 3, columnSpan: 4, rowSpan: 2 },
      }),
      {
        type: "Tile.Text",
        text: "Adaptive Cards in 90 seconds — what they are and where they render.",
        style: "body",
        color: "light",
        gridPosition: { column: 1, row: 5, columnSpan: 4 },
      },
      buttonMock({ label: "Open transcript", style: "accent", gridPosition: { column: 1, row: 6, columnSpan: 2 } }),
      buttonMock({ label: "Save for later", style: "default", gridPosition: { column: 3, row: 6, columnSpan: 2 } }),
    ],
    theme,
  });
}

function formLayoutSlide(theme) {
  return dashboardSlide({
    id: "form-showcase",
    title: "Form layout",
    subtitle: "Collect a small set of structured inputs to file a task or ticket.",
    columns: 4,
    body: [
      inputMock({
        label: "Title",
        placeholder: "Describe the issue in one line",
        gridPosition: { column: 1, row: 3, columnSpan: 4 },
      }),
      inputMock({
        label: "Severity",
        placeholder: "Select severity",
        gridPosition: { column: 1, row: 4, columnSpan: 2 },
      }),
      inputMock({
        label: "Assignee",
        placeholder: "Pick a teammate",
        gridPosition: { column: 3, row: 4, columnSpan: 2 },
      }),
      inputMock({
        label: "Steps to reproduce",
        placeholder: "1. Open ...\n2. Click ...\n3. Observe ...",
        gridPosition: { column: 1, row: 5, columnSpan: 4 },
      }),
      buttonMock({ label: "Submit", style: "accent", gridPosition: { column: 1, row: 6, columnSpan: 2 } }),
      buttonMock({ label: "Cancel", style: "default", gridPosition: { column: 3, row: 6, columnSpan: 2 } }),
    ],
    theme,
  });
}

function quickInputLayoutSlide(theme) {
  return dashboardSlide({
    id: "quick-input-showcase",
    title: "Quick input layout",
    subtitle: "One prompt, one input, one send — for in-the-moment replies.",
    columns: 4,
    body: [
      {
        type: "Tile.Text",
        text: "How would you rate the new schema validator?",
        style: "subheading",
        weight: "bolder",
        color: "accent",
        gridPosition: { column: 1, row: 3, columnSpan: 4 },
      },
      inputMock({
        label: "Your reply",
        placeholder: "Type a short answer ...",
        gridPosition: { column: 1, row: 4, columnSpan: 3 },
      }),
      buttonMock({ label: "Send", style: "accent", gridPosition: { column: 4, row: 4, columnSpan: 1 } }),
    ],
    theme,
  });
}

function expandableLayoutSlide(theme) {
  return dashboardSlide({
    id: "expandable-showcase",
    title: "Expandable layout",
    subtitle: "Lead with the summary; reveal extra detail only on demand.",
    columns: 4,
    body: [
      {
        type: "Tile.Text",
        text: "Deployment passed all gates",
        style: "subheading",
        weight: "bolder",
        color: "accent",
        gridPosition: { column: 1, row: 3, columnSpan: 4 },
      },
      {
        type: "Tile.Text",
        text: "Build 2025.11.04 promoted to release with 0 critical findings.",
        style: "body",
        color: "light",
        gridPosition: { column: 1, row: 4, columnSpan: 4 },
      },
      buttonMock({ label: "Show details", style: "accent", gridPosition: { column: 1, row: 5, columnSpan: 4 } }),
      {
        type: "Tile.Container",
        style: "emphasis",
        gridPosition: { column: 1, row: 6, columnSpan: 4 },
        items: [
          { type: "Tile.Text", text: "Coverage", style: "caption", color: "accent", weight: "bolder" },
          { type: "Tile.Text", text: "Lines 92.4% — Branches 88.1% — Functions 95.0%", style: "body", color: "light" },
          { type: "Tile.Text", text: "Security", style: "caption", color: "accent", weight: "bolder" },
          { type: "Tile.Text", text: "0 critical, 1 medium (false positive)", style: "body", color: "light" },
        ],
      },
    ],
    theme,
  });
}

export function createPromptDeck(prompt) {
  const normalizedPrompt = prompt.trim() || "Custom adaptive card training deck";
  const title =
    normalizedPrompt.split(/\s+/).slice(0, 8).join(" ").replace(/[^\w\s-]/g, "").trim() ||
    "Generated Adaptive Slide Deck";

  return deck({
    title,
    description: `Starter deck generated from prompt: ${normalizedPrompt}`,
    tags: ["generated", "starter", "adaptive-slide"],
    theme: themes.generated,
    slides: [
      dashboardSlide({
        id: "generated-dashboard",
        title,
        subtitle: "Generated starter — replace placeholder content with your own.",
        theme: themes.generated,
        columns: 4,
        body: [
          statTile({ value: "4", label: "Slides", style: "accent", gridPosition: { column: 1, row: 3 } }),
          statTile({ value: "5", label: "Tile types", style: "emphasis", gridPosition: { column: 2, row: 3 } }),
          statTile({ value: "JSON", label: "Schema", style: "good", gridPosition: { column: 3, row: 3 } }),
          statTile({ value: "MCP", label: "Renderable", style: "accent", gridPosition: { column: 4, row: 3 } }),
          listTile({
            title: "Build flow",
            items: [
              "Refine prompt and regenerate",
              "Edit JSON in your tool of choice",
              "Validate against the schema",
              "Render in MCP host or web",
            ],
            gridPosition: { column: 1, row: 4, columnSpan: 4 },
          }),
        ],
      }),
      titleSlide("generated-title", title, "Adaptive Slide starter from natural language", themes.generated),
      agendaSlide("generated-plan", "Suggested slide plan", [
        { label: "Audience", detail: "Who the deck is for and the decision they need to make." },
        { label: "Outcome", detail: "Behavior, knowledge, or action the deck should drive." },
        { label: "Content", detail: "Convert ideas into text, chart, code, image, and container tiles." },
        { label: "Validation", detail: "Run the deck through the schema validator before publishing." },
      ]),
      closeSlide(
        "generated-close",
        "Ready to customize",
        "Download the JSON, edit it, and render with Adaptive Slide.",
        themes.generated,
      ),
    ],
  });
}

// =============================================================================
// Industry-tailored templates
// =============================================================================

export const templateDecks = [
  // ---- Training -----------------------------------------------------------
  {
    id: "training-onboarding",
    title: "New Hire Onboarding Readiness",
    category: "Training",
    useCase: "Cohort onboarding and product enablement",
    audience: "Talent enablement, managers, learning leaders",
    summary:
      "Cohort-level readiness dashboard with module completion, knowledge scores, at-risk learners, and weekly trend.",
    tags: ["training", "onboarding", "enablement"],
    deck: deck({
      title: "New Hire Onboarding — Cohort 2025-Q3",
      description: "Cohort-level training readiness dashboard and program flow.",
      tags: ["training", "onboarding", "enablement"],
      theme: themes.training,
      slides: [
        dashboardSlide({
          id: "training-dashboard",
          title: "Onboarding Readiness — Week 4",
          subtitle: "Cohort 2025-Q3 · 47 learners · 12-week program",
          theme: themes.training,
          columns: 4,
          body: [
            statTile({ value: "8/12", label: "Modules complete", style: "accent", gridPosition: { column: 1, row: 3 } }),
            statTile({ value: "92%", label: "Average score", style: "good", gridPosition: { column: 2, row: 3 } }),
            statTile({ value: "47", label: "Active learners", style: "emphasis", gridPosition: { column: 3, row: 3 } }),
            statTile({ value: "3", label: "At risk", style: "attention", gridPosition: { column: 4, row: 3 } }),
            chartTile({
              title: "Module completion %",
              labels: ["Wk 1", "Wk 2", "Wk 3", "Wk 4"],
              values: [98, 95, 88, 82],
              color: "#a78bfa",
              gridPosition: { column: 1, row: 4, columnSpan: 2, rowSpan: 2 },
            }),
            listTile({
              title: "This week",
              items: [
                "Live demo: product tour (Mon 1p)",
                "Office hours: Wed 10a",
                "Cohort retro: Fri 3p",
              ],
              style: "default",
              gridPosition: { column: 3, row: 4, columnSpan: 2, rowSpan: 2 },
            }),
          ],
        }),
        titleSlide(
          "training-title",
          "New Hire Onboarding",
          "Cohort 2025-Q3 — twelve weeks to fully ramped",
          themes.training,
        ),
        agendaSlide("training-objectives", "Program objectives", [
          { label: "Foundation", detail: "Core values, tools, and team orientation in week 1." },
          { label: "Product", detail: "Hands-on product mastery and demo certification by week 4." },
          { label: "Process", detail: "Internal workflows, escalation paths, and tooling by week 8." },
          { label: "Practice", detail: "Real customer scenarios with mentor sign-off by week 12." },
        ]),
        checklistSlide("training-week-checklist", "Manager check-in this week", [
          "Confirm learner has completed Module 8 lab",
          "Schedule 1:1 to review week-4 self-assessment",
          "Pair learner with shadow account for next week",
          "Submit at-risk flag if any module is overdue >5 days",
        ]),
        closeSlide(
          "training-close",
          "Ready to ramp",
          "Track completion weekly and escalate at-risk learners early.",
          themes.training,
        ),
      ],
    }),
  },

  {
    id: "training-dsl-101",
    title: "Adaptive Slide DSL 101 — 8-card course",
    category: "Training",
    useCase: "Eight-card course pattern: title, six modules, validation card",
    audience: "Course authors, enablement, learning designers",
    summary:
      "Repeatable training pattern: title card + six content cards + a validation card with question, 1-5 rating, free-text feedback, and Submit to earn credit.",
    tags: ["training", "course", "input", "validation", "submit", "rating"],
    deck: deck({
      title: "Adaptive Slide DSL 101",
      description:
        "An eight-card crash course on the Adaptive Slide DSL: title, six training modules, and a combined validation card with question, rating, feedback, and submit. Credit-granting requires a host submit handler.",
      tags: ["training", "course", "dsl", "input", "validation", "submit"],
      theme: themes.trainingCourse,
      slides: [
        {
          type: "AdaptiveSlide",
          id: "card-1-title",
          title: "Title — Adaptive Slide DSL 101",
          background: {
            gradient: { type: "linear", colors: ["#022c22", "#065f46", "#10b981"], angle: 145 },
          },
          body: [
            {
              type: "Tile.Text",
              text: "Adaptive Slide DSL 101",
              style: "heading",
              size: "extraLarge",
              weight: "bolder",
              color: "light",
              horizontalAlignment: "center",
              spacing: "extraLarge",
            },
            {
              type: "Tile.Text",
              text: "An eight-card crash course on authoring schema-driven decks",
              style: "subheading",
              color: "light",
              horizontalAlignment: "center",
            },
            {
              type: "Tile.Text",
              text: "Six modules · One validation card · Earns completion credit",
              style: "caption",
              color: "light",
              horizontalAlignment: "center",
              spacing: "large",
            },
          ],
          notes: "Welcome. Set expectations: 6 short modules then a single validation card.",
        },
        {
          type: "AdaptiveSlide",
          id: "card-2-module-overview",
          title: "Module 1 — What is Adaptive Slide?",
          body: [
            { type: "Tile.Text", text: "Module 1 of 6", style: "caption", color: "accent", weight: "bolder" },
            { type: "Tile.Text", text: "What is Adaptive Slide?", style: "heading", size: "large" },
            {
              type: "Tile.Text",
              text:
                "Adaptive Slide is a JSON-first DSL that authors decks as schema-validated documents and compiles each slide to a fully compliant Adaptive Card 1.6 payload. One source, many surfaces: Teams, Outlook, web, MCP App.",
              style: "body",
            },
            {
              type: "Tile.Container",
              style: "accent",
              items: [
                {
                  type: "Tile.Text",
                  text: "Key idea — your slide is the Adaptive Card body. The transformer fills in the rest.",
                  style: "body",
                },
              ],
            },
          ],
        },
        {
          type: "AdaptiveSlide",
          id: "card-3-module-structure",
          title: "Module 2 — Decks, Slides, Tiles",
          body: [
            { type: "Tile.Text", text: "Module 2 of 6", style: "caption", color: "accent", weight: "bolder" },
            { type: "Tile.Text", text: "Decks, Slides, Tiles", style: "heading", size: "large" },
            {
              type: "Tile.Code",
              language: "json",
              title: "minimal.deck.json",
              code:
                '{\n  "type": "AdaptiveDeck",\n  "version": "1.0.0",\n  "slides": [\n    {\n      "type": "AdaptiveSlide",\n      "body": [\n        { "type": "Tile.Text", "text": "Hello!" }\n      ]\n    }\n  ]\n}',
              showLineNumbers: true,
              theme: "dark",
            },
          ],
        },
        {
          type: "AdaptiveSlide",
          id: "card-4-module-layouts",
          title: "Module 3 — Layouts",
          body: [
            { type: "Tile.Text", text: "Module 3 of 6", style: "caption", color: "accent", weight: "bolder" },
            { type: "Tile.Text", text: "Layouts", style: "heading", size: "large" },
            {
              type: "Tile.Container",
              style: "emphasis",
              items: [
                { type: "Tile.Text", text: "**stack** — vertical flow (default). Best for long-form reading.", style: "body" },
                { type: "Tile.Text", text: "**grid** — N columns, with gridPosition per tile. Best for dashboards.", style: "body" },
                { type: "Tile.Text", text: "**freeform** — absolute positioning. Best for hero slides and infographics.", style: "body" },
              ],
            },
          ],
        },
        {
          type: "AdaptiveSlide",
          id: "card-5-module-tiles",
          title: "Module 4 — Tile Types",
          body: [
            { type: "Tile.Text", text: "Module 4 of 6", style: "caption", color: "accent", weight: "bolder" },
            { type: "Tile.Text", text: "Tile Types", style: "heading", size: "large" },
            {
              type: "Tile.Container",
              layout: "row",
              style: "emphasis",
              items: [
                { type: "Tile.Text", text: "**Content** — Text, Image, Code, Chart, Media, Container.", style: "body" },
                { type: "Tile.Text", text: "**Inputs** — Input.Text, Input.Number, Input.ChoiceSet (this card 8 uses all three).", style: "body" },
              ],
            },
            {
              type: "Tile.Text",
              text: "Every tile compiles to a real AC 1.6 element. There is no proprietary surface — your deck runs anywhere a card runs.",
              style: "caption",
              spacing: "medium",
            },
          ],
        },
        {
          type: "AdaptiveSlide",
          id: "card-6-module-themes",
          title: "Module 5 — Themes, Transitions, Actions",
          body: [
            { type: "Tile.Text", text: "Module 5 of 6", style: "caption", color: "accent", weight: "bolder" },
            { type: "Tile.Text", text: "Themes, Transitions, Actions", style: "heading", size: "large" },
            {
              type: "Tile.Container",
              style: "good",
              items: [
                { type: "Tile.Text", text: "**Theme** — primaryColor, accentColor, backgroundColor, fontFamily, darkMode. Applies deck-wide.", style: "body" },
                { type: "Tile.Text", text: "**Transitions** — fade, slide-left, slide-right, slide-up, zoom, none. Per-slide override.", style: "body" },
                { type: "Tile.Text", text: "**Actions** — OpenUrl, Submit (host-handled), GoToSlide, NextSlide, PrevSlide.", style: "body" },
              ],
            },
          ],
        },
        {
          type: "AdaptiveSlide",
          id: "card-7-module-transform",
          title: "Module 6 — AC 1.6 Transformation",
          body: [
            { type: "Tile.Text", text: "Module 6 of 6", style: "caption", color: "accent", weight: "bolder" },
            { type: "Tile.Text", text: "AC 1.6 Transformation", style: "heading", size: "large" },
            {
              type: "Tile.Code",
              language: "javascript",
              title: "transform.js",
              code:
                'import { slideToAdaptiveCard } from "adaptive-slide";\n\nconst card = slideToAdaptiveCard(deck.slides[7], deck);\n// card now has Input.ChoiceSet, Input.Text, Action.Submit\n// Send to Teams, Outlook, or any AC 1.6 host.',
              showLineNumbers: false,
              theme: "dark",
            },
            {
              type: "Tile.Text",
              text: "The next card validates what you've learned. Answer the question, rate the training, and submit.",
              style: "caption",
              spacing: "medium",
            },
          ],
        },
        {
          type: "AdaptiveSlide",
          id: "card-8-validation",
          title: "Validation — Earn Credit",
          body: [
            { type: "Tile.Text", text: "Validation", style: "heading", size: "large" },
            {
              type: "Tile.Text",
              text: "Answer the question, rate the training, and tell us what to improve. Submit to earn completion credit.",
              style: "body",
              spacing: "small",
            },
            {
              type: "Tile.Input.ChoiceSet",
              id: "quizAnswer",
              label: "1. Which of these is NOT an Adaptive Slide tile type?",
              style: "expanded",
              isRequired: true,
              errorMessage: "Pick the option that does not exist in the DSL.",
              choices: [
                { title: "Tile.Text", value: "text" },
                { title: "Tile.Image", value: "image" },
                { title: "Tile.Button", value: "button" },
                { title: "Tile.Container", value: "container" },
              ],
              spacing: "medium",
            },
            {
              type: "Tile.Input.ChoiceSet",
              id: "courseRating",
              label: "2. How clear was this training? (1 = Poor, 5 = Excellent)",
              style: "expanded",
              isRequired: true,
              errorMessage: "Pick a rating from 1 to 5.",
              choices: [
                { title: "1 — Poor", value: "1" },
                { title: "2 — Fair", value: "2" },
                { title: "3 — Good", value: "3" },
                { title: "4 — Great", value: "4" },
                { title: "5 — Excellent", value: "5" },
              ],
              spacing: "medium",
            },
            {
              type: "Tile.Input.Text",
              id: "feedbackComment",
              label: "3. What can we improve? (optional)",
              placeholder: "One or two sentences is plenty.",
              isMultiline: true,
              maxLength: 500,
              spacing: "medium",
            },
          ],
          actions: [
            {
              type: "Action.Submit",
              title: "Complete and get credit",
              data: { courseId: "training-dsl-101", action: "complete-and-credit" },
            },
          ],
          notes:
            "Submit is host-handled. Hosts (Teams, Outlook, MCP App) receive the inputs payload (quizAnswer, courseRating, feedbackComment) plus the static data (courseId, action) to grant credit.",
        },
      ],
    }),
  },

  // ---- Healthcare ---------------------------------------------------------
  {
    id: "healthcare-discharge",
    title: "Patient Discharge Summary",
    category: "Healthcare",
    useCase: "Patient discharge and care-team handoff",
    audience: "Care coordinators, hospitalists, patient educators",
    summary:
      "Patient discharge dashboard with vitals, daily medications, follow-up appointment, and warning-sign alerts.",
    tags: ["healthcare", "discharge", "patient-education"],
    deck: deck({
      title: "Discharge Summary Template",
      description: "Patient-friendly discharge education dashboard and care-team handoff.",
      tags: ["healthcare", "discharge", "patient-education"],
      theme: themes.healthcare,
      slides: [
        dashboardSlide({
          id: "healthcare-dashboard",
          title: "Discharge Summary — MRN 7842301",
          subtitle: "Day 4 post-op · Cardiac unit · Ready for home transition",
          theme: themes.healthcare,
          columns: 4,
          body: [
            statTile({ value: "72", label: "Heart rate (bpm)", style: "good", gridPosition: { column: 1, row: 3 } }),
            statTile({ value: "118/76", label: "Blood pressure", style: "good", gridPosition: { column: 2, row: 3 } }),
            statTile({ value: "98.4°", label: "Temp (°F)", style: "accent", gridPosition: { column: 3, row: 3 } }),
            statTile({ value: "98%", label: "O₂ saturation", style: "good", gridPosition: { column: 4, row: 3 } }),
            listTile({
              title: "Daily medication",
              items: [
                "Metoprolol 25 mg — 8a / 8p",
                "Aspirin 81 mg — 9a",
                "Atorvastatin 40 mg — bedtime",
              ],
              gridPosition: { column: 1, row: 4, columnSpan: 2, rowSpan: 2 },
            }),
            statusTile({
              label: "Follow-up",
              status: "Cardiology — Tue Apr 30, 10:30a",
              detail: "Bring meds list. Lab draw 30 min before visit.",
              style: "accent",
              gridPosition: { column: 3, row: 4, columnSpan: 2 },
            }),
            statusTile({
              label: "Call your team if",
              status: "Chest pain · shortness of breath · fever >100.4°",
              style: "attention",
              gridPosition: { column: 3, row: 5, columnSpan: 2 },
            }),
          ],
        }),
        titleSlide(
          "healthcare-title",
          "Discharge Education",
          "Care plan, warning signs, follow-up, and support contacts",
          themes.healthcare,
        ),
        agendaSlide("healthcare-careplan", "Care plan summary", [
          { label: "Medication", detail: "Dose, timing, and missed-dose instructions for each prescription." },
          { label: "Warning signs", detail: "Symptoms that require an urgent call to the care team." },
          { label: "Follow-up", detail: "Appointment date, location, and what to bring." },
          { label: "Support", detail: "After-hours nurse line and patient portal contact options." },
        ]),
        checklistSlide("healthcare-checklist", "Home readiness checklist", [
          "Patient can teach back medication plan",
          "Caregiver knows when to call the care team",
          "Transportation home is confirmed",
          "Follow-up appointment is on the calendar",
        ]),
        closeSlide(
          "healthcare-close",
          "Safe transition home",
          "Document teach-back and share with the receiving care team.",
          themes.healthcare,
        ),
      ],
    }),
  },

  // ---- Financial Services -------------------------------------------------
  {
    id: "financial-fraud",
    title: "Fraud Operations Briefing",
    category: "Financial Services",
    useCase: "Weekly fraud and risk operations review",
    audience: "Risk officers, fraud ops, compliance, executive leadership",
    summary:
      "Fraud operations dashboard with open cases, recovery dollars, channel breakdown, and risk exposure by region.",
    tags: ["financial-services", "fraud", "risk", "ops"],
    deck: deck({
      title: "Fraud Operations Briefing",
      description: "Weekly fraud operations dashboard and response actions.",
      tags: ["financial-services", "fraud", "risk", "ops"],
      theme: themes.financial,
      slides: [
        dashboardSlide({
          id: "financial-dashboard",
          title: "Q3 Fraud Operations — Week 28",
          subtitle: "Cards · ACH · Wire · Digital channels · Region 1–4",
          theme: themes.financial,
          columns: 4,
          body: [
            statTile({ value: "142", label: "Open cases", style: "attention", gridPosition: { column: 1, row: 3 } }),
            statTile({ value: "$1.2M", label: "Recovered YTD", style: "good", gridPosition: { column: 2, row: 3 } }),
            statTile({ value: "4.2d", label: "Mean time to close", style: "accent", gridPosition: { column: 3, row: 3 } }),
            statTile({ value: "$4.8M", label: "Loss prevented", style: "good", gridPosition: { column: 4, row: 3 } }),
            chartTile({
              title: "Cases by channel %",
              labels: ["Cards", "ACH", "Wire", "Digital"],
              values: [31, 18, 9, 42],
              color: "#fbbf24",
              gridPosition: { column: 1, row: 4, columnSpan: 2, rowSpan: 2 },
            }),
            statusTile({
              label: "High exposure",
              status: "Region 4 — synthetic identity ring, 23 accounts flagged",
              detail: "Containment in progress · ETA 24h",
              style: "attention",
              gridPosition: { column: 3, row: 4, columnSpan: 2 },
            }),
            listTile({
              title: "This week's actions",
              items: [
                "Tighten velocity rule on digital channel (R4)",
                "Publish exec summary by Thu EOD",
                "Open SAR review on ring 0427-A",
              ],
              gridPosition: { column: 3, row: 5, columnSpan: 2 },
            }),
          ],
        }),
        titleSlide(
          "financial-title",
          "Fraud Operations Briefing",
          "Trend analysis · control posture · weekly action register",
          themes.financial,
        ),
        agendaSlide("financial-controls", "Control response", [
          { label: "Detect", detail: "Tune anomaly rules, velocity limits, and device intelligence signals." },
          { label: "Triage", detail: "Prioritize high-loss exposure, vulnerable customers, and repeated patterns." },
          { label: "Investigate", detail: "Connect case notes, transaction context, and customer communications." },
          { label: "Report", detail: "Prepare regulatory, leadership, and remediation status updates." },
        ]),
        checklistSlide("financial-actions", "Action register", [
          "Confirm threshold changes with risk owners",
          "Review false positive rate after deployment",
          "Update analyst runbook",
          "Publish weekly executive summary",
        ]),
        closeSlide(
          "financial-close",
          "Risk response aligned",
          "Track owners, due dates, and post-control effectiveness.",
          themes.financial,
        ),
      ],
    }),
  },

  // ---- Retail -------------------------------------------------------------
  {
    id: "retail-seasonal",
    title: "Seasonal Launch Performance",
    category: "Retail",
    useCase: "Store team merchandising and campaign launch",
    audience: "Store leaders, merchandising, marketing, operations",
    summary:
      "Daily launch performance with traffic, conversion, AOV, top SKUs, and store rankings for execution focus.",
    tags: ["retail", "merchandising", "campaign"],
    deck: deck({
      title: "Holiday 2025 Launch — Day 3",
      description: "Daily seasonal launch performance dashboard and execution plan.",
      tags: ["retail", "merchandising", "campaign"],
      theme: themes.retail,
      slides: [
        dashboardSlide({
          id: "retail-dashboard",
          title: "Holiday Launch — Day 3",
          subtitle: "248 stores · Region East / West / Central · vs. plan",
          theme: themes.retail,
          columns: 4,
          body: [
            statTile({ value: "+18%", label: "Traffic vs plan", style: "good", gridPosition: { column: 1, row: 3 } }),
            statTile({ value: "4.2%", label: "Conversion", style: "accent", gridPosition: { column: 2, row: 3 } }),
            statTile({ value: "$87", label: "AOV", style: "emphasis", gridPosition: { column: 3, row: 3 } }),
            statTile({ value: "12", label: "Top stores", style: "good", gridPosition: { column: 4, row: 3 } }),
            chartTile({
              title: "Top 4 SKUs (units)",
              labels: ["Hero A", "Hero B", "Add-on C", "Gift D"],
              values: [842, 615, 503, 391],
              color: "#fbbf24",
              gridPosition: { column: 1, row: 4, columnSpan: 2, rowSpan: 2 },
            }),
            statusTile({
              label: "Store of the day",
              status: "#0142 Northgate — 142% to plan",
              detail: "Standout: hero display + barista promo",
              style: "good",
              gridPosition: { column: 3, row: 4, columnSpan: 2 },
            }),
            listTile({
              title: "Tonight's action",
              items: [
                "Replenish Hero A — 6pm cutoff",
                "Reset front table to gift moment",
                "Confirm Wed staffing for peak",
              ],
              gridPosition: { column: 3, row: 5, columnSpan: 2 },
            }),
          ],
        }),
        titleSlide(
          "retail-title",
          "Seasonal Launch Playbook",
          "Campaign story, store execution, and daily operating rhythm",
          themes.retail,
        ),
        agendaSlide("retail-plan", "Launch plan", [
          { label: "Story", detail: "Seasonal message, hero assortment, and customer promise." },
          { label: "Floor set", detail: "Display placement, signage, replenishment, visual standards." },
          { label: "Staffing", detail: "Coverage to expected traffic, peak windows, and service moments." },
          { label: "Metrics", detail: "Conversion, basket size, attachment rate, and inventory health." },
        ]),
        checklistSlide("retail-readiness", "Store readiness checklist", [
          "Visual standards confirmed and photographed",
          "Inventory exceptions escalated by 9a",
          "Daily huddle script shared with leads",
          "Customer objections captured and routed",
        ]),
        closeSlide(
          "retail-close",
          "Launch ready",
          "Run the floor walk, publish final deck, and monitor daily signals.",
          themes.retail,
        ),
      ],
    }),
  },

  // ---- Manufacturing ------------------------------------------------------
  {
    id: "manufacturing-safety",
    title: "Plant Shift Safety Standup",
    category: "Manufacturing",
    useCase: "Daily plant safety + quality standup",
    audience: "Plant managers, line leads, quality, safety teams",
    summary:
      "Plant safety dashboard with incident streak, OEE, first-pass yield, line status, and today's safety focus.",
    tags: ["manufacturing", "safety", "quality", "ops"],
    deck: deck({
      title: "Plant 2 — Shift Safety Standup",
      description: "Daily manufacturing safety and quality standup dashboard.",
      tags: ["manufacturing", "safety", "quality", "ops"],
      theme: themes.manufacturing,
      slides: [
        dashboardSlide({
          id: "manufacturing-dashboard",
          title: "Plant 2 — Shift Briefing",
          subtitle: "Day shift · 06:00 handoff · Lines A · B · C",
          theme: themes.manufacturing,
          columns: 4,
          body: [
            statTile({ value: "47", label: "Days w/o incident", style: "good", gridPosition: { column: 1, row: 3 } }),
            statTile({ value: "84%", label: "OEE rolling 7d", style: "accent", gridPosition: { column: 2, row: 3 } }),
            statTile({ value: "96%", label: "First-pass yield", style: "good", gridPosition: { column: 3, row: 3 } }),
            statTile({ value: "3", label: "Open NCRs", style: "warning", gridPosition: { column: 4, row: 3 } }),
            statusTile({
              label: "Line A — Assembly",
              status: "Running · OEE 88% · 0 stops",
              style: "good",
              gridPosition: { column: 1, row: 4 },
            }),
            statusTile({
              label: "Line B — Coating",
              status: "Hold · cure-zone calibration",
              detail: "Maint ETA 07:30",
              style: "warning",
              gridPosition: { column: 2, row: 4 },
            }),
            statusTile({
              label: "Line C — Pack",
              status: "Running · OEE 81%",
              detail: "Watch: label feed jam history",
              style: "accent",
              gridPosition: { column: 3, row: 4 },
            }),
            statusTile({
              label: "Hot zone",
              status: "Bay 4 forklift route",
              detail: "Spotter required this shift",
              style: "attention",
              gridPosition: { column: 4, row: 4 },
            }),
            listTile({
              title: "Today's safety focus",
              items: [
                "LOTO refresher at 10:00",
                "Confirm bay-4 spotter coverage",
                "Close near-miss NM-0426 by EOD",
              ],
              gridPosition: { column: 1, row: 5, columnSpan: 4 },
            }),
          ],
        }),
        titleSlide(
          "manufacturing-title",
          "Plant 2 — Shift Standup",
          "Hazards · quality · handoff · escalation discipline",
          themes.manufacturing,
        ),
        agendaSlide("manufacturing-handoff", "Shift handoff", [
          { label: "People", detail: "Staffing, training restrictions, support assignments." },
          { label: "Process", detail: "Standard work changes and active containment actions." },
          { label: "Equipment", detail: "Downtime risk, maintenance windows, and blocked assets." },
          { label: "Escalation", detail: "When to stop the line and who owns each escalation path." },
        ]),
        checklistSlide("manufacturing-quality", "Quality watch", [
          "Confirm first-piece sign-off on each line",
          "Review NCR aging — escalate >48h",
          "Trend scrap by line for end-of-shift report",
          "Note any audit-relevant deviations",
        ]),
        closeSlide(
          "manufacturing-close",
          "Safe shift start",
          "Document decisions and carry open risks into the next handoff.",
          themes.manufacturing,
        ),
      ],
    }),
  },

  // ---- Public Sector ------------------------------------------------------
  {
    id: "public-sector-emergency",
    title: "Emergency Response Briefing",
    category: "Public Sector",
    useCase: "Multi-agency incident coordination",
    audience: "Agency leadership, EOC commanders, communications",
    summary:
      "Incident response dashboard with affected population, deployed crews, shelter capacity, and public-message status.",
    tags: ["public-sector", "emergency", "incident-response"],
    deck: deck({
      title: "Storm Response — Region 4",
      description: "Multi-agency incident coordination dashboard.",
      tags: ["public-sector", "emergency", "incident-response"],
      theme: themes.publicSector,
      slides: [
        dashboardSlide({
          id: "public-dashboard",
          title: "Storm Response — Day 2",
          subtitle: "Region 4 · EOC activated · Multi-agency operation",
          theme: themes.publicSector,
          columns: 4,
          body: [
            statTile({ value: "12,400", label: "Residents affected", style: "warning", gridPosition: { column: 1, row: 3 } }),
            statTile({ value: "8", label: "Shelters open", style: "good", gridPosition: { column: 2, row: 3 } }),
            statTile({ value: "47", label: "Crews deployed", style: "accent", gridPosition: { column: 3, row: 3 } }),
            statTile({ value: "36h", label: "ETR power", style: "warning", gridPosition: { column: 4, row: 3 } }),
            chartTile({
              title: "Shelter capacity %",
              labels: ["North", "East", "South", "West"],
              values: [62, 88, 41, 73],
              color: "#fbbf24",
              gridPosition: { column: 1, row: 4, columnSpan: 2, rowSpan: 2 },
            }),
            statusTile({
              label: "Critical infra",
              status: "Hospital generators operational · Water main intact",
              style: "good",
              gridPosition: { column: 3, row: 4, columnSpan: 2 },
            }),
            statusTile({
              label: "Public message",
              status: "10:00 update posted · Next at 14:00",
              detail: "Channels: web, SMS, radio, social",
              style: "accent",
              gridPosition: { column: 3, row: 5, columnSpan: 2 },
            }),
          ],
        }),
        titleSlide(
          "public-title",
          "Emergency Response Briefing",
          "Situation · priorities · resources · public updates",
          themes.publicSector,
        ),
        agendaSlide("public-priorities", "Operational priorities", [
          { label: "Life safety", detail: "Protect impacted residents, responders, and vulnerable populations." },
          { label: "Stabilization", detail: "Coordinate resources, logistics, and agency responsibilities." },
          { label: "Information", detail: "Share confirmed updates and suppress unverified claims." },
          { label: "Recovery", detail: "Plan transition from immediate response to sustained support." },
        ]),
        checklistSlide("public-comms", "Public message checklist", [
          "Plain language; reading-level checked",
          "Verified sources cited inline",
          "Includes next update time and contact",
          "Accessible: alt text, captions, translations",
        ]),
        closeSlide(
          "public-close",
          "Response aligned",
          "Publish update and capture unresolved dependencies for next shift.",
          themes.publicSector,
        ),
      ],
    }),
  },

  // ---- Education ----------------------------------------------------------
  {
    id: "education-module",
    title: "Course Module Progress",
    category: "Education",
    useCase: "Mid-cycle classroom or course module review",
    audience: "Teachers, instructional designers, learning leaders",
    summary:
      "Student progress dashboard with mastery %, at-risk count, average score, engagement, and topic-mastery chart.",
    tags: ["education", "course", "workshop"],
    deck: deck({
      title: "Algebra II — Module 4 Mid-Cycle",
      description: "Mid-cycle student progress dashboard for a course module.",
      tags: ["education", "course", "workshop"],
      theme: themes.education,
      slides: [
        dashboardSlide({
          id: "education-dashboard",
          title: "Algebra II · Module 4 — Mid-cycle",
          subtitle: "Period 3 · 28 students · Day 6 of 12",
          theme: themes.education,
          columns: 4,
          body: [
            statTile({ value: "78%", label: "Class mastery", style: "accent", gridPosition: { column: 1, row: 3 } }),
            statTile({ value: "84%", label: "Avg score", style: "good", gridPosition: { column: 2, row: 3 } }),
            statTile({ value: "92%", label: "Engagement", style: "good", gridPosition: { column: 3, row: 3 } }),
            statTile({ value: "4", label: "At risk", style: "warning", gridPosition: { column: 4, row: 3 } }),
            chartTile({
              title: "Topic mastery %",
              labels: ["Linear", "Quadratic", "Systems", "Functions"],
              values: [88, 72, 65, 81],
              color: "#fbbf24",
              gridPosition: { column: 1, row: 4, columnSpan: 2, rowSpan: 2 },
            }),
            listTile({
              title: "Reteach focus",
              items: [
                "Quadratic word problems (small group)",
                "Systems via substitution (warm-up)",
                "Office hours: Thu lunch",
              ],
              gridPosition: { column: 3, row: 4, columnSpan: 2 },
            }),
            statusTile({
              label: "Next assessment",
              status: "Quiz 4B — Friday",
              detail: "Covers systems and functions",
              style: "accent",
              gridPosition: { column: 3, row: 5, columnSpan: 2 },
            }),
          ],
        }),
        titleSlide(
          "education-title",
          "Course Module — Algebra II",
          "Outcomes · activities · assessment · reflection",
          themes.education,
        ),
        agendaSlide("education-outcomes", "Learning outcomes", [
          { label: "Recall", detail: "Define key vocabulary and concepts." },
          { label: "Practice", detail: "Apply the concept to a guided scenario." },
          { label: "Assess", detail: "Demonstrate mastery through a short task." },
          { label: "Reflect", detail: "Connect content to a real-world context." },
        ]),
        checklistSlide("education-activities", "Module activities", [
          "Warm-up question",
          "Concept mini-lesson",
          "Guided practice",
          "Independent task",
          "Exit ticket",
        ]),
        closeSlide(
          "education-close",
          "Module complete",
          "Collect artifacts, review misconceptions, and assign extension work.",
          themes.education,
        ),
      ],
    }),
  },

  // ---- Sales --------------------------------------------------------------
  {
    id: "sales-enablement",
    title: "Quarterly Pipeline Review",
    category: "Sales",
    useCase: "Pipeline review and account team enablement",
    audience: "Sales leaders, account teams, solutions, ops",
    summary:
      "Pipeline coverage dashboard with quarter pipeline, win rate, stage distribution, and deals-at-risk callout.",
    tags: ["sales", "pipeline", "enablement"],
    deck: deck({
      title: "Q3 Pipeline Snapshot",
      description: "Quarterly pipeline review dashboard and enablement playbook.",
      tags: ["sales", "pipeline", "enablement"],
      theme: themes.sales,
      slides: [
        dashboardSlide({
          id: "sales-dashboard",
          title: "Q3 Pipeline Snapshot — Week 8",
          subtitle: "Enterprise West · 14 reps · target $4.2M",
          theme: themes.sales,
          columns: 4,
          body: [
            statTile({ value: "$12.4M", label: "Pipeline", style: "good", gridPosition: { column: 1, row: 3 } }),
            statTile({ value: "3.2x", label: "Coverage ratio", style: "accent", gridPosition: { column: 2, row: 3 } }),
            statTile({ value: "28%", label: "Win rate", style: "good", gridPosition: { column: 3, row: 3 } }),
            statTile({ value: "7", label: "Stalled deals", style: "warning", gridPosition: { column: 4, row: 3 } }),
            chartTile({
              title: "Stage distribution ($M)",
              labels: ["Discover", "Qualify", "Propose", "Close"],
              values: [3.8, 4.1, 2.9, 1.6],
              color: "#06b6d4",
              gridPosition: { column: 1, row: 4, columnSpan: 2, rowSpan: 2 },
            }),
            statusTile({
              label: "Top deal",
              status: "Acme Co · $620K · Propose · close Aug 22",
              detail: "Risk: budget timing — exec sponsor confirmed",
              style: "good",
              gridPosition: { column: 3, row: 4, columnSpan: 2 },
            }),
            listTile({
              title: "Deals at risk",
              items: [
                "Globex — security review stalled (14d)",
                "Initech — competing eval starts Mon",
                "Acme W — sponsor moved teams",
              ],
              style: "warning",
              gridPosition: { column: 3, row: 5, columnSpan: 2 },
            }),
          ],
        }),
        titleSlide(
          "sales-title",
          "Pipeline Review",
          "Coverage · stage health · enablement plays",
          themes.sales,
        ),
        agendaSlide("sales-message", "Buyer conversation framework", [
          { label: "Pain", detail: "Connect the offering to urgent business pressure and measurable impact." },
          { label: "Value", detail: "State differentiated outcomes in the customer's operating language." },
          { label: "Proof", detail: "Use evidence, customer examples, and implementation milestones." },
          { label: "Close", detail: "Decision criteria, next meeting, owner, and mutual action plan." },
        ]),
        checklistSlide("sales-objections", "Common objections", [
          "Budget timing — phase of contract",
          "Security review — pre-stage docs",
          "Change management — exec sponsor + adoption plan",
          "Competitive comparison — proof points + references",
        ]),
        closeSlide(
          "sales-close",
          "Field ready",
          "Share the playbook, capture feedback, and update win stories.",
          themes.sales,
        ),
      ],
    }),
  },

  // ---- Customer Support ---------------------------------------------------
  {
    id: "support-escalation",
    title: "Sev 2 Incident Tracker",
    category: "Customer Support",
    useCase: "Active incident response and customer recovery",
    audience: "Support managers, incident leads, engineering, comms",
    summary:
      "Active incident dashboard with customers impacted, MTTR clock, workstream status, and customer comms timeline.",
    tags: ["support", "escalation", "incident"],
    deck: deck({
      title: "INC-4821 — Authentication Degradation",
      description: "Active customer-impact incident dashboard and recovery plan.",
      tags: ["support", "escalation", "incident"],
      theme: themes.support,
      slides: [
        dashboardSlide({
          id: "support-dashboard",
          title: "INC-4821 — Auth Degradation",
          subtitle: "Sev 2 · Started 09:42 UTC · Mitigating",
          theme: themes.support,
          columns: 4,
          body: [
            statTile({ value: "1,247", label: "Customers impacted", style: "attention", gridPosition: { column: 1, row: 3 } }),
            statTile({ value: "4m", label: "Time to ack", style: "good", gridPosition: { column: 2, row: 3 } }),
            statTile({ value: "1h", label: "MTTR target", style: "accent", gridPosition: { column: 3, row: 3 } }),
            statTile({ value: "32m", label: "Elapsed", style: "warning", gridPosition: { column: 4, row: 3 } }),
            statusTile({
              label: "Engineering",
              status: "Rolling back auth-svc to v4.2.1",
              detail: "Owner: @evelyn · ETA 15m",
              style: "accent",
              gridPosition: { column: 1, row: 4, columnSpan: 2 },
            }),
            statusTile({
              label: "Support",
              status: "Workaround posted · 187 cases routed",
              detail: "Owner: @marcus",
              style: "good",
              gridPosition: { column: 3, row: 4, columnSpan: 2 },
            }),
            listTile({
              title: "Customer comms timeline",
              items: [
                "09:46 — Status page updated to Investigating",
                "09:58 — Workaround posted",
                "10:04 — Personalized email to top accounts",
                "Next: 10:30 status update + RCA placeholder",
              ],
              gridPosition: { column: 1, row: 5, columnSpan: 4 },
            }),
          ],
        }),
        titleSlide(
          "support-title",
          "Incident Escalation Review",
          "Impact · timeline · owners · recovery plan",
          themes.support,
        ),
        agendaSlide("support-summary", "Escalation summary", [
          { label: "Impact", detail: "Affected users, business process, severity, and start time." },
          { label: "Timeline", detail: "Detection, triage, mitigation, and customer updates." },
          { label: "Owners", detail: "Accountable support, engineering, customer success, comms." },
          { label: "Recovery", detail: "Fix plan, validation criteria, follow-up commitments." },
        ]),
        checklistSlide("support-next", "Customer update checklist", [
          "Plain-language summary at the top",
          "Current status and any workaround",
          "Next update time committed",
          "Named owner and escalation path",
        ]),
        closeSlide(
          "support-close",
          "Recovery in motion",
          "Track commitments and convert learnings into a reusable support article.",
          themes.support,
        ),
      ],
    }),
  },
  {
    id: "ac-layout-hero",
    category: "Card layouts",
    title: "Hero layout",
    summary: "Image-first storytelling for articles, releases, and announcements.",
    tags: ["adaptive cards", "layout", "hero"],
    deck: deck({
      title: "Hero card layout",
      description: "Adaptive Cards hero layout — large image carries the message; one primary action sits below.",
      tags: ["layout", "hero", "adaptive-cards"],
      theme: themes.acPattern,
      slides: [
        heroLayoutSlide(themes.acPattern),
        whenToUseSlide({
          id: "hero-when",
          title: "Hero — when to use",
          when: [
            "An article, release, or announcement where an image tells most of the story",
            "There is one clear primary action (read, share, open)",
            "Card width is wide or standard breakpoint",
          ],
          dont: [
            "The image is purely decorative or low contrast",
            "There are more than two competing actions",
            "The card must remain compact in narrow widths",
          ],
          theme: themes.acPattern,
        }),
        anatomySlide({
          id: "hero-anatomy",
          title: "Hero — anatomy",
          parts: [
            { label: "Hero image", detail: "Full-width image with 4.5:1 contrast against any overlaid text" },
            { label: "Headline", detail: "TextBlock styled heading, weight bolder, light color" },
            { label: "Body", detail: "Short body copy that complements (not duplicates) the image" },
            { label: "Primary action", detail: "Single accented button; secondary actions stay quiet" },
          ],
          theme: themes.acPattern,
        }),
      ],
    }),
  },
  {
    id: "ac-layout-thumbnail",
    category: "Card layouts",
    title: "Thumbnail layout",
    summary: "Compact image plus actionable message for dense feeds.",
    tags: ["adaptive cards", "layout", "thumbnail"],
    deck: deck({
      title: "Thumbnail card layout",
      description: "Adaptive Cards thumbnail layout — small image plus title, body, and one action.",
      tags: ["layout", "thumbnail", "adaptive-cards"],
      theme: themes.acPattern,
      slides: [
        thumbnailLayoutSlide(themes.acPattern),
        whenToUseSlide({
          id: "thumbnail-when",
          title: "Thumbnail — when to use",
          when: [
            "Status messages, notifications, or PR updates",
            "Feeds where many cards stack together",
            "Narrow and very narrow breakpoints",
          ],
          dont: [
            "The image needs to convey detail (use Hero instead)",
            "More than three lines of body copy are required",
            "The action requires a multi-step form",
          ],
          theme: themes.acPattern,
        }),
        anatomySlide({
          id: "thumbnail-anatomy",
          title: "Thumbnail — anatomy",
          parts: [
            { label: "Thumbnail", detail: "Small image, square or 4:3, on the leading side" },
            { label: "Title", detail: "Subheading text with strong weight and accent color" },
            { label: "Body", detail: "One or two short lines of supporting text" },
            { label: "Action", detail: "Single button anchored to the trailing side" },
          ],
          theme: themes.acPattern,
        }),
      ],
    }),
  },
  {
    id: "ac-layout-list",
    category: "Card layouts",
    title: "List layout",
    summary: "Pick one item from a scannable list of records.",
    tags: ["adaptive cards", "layout", "list"],
    deck: deck({
      title: "List card layout",
      description: "Adaptive Cards list layout — each row carries an avatar, title, subtitle, and meta.",
      tags: ["layout", "list", "adaptive-cards"],
      theme: themes.acPattern,
      slides: [
        listLayoutSlide(themes.acPattern),
        whenToUseSlide({
          id: "list-when",
          title: "List — when to use",
          when: [
            "Users need to choose one record from many (tasks, tickets, contacts)",
            "Each row has a consistent shape (avatar + title + meta)",
            "Total list fits within a single card without scrolling",
          ],
          dont: [
            "Rows have wildly different shapes or lengths",
            "More than 7 to 10 rows are needed (link to a full view instead)",
            "Each row has multiple competing actions",
          ],
          theme: themes.acPattern,
        }),
        anatomySlide({
          id: "list-anatomy",
          title: "List — anatomy",
          parts: [
            { label: "Avatar", detail: "Square or circular image at the leading edge" },
            { label: "Title and subtitle", detail: "Subheading + caption stacked vertically" },
            { label: "Meta", detail: "Right-aligned status, time, or count" },
            { label: "Selection target", detail: "Tapping a row should fire one consistent action" },
          ],
          theme: themes.acPattern,
        }),
      ],
    }),
  },
  {
    id: "ac-layout-digest",
    category: "Card layouts",
    title: "Digest layout",
    summary: "News round-up — three article cards in one glance.",
    tags: ["adaptive cards", "layout", "digest"],
    deck: deck({
      title: "Digest card layout",
      description: "Adaptive Cards digest layout — three or four article cards aligned in a single row.",
      tags: ["layout", "digest", "adaptive-cards"],
      theme: themes.acPattern,
      slides: [
        digestLayoutSlide(themes.acPattern),
        whenToUseSlide({
          id: "digest-when",
          title: "Digest — when to use",
          when: [
            "Weekly news round-ups, blog roll-ups, or release-note summaries",
            "Each item shares the same shape (image + title + summary)",
            "Card width is wide enough for three or four columns",
          ],
          dont: [
            "Items vary in length and require different layouts",
            "Articles need full body content (link out instead)",
            "Card collapses to a single column where Hero would be cleaner",
          ],
          theme: themes.acPattern,
        }),
        anatomySlide({
          id: "digest-anatomy",
          title: "Digest — anatomy",
          parts: [
            { label: "Article image", detail: "16:9 or 1:1 thumbnail per article" },
            { label: "Title", detail: "Subheading bolder, accent color, two lines max" },
            { label: "Summary", detail: "Caption-sized supporting copy, two to three lines" },
            { label: "Card link", detail: "Whole article tile is the click target" },
          ],
          theme: themes.acPattern,
        }),
      ],
    }),
  },
  {
    id: "ac-layout-media",
    category: "Card layouts",
    title: "Video and media layout",
    summary: "Combine a video or audio element with text and one clear action.",
    tags: ["adaptive cards", "layout", "media"],
    deck: deck({
      title: "Video and media card layout",
      description: "Adaptive Cards media layout — video player with poster, supporting copy, and one action.",
      tags: ["layout", "media", "video", "adaptive-cards"],
      theme: themes.acPattern,
      slides: [
        mediaLayoutSlide(themes.acPattern),
        whenToUseSlide({
          id: "media-when",
          title: "Media — when to use",
          when: [
            "A short video or audio clip is the most efficient way to convey the message",
            "A poster image keeps the card useful even before playback starts",
            "The host (Teams, Outlook, custom) supports the Media element",
          ],
          dont: [
            "The clip is longer than three minutes (link to the full asset instead)",
            "The video has no transcript or captions for accessibility",
            "The poster has insufficient contrast for any overlaid text",
          ],
          theme: themes.acPattern,
        }),
        anatomySlide({
          id: "media-anatomy",
          title: "Media — anatomy",
          parts: [
            { label: "Media element", detail: "Tile.Media with at least one source URL and a poster image" },
            { label: "Aspect ratio", detail: "16:9 by default; switch to 1:1 for portrait-friendly clips" },
            { label: "Caption", detail: "One or two lines that summarize what the user will hear or see" },
            { label: "Action", detail: "Optional transcript link or save-for-later button" },
          ],
          theme: themes.acPattern,
        }),
      ],
    }),
  },
  {
    id: "ac-layout-form",
    category: "Card layouts",
    title: "Form layout",
    summary: "Collect a small set of structured inputs to file a task or ticket.",
    tags: ["adaptive cards", "layout", "form"],
    deck: deck({
      title: "Form card layout",
      description: "Adaptive Cards form layout — labeled inputs plus submit and cancel actions.",
      tags: ["layout", "form", "adaptive-cards"],
      theme: themes.acPattern,
      slides: [
        formLayoutSlide(themes.acPattern),
        whenToUseSlide({
          id: "form-when",
          title: "Form — when to use",
          when: [
            "Three to six inputs that map to a clear back-end record",
            "Field labels and validation messages stay short",
            "The card can submit to a connector, Power Automate flow, or webhook",
          ],
          dont: [
            "More than seven inputs (escalate to a task module or full app)",
            "Inputs depend on each other in a wizard pattern",
            "File uploads or rich text are required (host support is uneven)",
          ],
          theme: themes.acPattern,
        }),
        anatomySlide({
          id: "form-anatomy",
          title: "Form — anatomy",
          parts: [
            { label: "Field label", detail: "Caption-sized accent text directly above each input" },
            { label: "Input mock", detail: "Container styled emphasis with placeholder body text" },
            { label: "Layout", detail: "Slide-level grid keeps fields aligned across breakpoints" },
            { label: "Actions", detail: "Primary submit button accent; cancel stays neutral" },
          ],
          theme: themes.acPattern,
        }),
      ],
    }),
  },
  {
    id: "ac-layout-quick-input",
    category: "Card layouts",
    title: "Quick input layout",
    summary: "One prompt, one input, one send — for in-the-moment replies.",
    tags: ["adaptive cards", "layout", "quick-input"],
    deck: deck({
      title: "Quick input card layout",
      description: "Adaptive Cards quick input layout — single-line response with a send action.",
      tags: ["layout", "quick-input", "adaptive-cards"],
      theme: themes.acPattern,
      slides: [
        quickInputLayoutSlide(themes.acPattern),
        whenToUseSlide({
          id: "quick-input-when",
          title: "Quick input — when to use",
          when: [
            "A single short response is enough (rating, comment, RSVP)",
            "The interaction sits inline in a chat or notification thread",
            "The send action posts back to a bot or webhook",
          ],
          dont: [
            "Multiple fields are needed (use Form instead)",
            "The reply requires structured choices (use a list or chiclets)",
            "The user must upload a file or attach media",
          ],
          theme: themes.acPattern,
        }),
        anatomySlide({
          id: "quick-input-anatomy",
          title: "Quick input — anatomy",
          parts: [
            { label: "Prompt", detail: "Subheading text that frames the question" },
            { label: "Input row", detail: "Mock input spans most of the row; send action takes the trailing column" },
            { label: "Send action", detail: "Accent-styled button labeled with the action verb" },
            { label: "Confirmation", detail: "Replace the input area on submit with a friendly thank-you state" },
          ],
          theme: themes.acPattern,
        }),
      ],
    }),
  },
  {
    id: "ac-layout-expandable",
    category: "Card layouts",
    title: "Expandable layout",
    summary: "Lead with the summary; reveal extra detail only on demand.",
    tags: ["adaptive cards", "layout", "expandable", "progressive disclosure"],
    deck: deck({
      title: "Expandable card layout",
      description: "Adaptive Cards expandable layout — summary plus a show-more region for additional context.",
      tags: ["layout", "expandable", "progressive-disclosure", "adaptive-cards"],
      theme: themes.acPattern,
      slides: [
        expandableLayoutSlide(themes.acPattern),
        whenToUseSlide({
          id: "expandable-when",
          title: "Expandable — when to use",
          when: [
            "Most users only need the summary, but a few need the full detail",
            "Detail data is read-only (logs, coverage stats, change lists)",
            "The card can keep both states without re-fetching data",
          ],
          dont: [
            "Detail must change frequently (link to a live view instead)",
            "Hidden content is critical for the action above",
            "Hidden region exceeds the card height when expanded",
          ],
          theme: themes.acPattern,
        }),
        anatomySlide({
          id: "expandable-anatomy",
          title: "Expandable — anatomy",
          parts: [
            { label: "Summary", detail: "One subheading plus one body line that captures the verdict" },
            { label: "Toggle action", detail: "Show more / show less button toggles the detail region" },
            { label: "Detail region", detail: "Container with paired caption labels and body values" },
            { label: "Default state", detail: "Card always opens collapsed; user choice is not persisted" },
          ],
          theme: themes.acPattern,
        }),
      ],
    }),
  },
];

export function findTemplateDeck(id) {
  return templateDecks.find((template) => template.id === id) ?? templateDecks[0];
}
