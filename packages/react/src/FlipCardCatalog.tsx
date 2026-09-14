import { FlipCard } from './FlipCard';
import type { FlipCardAssetCategory, FlipCardCatalogProps } from './types';

const categoryOrder: FlipCardAssetCategory[] = [
  'kpi',
  'status',
  'profile',
  'code',
  'timeline',
  'faq',
  'security',
  'media',
  'metric',
  'chart',
  'pattern',
  'tile',
  'portfolio',
  'slide',
];

const categoryLabels: Record<FlipCardAssetCategory, string> = {
  kpi: 'KPI assets',
  status: 'Status assets',
  profile: 'Profile assets',
  code: 'Code / JSON assets',
  timeline: 'Timeline assets',
  faq: 'FAQ assets',
  security: 'Security assets',
  media: 'Media assets',
  metric: 'Metric assets',
  chart: 'Chart assets',
  pattern: 'Pattern assets',
  tile: 'Tile assets',
  portfolio: 'Portfolio assets',
  slide: 'Adaptive Slide assets',
};

export function FlipCardCatalog({ assets, className }: FlipCardCatalogProps) {
  const grouped = categoryOrder
    .map((category) => ({
      category,
      assets: assets.filter((asset) => asset.category === category),
    }))
    .filter((section) => section.assets.length > 0);

  return (
    <div className={['fc-catalog', className].filter(Boolean).join(' ')}>
      {grouped.map((section) => (
        <section key={section.category} className="fc-catalog-section">
          <header className="fc-catalog-section-header">
            <div>
              <p className="fc-catalog-section-kicker">{section.category.toUpperCase()}</p>
              <h2>{categoryLabels[section.category]}</h2>
            </div>
            <span className="fc-catalog-section-count">{section.assets.length} cards</span>
          </header>
          <div className="fc-catalog-grid">
            {section.assets.map((asset) => (
              <FlipCard key={asset.id} asset={asset} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}