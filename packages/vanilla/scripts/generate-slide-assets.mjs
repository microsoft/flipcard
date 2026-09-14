// Generates packages/vanilla/src/assets-slides.generated.ts from the vendored
// adaptive-slide template decks. Each slide becomes one FlipCardAssetEntry
// whose front face is the AdaptiveCard 1.6 representation produced by the
// upstream transformer (slideToAdaptiveCard).
//
// Run: node packages/vanilla/scripts/generate-slide-assets.mjs

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { templateDecks } from './adaptive-slide/templateDecks.mjs';
import { slideToAdaptiveCard } from './adaptive-slide/adaptiveCardTransformer.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = resolve(__dirname, '..', 'src', 'assets-slides.generated.ts');

const FLIPCARD_SCHEMA_URL = 'https://flipcard.dev/schema/flipcard.schema.json';

const themeForDeck = (deck) => {
  if (deck?.theme?.darkMode === false) return 'light';
  // Adaptive Slide decks are dark-mode by default; map to midnight-sapphire to
  // pair well with FlipCard's existing dark surfaces.
  const accent = (deck?.theme?.accentColor || '').toLowerCase();
  if (accent.startsWith('#f') || accent.startsWith('#e')) return 'dark';
  return 'midnight-sapphire';
};

const summaryFromSlide = (slide, deck) => {
  // Prefer the first Tile.Text body item as a quick summary.
  const body = Array.isArray(slide.body) ? slide.body : [];
  for (const item of body) {
    if (item && typeof item === 'object' && typeof item.text === 'string' && item.text.trim()) {
      return item.text.trim().slice(0, 220);
    }
    if (item && Array.isArray(item.items)) {
      for (const inner of item.items) {
        if (inner && typeof inner.text === 'string' && inner.text.trim()) {
          return inner.text.trim().slice(0, 220);
        }
      }
    }
  }
  return deck.description || `Slide from ${deck.name}.`;
};

const titleForSlide = (slide, deck, index) => {
  if (typeof slide.title === 'string' && slide.title.trim()) return slide.title.trim();
  return `${deck.name} — Slide ${index + 1}`;
};

const tagsForSlide = (slide, deck) => {
  const set = new Set(['adaptive-slide', 'slide']);
  if (deck.category) set.add(String(deck.category).toLowerCase().replace(/\s+/g, '-'));
  for (const t of deck.tags || []) set.add(String(t));
  if (slide.id) set.add(String(slide.id));
  return Array.from(set);
};

const entries = [];

for (const template of templateDecks) {
  const deck = template?.deck;
  if (!deck || !Array.isArray(deck.slides)) continue;
  // Carry template-level metadata into the AdaptiveDeck so we can use it below.
  const enrichedDeck = {
    ...deck,
    id: template.id,
    name: template.title || deck?.metadata?.name || template.id,
    category: template.category || deck?.metadata?.category,
    description: template.summary || deck?.metadata?.description,
    tags: Array.isArray(template.tags) ? template.tags : deck?.metadata?.tags,
  };
  const slides = enrichedDeck.slides;
  slides.forEach((slide, index) => {
    let card;
    try {
      card = slideToAdaptiveCard(slide, enrichedDeck);
    } catch (err) {
      console.warn(`[slide-gen] failed deck=${enrichedDeck.id} slide=${slide?.id ?? index}: ${err.message}`);
      return;
    }

    const id = `slide-${enrichedDeck.id}-${slide.id || `slide-${index + 1}`}`;
    const title = titleForSlide(slide, enrichedDeck, index);
    const summary = summaryFromSlide(slide, enrichedDeck);
    const theme = themeForDeck(enrichedDeck);
    const accent = enrichedDeck?.theme?.accentColor || enrichedDeck?.theme?.primaryColor || '#4f8cff';

    entries.push({
      id,
      category: 'slide',
      title,
      summary,
      theme,
      accent,
      manifest: {
        $schema: FLIPCARD_SCHEMA_URL,
        version: '0.1.0',
        id,
        title,
        design: {
          kind: 'slide',
          eyebrow: `${enrichedDeck.name}${enrichedDeck.category ? ` • ${enrichedDeck.category}` : ''}`,
          headline: title,
          summary,
          badge: 'Adaptive Slide',
          adaptiveCard: card,
          items: [
            { label: 'Deck', value: String(enrichedDeck.name) },
            { label: 'Slide id', value: String(slide.id || `slide-${index + 1}`) },
            { label: 'Layout', value: String(slide?.layout?.mode || 'default') },
          ],
        },
        schema: {
          deckId: enrichedDeck.id,
          slide,
          theme: enrichedDeck.theme,
        },
        workflow: {
          onFlip: 'inspectAdaptiveSlide',
          actions: [
            {
              id: 'open-template',
              type: 'navigate',
              data: { target: `https://darbotlm.github.io/adaptive-slide/templates#${enrichedDeck.id}` },
            },
          ],
        },
        metadata: {
          category: 'slide',
          theme,
          tags: tagsForSlide(slide, enrichedDeck),
          accent,
          audience: enrichedDeck.category || 'Adaptive Slide authors',
        },
      },
    });
  });
}

const header = `// AUTO-GENERATED by packages/vanilla/scripts/generate-slide-assets.mjs.
// Source: https://github.com/DarbotLM/adaptive-slide (templateDecks + slideToAdaptiveCard).
// Do not edit by hand — re-run the generator instead.

import type { FlipCardAssetEntry } from './types';

export const slideFlipCardAssets: readonly FlipCardAssetEntry[] = ${JSON.stringify(entries, null, 2)} as readonly FlipCardAssetEntry[];
`;

writeFileSync(OUTPUT, header, 'utf8');
console.log(`[slide-gen] wrote ${entries.length} slide assets to ${OUTPUT}`);
