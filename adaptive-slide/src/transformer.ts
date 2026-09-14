import type {
  Deck, Slide, Tile, Theme, LayoutConfig, Background,
  TextTile, ImageTile, CodeTile, ChartTile, MediaTile, ContainerTile,
  GridPosition, FreeformPosition,
} from "./types/index.js";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function md(text: string): string {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/\n- /g, "\n• ")
    .replace(/\n/g, "<br>");
}

// --- Spacing / layout helpers ---

const SPACING_MAP: Record<string, string> = {
  none: "0", small: "4px", default: "8px", medium: "12px",
  large: "16px", extraLarge: "24px", padding: "16px",
};

const GAP_MAP: Record<string, string> = {
  none: "0", small: "4px", default: "8px", large: "16px",
};

const PADDING_MAP: Record<string, string> = {
  none: "0", small: "8px", default: "16px", large: "32px",
};

function gridStyle(pos: GridPosition): string {
  const parts: string[] = [];
  if (pos.column) parts.push(`grid-column: ${pos.column} / span ${pos.columnSpan ?? 1}`);
  if (pos.row) parts.push(`grid-row: ${pos.row} / span ${pos.rowSpan ?? 1}`);
  return parts.join("; ");
}

function freeformStyle(pos: FreeformPosition): string {
  return [
    "position: absolute",
    `left: ${pos.x}%`,
    `top: ${pos.y}%`,
    `width: ${pos.width}%`,
    `height: ${pos.height}%`,
    pos.rotation ? `transform: rotate(${pos.rotation}deg)` : "",
    pos.zIndex ? `z-index: ${pos.zIndex}` : "",
  ].filter(Boolean).join("; ");
}

// --- Semantic color map ---

function colorValue(color: string | undefined, theme?: Theme): string {
  const map: Record<string, string> = {
    default: theme?.darkMode ? "#e0e0e0" : "#333333",
    dark: "#1a1a1a",
    light: "#ffffff",
    accent: theme?.accentColor ?? "#0078d4",
    good: "#107c10",
    warning: "#ff8c00",
    attention: "#d13438",
  };
  return map[color ?? "default"] ?? map.default;
}

const SIZE_MAP: Record<string, string> = {
  small: "0.85rem", default: "1rem", medium: "1.25rem", large: "1.75rem", extraLarge: "2.5rem",
};

const WEIGHT_MAP: Record<string, string> = {
  lighter: "300", default: "400", bolder: "700",
};

// --- Tile renderers ---

function renderTextTile(tile: TextTile, theme?: Theme): string {
  const fontSize = SIZE_MAP[tile.size ?? "default"];
  const fontWeight = tile.style === "heading" ? "700"
    : tile.style === "subheading" ? "600"
    : WEIGHT_MAP[tile.weight ?? "default"];
  const textSize = tile.style === "heading" ? SIZE_MAP[tile.size ?? "large"]
    : tile.style === "subheading" ? SIZE_MAP[tile.size ?? "medium"]
    : tile.style === "caption" ? SIZE_MAP.small
    : fontSize;
  const color = colorValue(tile.color, theme);
  const align = tile.horizontalAlignment ?? "left";
  const font = tile.fontType === "monospace" ? "monospace" : "inherit";
  const maxLines = tile.maxLines
    ? `overflow:hidden; display:-webkit-box; -webkit-line-clamp:${tile.maxLines}; -webkit-box-orient:vertical;`
    : "";
  const quoteStyle = tile.style === "quote"
    ? "border-left:4px solid rgba(128,128,128,0.4); padding-left:12px; font-style:italic;"
    : "";

  return `<div class="tile tile-text" style="font-size:${textSize}; font-weight:${fontWeight}; color:${color}; text-align:${align}; font-family:${font}; ${maxLines} ${quoteStyle}">${md(tile.text)}</div>`;
}

function renderImageTile(tile: ImageTile, _theme?: Theme): string {
  const align = tile.horizontalAlignment ?? "center";
  const sizeMap: Record<string, string> = {
    auto: "max-width:100%", stretch: "width:100%", small: "max-width:120px",
    medium: "max-width:300px", large: "max-width:500px",
  };
  const sizeStyle = sizeMap[tile.size ?? "auto"];
  const bgStyle = tile.backgroundColor ? `background:${tile.backgroundColor};` : "";
  const caption = tile.caption ? `<figcaption style="text-align:center; font-size:0.85rem; color:#666; margin-top:4px;">${esc(tile.caption)}</figcaption>` : "";

  return `<figure class="tile tile-image" style="text-align:${align}; margin:0; ${bgStyle}">
    <img src="${esc(tile.url)}" alt="${esc(tile.altText ?? "")}" style="${sizeStyle}; height:auto; border-radius:4px;" />
    ${caption}
  </figure>`;
}

function renderCodeTile(tile: CodeTile, theme?: Theme): string {
  const isDark = tile.theme === "dark" || (tile.theme !== "light" && theme?.darkMode);
  const bg = isDark ? "#1e1e1e" : "#f5f5f5";
  const fg = isDark ? "#d4d4d4" : "#333";
  const headerHtml = tile.title
    ? `<div style="padding:6px 12px; background:${isDark ? "#2d2d2d" : "#e8e8e8"}; font-size:0.8rem; color:${isDark ? "#aaa" : "#666"}; border-radius:6px 6px 0 0;">${esc(tile.title)}${tile.language ? ` <span style="opacity:0.6">· ${esc(tile.language)}</span>` : ""}</div>`
    : "";
  const lines = tile.code.split("\n");
  const startLine = tile.startLineNumber ?? 1;
  const highlightSet = new Set(tile.highlightLines ?? []);

  const codeLines = lines.map((line, i) => {
    const lineNum = startLine + i;
    const hl = highlightSet.has(lineNum) ? `background:${isDark ? "rgba(255,255,0,0.1)" : "rgba(255,255,0,0.2)"};` : "";
    const numHtml = (tile.showLineNumbers !== false)
      ? `<span style="color:${isDark ? "#666" : "#999"}; user-select:none; width:3em; display:inline-block; text-align:right; margin-right:12px;">${lineNum}</span>`
      : "";
    return `<div style="${hl} padding:0 12px;">${numHtml}${esc(line) || " "}</div>`;
  }).join("");

  const maxHeightStyle = tile.maxHeight ? `max-height:${tile.maxHeight}; overflow:auto;` : "";

  return `<div class="tile tile-code">
    ${headerHtml}
    <pre style="margin:0; padding:8px 0; background:${bg}; color:${fg}; font-family:'Fira Code',Consolas,monospace; font-size:0.85rem; border-radius:${tile.title ? "0 0 6px 6px" : "6px"}; overflow-x:auto; ${maxHeightStyle}">${codeLines}</pre>
  </div>`;
}

function renderChartTile(tile: ChartTile, theme?: Theme): string {
  const colors = tile.colors ?? ["#0078d4", "#50e6ff", "#ff8c00", "#107c10", "#d13438", "#5c2d91"];
  const maxVal = Math.max(...tile.data.datasets.flatMap((d) => d.values), 1);
  const titleHtml = tile.title ? `<div style="font-weight:600; margin-bottom:8px;">${esc(tile.title)}</div>` : "";

  if (tile.chartType === "bar") {
    const barGroups = tile.data.labels.map((label, i) => {
      const bars = tile.data.datasets.map((ds, di) => {
        const val = ds.values[i] ?? 0;
        const pct = (val / maxVal) * 100;
        const color = ds.color ?? colors[di % colors.length];
        return `<div style="height:${pct}%; background:${color}; flex:1; border-radius:3px 3px 0 0; min-width:16px;" title="${ds.label ?? ""}: ${val}"></div>`;
      }).join("");
      return `<div style="display:flex; flex-direction:column; align-items:stretch; gap:2px; flex:1;">
        <div style="display:flex; gap:2px; align-items:flex-end; height:120px;">${bars}</div>
        <div style="text-align:center; font-size:0.75rem; color:#888; margin-top:4px;">${esc(label)}</div>
      </div>`;
    }).join("");

    const legendHtml = tile.showLegend !== false ? renderLegend(tile.data.datasets, colors) : "";
    return `<div class="tile tile-chart">${titleHtml}<div style="display:flex; gap:8px; align-items:flex-end;">${barGroups}</div>${legendHtml}</div>`;
  }

  if (tile.chartType === "pie" || tile.chartType === "donut") {
    const total = tile.data.datasets[0]?.values.reduce((a, b) => a + b, 0) ?? 1;
    let cumAngle = 0;
    const slices = tile.data.datasets[0]?.values.map((val, i) => {
      const pct = val / total;
      const startAngle = cumAngle * 360;
      cumAngle += pct;
      const endAngle = cumAngle * 360;
      const color = tile.data.datasets[0]?.color ?? colors[i % colors.length];
      // Use conic-gradient segments
      return `${color} ${startAngle}deg ${endAngle}deg`;
    }) ?? [];

    const hole = tile.chartType === "donut" ? ", radial-gradient(circle, white 40%, transparent 40%)" : "";
    const bg = `conic-gradient(${slices.join(", ")})${hole}`;
    const legendHtml = tile.showLegend !== false ? renderPieLegend(tile.data.labels, colors) : "";

    return `<div class="tile tile-chart">${titleHtml}
      <div style="width:150px; height:150px; border-radius:50%; background:${bg}; margin:0 auto;"></div>
      ${legendHtml}</div>`;
  }

  // Fallback: simple data table for other chart types
  const rows = tile.data.labels.map((label, i) => {
    const vals = tile.data.datasets.map((ds) => ds.values[i] ?? 0).join("</td><td>");
    return `<tr><td>${esc(label)}</td><td>${vals}</td></tr>`;
  }).join("");
  const headers = tile.data.datasets.map((ds) => `<th>${esc(ds.label ?? "")}</th>`).join("");
  return `<div class="tile tile-chart">${titleHtml}<table style="width:100%; border-collapse:collapse; font-size:0.85rem;"><tr><th></th>${headers}</tr>${rows}</table></div>`;
}

function renderLegend(datasets: { label?: string; color?: string }[], colors: string[]): string {
  const items = datasets.map((ds, i) =>
    `<span style="display:inline-flex; align-items:center; gap:4px; margin-right:12px;">
      <span style="width:10px; height:10px; background:${ds.color ?? colors[i % colors.length]}; border-radius:2px;"></span>
      <span style="font-size:0.75rem;">${esc(ds.label ?? "")}</span>
    </span>`
  ).join("");
  return `<div style="margin-top:8px;">${items}</div>`;
}

function renderPieLegend(labels: string[], colors: string[]): string {
  const items = labels.map((label, i) =>
    `<span style="display:inline-flex; align-items:center; gap:4px; margin-right:12px;">
      <span style="width:10px; height:10px; background:${colors[i % colors.length]}; border-radius:2px;"></span>
      <span style="font-size:0.75rem;">${esc(label)}</span>
    </span>`
  ).join("");
  return `<div style="margin-top:8px; text-align:center;">${items}</div>`;
}

function renderMediaTile(tile: MediaTile): string {
  const src = tile.sources[0];
  if (!src) return `<div class="tile tile-media" style="color:#999;">No media source</div>`;

  const isAudio = src.mimeType?.startsWith("audio/") ?? false;
  const attrs = [
    tile.autoplay ? "autoplay" : "",
    tile.loop ? "loop" : "",
    tile.muted ? "muted" : "",
    "controls",
  ].filter(Boolean).join(" ");

  if (isAudio) {
    return `<div class="tile tile-media"><audio ${attrs}>${tile.sources.map((s) => `<source src="${esc(s.url)}"${s.mimeType ? ` type="${esc(s.mimeType)}"` : ""} />`).join("")}</audio></div>`;
  }

  const poster = tile.poster ? `poster="${esc(tile.poster)}"` : "";
  return `<div class="tile tile-media" style="aspect-ratio:${tile.aspectRatio ?? "16/9"};">
    <video ${attrs} ${poster} style="width:100%; height:100%; object-fit:contain; border-radius:4px;">
      ${tile.sources.map((s) => `<source src="${esc(s.url)}"${s.mimeType ? ` type="${esc(s.mimeType)}"` : ""} />`).join("")}
    </video>
  </div>`;
}

function renderContainerTile(tile: ContainerTile, theme?: Theme): string {
  const styleMap: Record<string, string> = {
    default: "", emphasis: "background:rgba(128,128,128,0.08);",
    good: "background:rgba(16,124,16,0.08); border-left:3px solid #107c10;",
    attention: "background:rgba(209,52,56,0.08); border-left:3px solid #d13438;",
    warning: "background:rgba(255,140,0,0.08); border-left:3px solid #ff8c00;",
    accent: `background:rgba(0,120,212,0.08); border-left:3px solid ${theme?.accentColor ?? "#0078d4"};`,
  };
  const containerStyle = styleMap[tile.style ?? "default"];
  const layoutStyle = tile.layout === "row"
    ? "display:flex; gap:16px;"
    : tile.layout === "wrap"
    ? "display:flex; flex-wrap:wrap; gap:16px;"
    : "display:flex; flex-direction:column; gap:8px;";
  const valign = tile.verticalContentAlignment ?? "top";
  const alignMap: Record<string, string> = { top: "flex-start", center: "center", bottom: "flex-end" };
  const bgImg = tile.backgroundImage
    ? `background-image:url('${esc(tile.backgroundImage.url)}'); background-size:${tile.backgroundImage.fillMode ?? "cover"}; background-position:center;`
    : "";
  const minH = tile.minHeight ? `min-height:${tile.minHeight};` : "";

  const childrenHtml = tile.items.map((t) => renderTile(t, theme)).join("");

  return `<div class="tile tile-container" style="padding:12px; border-radius:6px; ${containerStyle} ${layoutStyle} align-items:${alignMap[valign]}; ${bgImg} ${minH}">
    ${childrenHtml}
  </div>`;
}

// --- Main render functions ---

export function renderTile(tile: Tile, theme?: Theme): string {
  if (tile.isVisible === false) return "";

  const spacingStyle = tile.spacing ? `margin-top:${SPACING_MAP[tile.spacing] ?? "8px"};` : "";
  const separator = tile.separator ? `<hr style="border:none; border-top:1px solid rgba(128,128,128,0.2); margin:8px 0;" />` : "";
  const posStyle = tile.gridPosition
    ? gridStyle(tile.gridPosition)
    : tile.freeformPosition
    ? freeformStyle(tile.freeformPosition)
    : "";
  const wrapStyle = [spacingStyle, posStyle].filter(Boolean).join(" ");

  let inner: string;
  switch (tile.type) {
    case "Tile.Text":      inner = renderTextTile(tile, theme); break;
    case "Tile.Image":     inner = renderImageTile(tile, theme); break;
    case "Tile.Code":      inner = renderCodeTile(tile, theme); break;
    case "Tile.Chart":     inner = renderChartTile(tile, theme); break;
    case "Tile.Media":     inner = renderMediaTile(tile); break;
    case "Tile.Container": inner = renderContainerTile(tile, theme); break;
    default:               inner = `<div class="tile tile-unknown" style="color:#999;">Unknown tile type: ${esc((tile as Tile).type)}</div>`;
  }

  return `${separator}<div style="${wrapStyle}">${inner}</div>`;
}

export function renderBackground(bg?: Background): string {
  if (!bg) return "";
  if (bg.gradient) {
    const { type, colors, angle } = bg.gradient;
    return type === "radial"
      ? `background: radial-gradient(${colors.join(", ")});`
      : `background: linear-gradient(${angle ?? 180}deg, ${colors.join(", ")});`;
  }
  if (bg.image) {
    return `background: url('${esc(bg.image.url)}') center/${bg.image.fillMode ?? "cover"} no-repeat; ${bg.image.opacity != null ? `opacity:${bg.image.opacity};` : ""}`;
  }
  if (bg.color) return `background: ${bg.color};`;
  return "";
}

export function renderSlide(slide: Slide, theme?: Theme, defaults?: Deck["defaults"]): string {
  const layout = slide.layout ?? { mode: defaults?.layout ?? "stack" };
  const padding = PADDING_MAP[defaults?.padding ?? "default"];
  const bgStyle = renderBackground(slide.background);

  let layoutStyle: string;
  switch (layout.mode) {
    case "grid":
      layoutStyle = `display:grid; grid-template-columns:repeat(${layout.columns ?? 2}, 1fr); gap:${GAP_MAP[layout.gap ?? "default"]};`;
      break;
    case "freeform":
      layoutStyle = "position:relative; width:100%; height:100%;";
      break;
    default:
      layoutStyle = `display:flex; flex-direction:column; gap:${GAP_MAP[layout.gap ?? "default"]};`;
  }

  const halign = layout.horizontalAlignment ?? "stretch";
  const valign = layout.verticalAlignment ?? "top";
  const hMap: Record<string, string> = { left: "flex-start", center: "center", right: "flex-end", stretch: "stretch" };
  const vMap: Record<string, string> = { top: "flex-start", center: "center", bottom: "flex-end" };
  const alignStyle = layout.mode === "stack"
    ? `align-items:${hMap[halign]}; justify-content:${vMap[valign]};`
    : "";

  const tilesHtml = slide.body.map((t) => renderTile(t, theme)).join("\n");

  return `<div class="slide" style="${bgStyle} padding:${padding}; ${layoutStyle} ${alignStyle} min-height:100%; box-sizing:border-box;">
    ${tilesHtml}
  </div>`;
}

export function renderDeck(deck: Deck): string {
  return deck.slides.map((slide) => renderSlide(slide, deck.theme, deck.defaults)).join("\n");
}
