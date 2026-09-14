import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FlipCard } from './FlipCard';

const sampleAsset: import('./types').FlipCardRenderableAsset = {
  id: 'sample',
  category: 'kpi',
  title: 'Sample asset',
  summary: 'A sample summary.',
  theme: 'light',
  manifest: {
    id: 'sample',
    title: 'Sample asset',
    design: {
      kind: 'kpi',
      eyebrow: 'Demo',
      headline: '42 active signals',
      summary: 'Asset front content',
      badge: 'Healthy',
      stats: [{ label: 'Coverage', value: '98%' }],
    },
    schema: { hello: 'world' },
    metadata: { category: 'kpi', theme: 'light', tags: ['demo'] },
  },
};

describe('FlipCard', () => {
  it('renders the front face and flips to manifest content', async () => {
    const user = userEvent.setup();
    render(<FlipCard asset={sampleAsset} />);

    expect(screen.getByText('42 active signals')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /sample asset flip card/i }));
    expect(screen.getByText('Manifest')).toBeTruthy();
    expect(screen.getByText(/"hello": "world"/)).toBeTruthy();
  });

  it('renders manifest schema adaptive cards on the front face', () => {
    render(
      <FlipCard
        asset={{
          ...sampleAsset,
          id: 'adaptive-sample',
          title: 'Adaptive sample',
          summary: 'Adaptive summary',
          manifest: {
            ...sampleAsset.manifest,
            id: 'adaptive-sample',
            title: 'Adaptive sample',
            design: {
              kind: 'pattern',
              headline: 'Fallback headline',
              summary: 'Fallback summary',
            },
            schema: {
              $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
              type: 'AdaptiveCard',
              version: '1.5',
              body: [{ type: 'TextBlock', text: 'Hello from adaptive schema' }],
            },
          },
        }}
      />,
    );

    expect(screen.getByText('Hello from adaptive schema')).toBeTruthy();
    expect(screen.queryByText('Fallback headline')).toBeNull();
  });

  it('renders chart hero and tabbed back face for chart assets', async () => {
    const user = userEvent.setup();
    render(
      <FlipCard
        asset={{
          ...sampleAsset,
          id: 'chart-sample',
          category: 'chart',
          title: 'Basic line chart',
          summary: 'Single-series line with default axis configuration.',
          manifest: {
            ...sampleAsset.manifest,
            id: 'chart-sample',
            title: 'Basic line chart',
            design: {
              kind: 'chart',
              eyebrow: 'Line Charts',
              headline: 'Basic line chart',
              summary: 'Single-series line with default axis configuration.',
              badge: 'Unovis',
            },
            schema: {
              collection: 'Line Charts',
              pathname: 'basic-line-chart',
              demoUrl: 'https://unovis.dev/gallery/basic-line-chart',
              repo: 'https://github.com/f5/unovis',
              frameworks: ['React', 'Angular'],
            },
          },
        }}
      />,
    );

    expect(screen.getByText('Gallery')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /basic line chart flip card/i }));
    expect(screen.getByRole('tab', { name: 'Details' }).getAttribute('aria-selected')).toBe('true');
    await user.click(screen.getByRole('tab', { name: 'Schema' }));
    expect(screen.getByText(/"pathname": "basic-line-chart"/)).toBeTruthy();
  });
});