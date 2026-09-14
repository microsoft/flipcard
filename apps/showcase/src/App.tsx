import { useMemo, useState } from 'react';
import {
  flipCardAssetLibrary,
  flipCardCategoryLabels,
  groupFlipCardAssetsByCategory,
  type FlipCardAssetCategory,
} from '@microsoft/flipcard';
import { FlipCardCatalog } from '@microsoft/flipcard-react';

type ThemeId = 'light' | 'dark' | 'midnight-sapphire';

const THEMES: Array<{ id: ThemeId; label: string }> = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'midnight-sapphire', label: 'Midnight Sapphire' },
];

export function App() {
  const [theme, setTheme] = useState<ThemeId>('light');
  const [activeCategory, setActiveCategory] = useState<FlipCardAssetCategory | 'all'>('all');

  const grouped = useMemo(() => groupFlipCardAssetsByCategory(flipCardAssetLibrary), []);
  const categoryEntries = useMemo(
    () =>
      (Object.entries(grouped) as Array<[FlipCardAssetCategory, (typeof grouped)[FlipCardAssetCategory]]>).filter(
        ([, assets]) => assets.length > 0,
      ),
    [grouped],
  );

  const visibleAssets = useMemo(
    () =>
      activeCategory === 'all'
        ? flipCardAssetLibrary
        : flipCardAssetLibrary.filter((asset) => asset.category === activeCategory),
    [activeCategory],
  );

  return (
    <main className={`flipdeck-shell fc-theme-${theme}`}>
      <section className="flipdeck-hero">
        <div className="flipdeck-copy">
          <p className="flipdeck-kicker">FlipDeck</p>
          <h1>The interactive deck for the FlipCard manifest library.</h1>
          <p className="flipdeck-description">
            Browse every seeded FlipCard asset across KPI, profile, code, timeline, FAQ, security, media, and metric
            scenarios. Toggle themes, filter by category, and flip any card to inspect the manifest that powers it.
          </p>
          <div className="flipdeck-controls" role="group" aria-label="Theme">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`flipdeck-control${theme === t.id ? ' is-active' : ''}`}
                onClick={() => setTheme(t.id)}
                aria-pressed={theme === t.id}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flipdeck-summary-grid">
          <article className="flipdeck-summary-card">
            <span className="flipdeck-summary-label">Seeded assets</span>
            <strong>{flipCardAssetLibrary.length}</strong>
            <p>Cross-category examples ready for demos, docs, and prototyping.</p>
          </article>
          <article className="flipdeck-summary-card">
            <span className="flipdeck-summary-label">Categories</span>
            <strong>{categoryEntries.length}</strong>
            <p>Balanced coverage across operational, business, and technical use cases.</p>
          </article>
        </div>
      </section>

      <section className="flipdeck-category-strip" aria-label="Asset categories">
        <button
          type="button"
          className={`flipdeck-category-chip${activeCategory === 'all' ? ' is-active' : ''}`}
          onClick={() => setActiveCategory('all')}
          aria-pressed={activeCategory === 'all'}
        >
          <span>All</span>
          <strong>{flipCardAssetLibrary.length}</strong>
        </button>
        {categoryEntries.map(([category, assets]) => (
          <button
            key={category}
            type="button"
            className={`flipdeck-category-chip${activeCategory === category ? ' is-active' : ''}`}
            onClick={() => setActiveCategory(category)}
            aria-pressed={activeCategory === category}
          >
            <span>{flipCardCategoryLabels[category]}</span>
            <strong>{assets.length}</strong>
          </button>
        ))}
      </section>

      <FlipCardCatalog assets={visibleAssets} />
    </main>
  );
}
