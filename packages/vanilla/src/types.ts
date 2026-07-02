import type { FlipCardManifest } from '@microsoft/flipcard-core';

export type FlipCardAssetCategory =
  | 'kpi'
  | 'status'
  | 'profile'
  | 'code'
  | 'timeline'
  | 'faq'
  | 'security'
  | 'media'
  | 'metric'
  | 'chart'
  | 'pattern'
  | 'tile'
  | 'portfolio'
  | 'slide';

export type FlipCardAssetTheme = 'light' | 'dark' | 'midnight-sapphire';

export type FlipCardAssetTone = 'positive' | 'warning' | 'critical' | 'neutral';

export interface FlipCardDesignStat {
  label: string;
  value: string;
  trend?: string;
  tone?: FlipCardAssetTone;
}

export interface FlipCardDesignItem {
  label: string;
  value: string;
  tone?: FlipCardAssetTone;
}

export interface FlipCardDesignPerson {
  name: string;
  role: string;
  team?: string;
  location?: string;
}

export interface FlipCardDesignCode {
  language: string;
  snippet: string;
}

export interface FlipCardDesignTimelineItem {
  phase: string;
  date: string;
  status: string;
}

export interface FlipCardDesignFaqItem {
  question: string;
  answer: string;
}

export interface FlipCardDesignMedia {
  format: string;
  duration: string;
  caption: string;
}

export interface FlipCardAssetDesign {
  kind: FlipCardAssetCategory;
  eyebrow?: string;
  headline: string;
  summary?: string;
  badge?: string;
  stats?: ReadonlyArray<FlipCardDesignStat>;
  items?: ReadonlyArray<FlipCardDesignItem>;
  bullets?: ReadonlyArray<string>;
  person?: FlipCardDesignPerson;
  code?: FlipCardDesignCode;
  timeline?: ReadonlyArray<FlipCardDesignTimelineItem>;
  faq?: ReadonlyArray<FlipCardDesignFaqItem>;
  media?: FlipCardDesignMedia;
  quote?: string;
  adaptiveCard?: Record<string, unknown>;
  theme?: Record<string, unknown>;
}

export interface FlipCardAssetManifest extends FlipCardManifest {
  id: string;
  title: string;
  design: FlipCardAssetDesign;
  schema: Record<string, unknown>;
  metadata: {
    category: FlipCardAssetCategory;
    theme: FlipCardAssetTheme;
    tags: string[];
    accent?: string;
    audience?: string;
  };
}

export interface FlipCardAssetEntry {
  id: string;
  category: FlipCardAssetCategory;
  title: string;
  summary: string;
  theme: FlipCardAssetTheme;
  accent?: string;
  manifest: FlipCardAssetManifest;
}

export interface CreateFlipCardElementOptions {
  defaultState?: 'front' | 'back';
  interactive?: boolean;
}