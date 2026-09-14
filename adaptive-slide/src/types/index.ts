// Adaptive Slide type definitions — mirrors the JSON schemas

export interface Deck {
  $schema?: string;
  type: "AdaptiveDeck";
  version: string;
  metadata?: DeckMetadata;
  theme?: Theme;
  defaults?: SlideDefaults;
  slides: Slide[];
}

export interface DeckMetadata {
  title?: string;
  description?: string;
  author?: string;
  created?: string;
  modified?: string;
  tags?: string[];
  language?: string;
  [key: string]: unknown;
}

export interface Theme {
  name?: string;
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  darkMode?: boolean;
  [key: string]: unknown;
}

export interface SlideDefaults {
  layout?: LayoutMode;
  transition?: Transition;
  padding?: Padding;
  [key: string]: unknown;
}

export type LayoutMode = "stack" | "grid" | "freeform";
export type Transition = "none" | "fade" | "slide-left" | "slide-right" | "slide-up" | "zoom";
export type Padding = "none" | "small" | "default" | "large";
export type Spacing = "none" | "small" | "default" | "medium" | "large" | "extraLarge" | "padding";

export interface Slide {
  type: "AdaptiveSlide";
  id?: string;
  title?: string;
  notes?: string;
  layout?: LayoutConfig;
  background?: Background;
  transition?: Transition;
  body: Tile[];
  actions?: Action[];
}

export interface LayoutConfig {
  mode?: LayoutMode;
  columns?: number;
  gap?: "none" | "small" | "default" | "large";
  horizontalAlignment?: "left" | "center" | "right" | "stretch";
  verticalAlignment?: "top" | "center" | "bottom";
}

export interface Background {
  color?: string;
  image?: {
    url: string;
    fillMode?: "cover" | "contain" | "repeat" | "stretch";
    opacity?: number;
  };
  gradient?: {
    type: "linear" | "radial";
    colors: string[];
    angle?: number;
  };
}

export interface Action {
  type: "Action.OpenUrl" | "Action.Submit" | "Action.GoToSlide" | "Action.NextSlide" | "Action.PrevSlide";
  title: string;
  url?: string;
  targetSlideId?: string;
  data?: unknown;
}

// Tile union type
export type Tile = TextTile | ImageTile | CodeTile | ChartTile | MediaTile | ContainerTile;

interface TileBase {
  id?: string;
  isVisible?: boolean;
  spacing?: Spacing;
  separator?: boolean;
  gridPosition?: GridPosition;
  freeformPosition?: FreeformPosition;
}

export interface GridPosition {
  column?: number;
  row?: number;
  columnSpan?: number;
  rowSpan?: number;
}

export interface FreeformPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex?: number;
}

export interface TextTile extends TileBase {
  type: "Tile.Text";
  text: string;
  style?: "heading" | "subheading" | "body" | "caption" | "quote";
  size?: "small" | "default" | "medium" | "large" | "extraLarge";
  weight?: "lighter" | "default" | "bolder";
  color?: "default" | "dark" | "light" | "accent" | "good" | "warning" | "attention";
  horizontalAlignment?: "left" | "center" | "right";
  wrap?: boolean;
  maxLines?: number;
  fontType?: "default" | "monospace";
}

export interface ImageTile extends TileBase {
  type: "Tile.Image";
  url: string;
  altText?: string;
  size?: "auto" | "stretch" | "small" | "medium" | "large";
  horizontalAlignment?: "left" | "center" | "right";
  backgroundColor?: string;
  aspectRatio?: string;
  caption?: string;
}

export interface CodeTile extends TileBase {
  type: "Tile.Code";
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  startLineNumber?: number;
  highlightLines?: number[];
  maxHeight?: string;
  title?: string;
  theme?: "light" | "dark" | "auto";
}

export interface ChartTile extends TileBase {
  type: "Tile.Chart";
  chartType: "bar" | "line" | "pie" | "donut" | "area" | "scatter";
  title?: string;
  data: ChartData;
  showLegend?: boolean;
  showGrid?: boolean;
  colors?: string[];
  aspectRatio?: string;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label?: string;
  values: number[];
  color?: string;
}

export interface MediaTile extends TileBase {
  type: "Tile.Media";
  sources: MediaSource[];
  poster?: string;
  altText?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  aspectRatio?: string;
}

export interface MediaSource {
  url: string;
  mimeType?: string;
}

export interface ContainerTile extends TileBase {
  type: "Tile.Container";
  items: Tile[];
  layout?: "stack" | "row" | "wrap";
  style?: "default" | "emphasis" | "good" | "attention" | "warning" | "accent";
  bleed?: boolean;
  minHeight?: string;
  verticalContentAlignment?: "top" | "center" | "bottom";
  backgroundImage?: {
    url: string;
    fillMode?: "cover" | "contain" | "repeat" | "stretch";
  };
}
