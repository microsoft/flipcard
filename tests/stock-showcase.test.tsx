import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useStockQuoteAssets } from '../apps/showcase/src/use-stock-quote';
import { FlipCard } from '../packages/react/src/FlipCard';
import type { FlipCardAssetEntry } from '../packages/vanilla/src/types';
import stockCard from '../packages/vanilla/src/adaptive-card-samples/StockUpdate.json';
import activityCard from '../packages/vanilla/src/adaptive-card-samples/ActivityUpdate.json';

const fixture = {
  symbol: 'MSFT',
  currency: 'USD',
  price: 42,
  asOf: '2026-11-03T21:00:00Z',
  provider: 'Test fixture',
  delay: 'end-of-day',
};
const asset: FlipCardAssetEntry = {
  id: 'adaptive-card-stock-update',
  category: 'pattern',
  title: 'Stock update',
  summary: 'Test',
  theme: 'light',
  manifest: {
    version: '0.1.0',
    id: 'adaptive-card-stock-update',
    title: 'Stock update',
    design: { kind: 'pattern', headline: 'Stock update' },
    schema: stockCard,
    metadata: { category: 'pattern', theme: 'light', tags: [] },
  },
};
const assets = [asset];
function Tile({ endpoint }: { endpoint?: string }) {
  const hydrated = useStockQuoteAssets(assets, endpoint);
  return <FlipCard asset={hydrated[0]!} />;
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('renders fetched prices in the actual Adaptive Card surface and pauses hidden/offline', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-03T22:00:00Z'));
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockImplementation(async () => new Response(JSON.stringify(fixture)));
  vi.stubGlobal('fetch', fetchMock);
  const { unmount } = render(<Tile endpoint="https://quotes.example/msft.json" />);
  await act(() => vi.advanceTimersByTimeAsync(0));
  expect(screen.getAllByText('42.00 USD').length).toBeGreaterThan(0);
  expect(screen.getAllByText(`Market timestamp: ${fixture.asOf}`).length).toBeGreaterThan(0);
  expect(document.querySelector('.fc-asset-adaptive-card')?.textContent).toContain('Test fixture');

  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  await act(() => vi.advanceTimersByTimeAsync(300_000));
  expect(fetchMock).toHaveBeenCalledTimes(1);
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  await act(() => vi.advanceTimersByTimeAsync(0));
  expect(fetchMock).toHaveBeenCalledTimes(2);
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  act(() => window.dispatchEvent(new Event('offline')));
  await act(() => vi.advanceTimersByTimeAsync(300_000));
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(screen.getAllByText(/Offline — refresh paused/).length).toBeGreaterThan(0);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
  expect(asset.manifest.schema).toEqual(stockCard);
});

it('leaves the default card explicitly unconfigured with no fake market price', () => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  render(<Tile endpoint="" />);
  expect(screen.getAllByText(/Not configured/).length).toBeGreaterThan(0);
  expect(fetchMock).not.toHaveBeenCalled();
  expect(JSON.stringify(stockCard)).not.toMatch(/128\.90|62\.30|2019|live quote/i);
});

it('uses the supplied Daryl identity and Flipcard links without invented task dates', () => {
  const json = JSON.stringify(activityCard);
  expect(json).toContain('Publish Flipcard Schema');
  expect(json).toContain('Daryl Yourk');
  expect(json).toContain('https://github.com/dayour.png');
  expect(json).toContain('https://microsoft.github.io/flipcard/schema/v0.1.json');
  expect(json).not.toMatch(/Matt Hidinger|2017|dueDate|Due date|completed/i);
});
