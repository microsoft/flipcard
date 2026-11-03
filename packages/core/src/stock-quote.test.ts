import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createStockQuoteClient,
  hydrateStockQuoteCard,
  parseStockQuote,
  STOCK_QUOTE_INTERVAL_MS,
  type StockQuoteState,
} from './stock-quote';

const now = Date.parse('2026-11-03T22:00:00Z');
const fixture = {
  symbol: 'MSFT',
  currency: 'USD',
  price: 42,
  asOf: '2026-11-03T21:00:00Z',
  provider: 'Test fixture',
  delay: 'end-of-day',
};
const response = (data: unknown) =>
  new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
const flush = () => vi.advanceTimersByTimeAsync(0);

afterEach(() => vi.useRealTimers());

describe('stock quote validation', () => {
  it('accepts a source-timestamped quote and explicit no-data', () => {
    expect(parseStockQuote(fixture, now)).toEqual(fixture);
    expect(parseStockQuote(null, now)).toBeNull();
  });

  it.each([
    undefined,
    [],
    {},
    { ...fixture, symbol: 'AAPL' },
    { ...fixture, price: '42' },
    { ...fixture, price: 0 },
    { ...fixture, price: Infinity },
    { ...fixture, currency: 'EUR' },
    { ...fixture, asOf: '2026-11-03' },
    { ...fixture, asOf: '2026-02-30T00:00:00Z' },
    { ...fixture, asOf: '2026-11-05T00:00:00Z' },
    { ...fixture, provider: '<img src=x>' },
    { ...fixture, provider: '[link](https://bad.example)' },
    { ...fixture, delay: 'live' },
    { ...fixture, provider: ' ' },
    { ...fixture, delay: ['delayed'] },
    { ...fixture, high: 1, low: 2 },
    { ...fixture, change: '3' },
  ])('rejects malformed or misleading source data %#', (data) => {
    expect(() => parseStockQuote(data, now)).toThrow();
  });
});

describe('stock quote refresh lifecycle', () => {
  function setup(
    fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response(fixture)),
    endpoint: string | undefined = 'https://quotes.example/msft.json',
  ) {
    vi.useFakeTimers();
    const states: StockQuoteState[] = [];
    const client = createStockQuoteClient({
      endpoint,
      fetch: fetchMock,
      now: () => now,
      onState: (state) => states.push(state),
    });
    return { client, states, fetchMock };
  }

  it('does not fetch an unconfigured endpoint', async () => {
    const { client, states, fetchMock } = setup(undefined, '');
    client.start();
    await flush();
    expect(states.at(-1)?.status).toBe('not-configured');
    expect(fetchMock).not.toHaveBeenCalled();
    client.stop();
  });

  it('fetches immediately, refreshes on schedule, and cleans up', async () => {
    const { client, states, fetchMock } = setup(
      vi.fn<typeof fetch>().mockImplementation(async () => response(fixture)),
    );
    client.start();
    await flush();
    expect(states.map((s) => s.status)).toEqual(['loading', 'ready']);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://quotes.example/msft.json',
      expect.objectContaining({
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        cache: 'no-store',
        signal: expect.any(AbortSignal),
      }),
    );
    await vi.advanceTimersByTimeAsync(STOCK_QUOTE_INTERVAL_MS);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    client.stop();
    await vi.advanceTimersByTimeAsync(STOCK_QUOTE_INTERVAL_MS);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('marks old source timestamps stale instead of replacing them with now', async () => {
    const old = { ...fixture, asOf: '2026-10-30T21:00:00Z' };
    const { client, states } = setup(vi.fn<typeof fetch>().mockResolvedValue(response(old)));
    client.start();
    await flush();
    expect(states.at(-1)).toEqual({ status: 'stale', quote: old });
    client.stop();
  });

  it('reports explicit no-data without inventing a quote', async () => {
    const { client, states } = setup(vi.fn<typeof fetch>().mockResolvedValue(response(null)));
    client.start();
    await flush();
    expect(states.at(-1)?.status).toBe('no-data');
    expect(states.at(-1)?.quote).toBeUndefined();
    client.stop();
  });

  it('reports malformed JSON and network failures without a fabricated price', async () => {
    const { client, states } = setup(
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(new Response('not JSON'))
        .mockRejectedValueOnce(new TypeError('Failed to fetch')),
    );
    client.start();
    await flush();
    expect(states.at(-1)?.status).toBe('error');
    expect(states.at(-1)?.quote).toBeUndefined();
    await client.refresh();
    expect(states.at(-1)).toMatchObject({ status: 'error', message: 'Failed to fetch' });
    expect(states.at(-1)?.quote).toBeUndefined();
    client.stop();
  });

  it('keeps the previous quote when a source regresses or fails', async () => {
    const { client, states } = setup(
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(response(fixture))
        .mockResolvedValueOnce(response({ ...fixture, asOf: '2026-11-02T21:00:00Z' }))
        .mockResolvedValueOnce(new Response('', { status: 429 })),
    );
    client.start();
    await flush();
    await client.refresh();
    expect(states.at(-1)).toMatchObject({
      status: 'error',
      quote: fixture,
      message: expect.stringContaining('older'),
    });
    await client.refresh();
    expect(states.at(-1)).toMatchObject({
      status: 'error',
      quote: fixture,
      message: expect.stringContaining('429'),
    });
    client.stop();
  });

  it('ignores a late response from an aborted previous request', async () => {
    let resolveFirst!: (value: Response) => void;
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce(response(fixture));
    const { client, states } = setup(fetchMock);
    client.start();
    await client.refresh();
    resolveFirst(response({ ...fixture, price: 99 }));
    await flush();
    expect(states.at(-1)).toEqual({ status: 'ready', quote: fixture });
    expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    client.stop();
  });

  it('times out even if a fetch implementation ignores abort', async () => {
    const { client, states } = setup(
      vi.fn<typeof fetch>().mockImplementation(() => new Promise(() => {})),
    );
    client.start();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(states.at(-1)).toMatchObject({ status: 'error', message: 'Quote request timed out.' });
    client.stop();
  });

  it('aborts on stop without publishing errors or stale completions', async () => {
    const { client, states, fetchMock } = setup(
      vi.fn<typeof fetch>().mockImplementation(() => new Promise(() => {})),
    );
    client.start();
    client.stop();
    await flush();
    expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    expect(states.map((s) => s.status)).toEqual(['loading']);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('pauses offline and resumes by fetching a new quote', async () => {
    const { client, states, fetchMock } = setup(
      vi.fn<typeof fetch>().mockImplementation(async () => response(fixture)),
    );
    client.start();
    await flush();
    client.offline();
    expect(states.at(-1)?.status).toBe('offline');
    await vi.advanceTimersByTimeAsync(STOCK_QUOTE_INTERVAL_MS);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    client.start();
    await flush();
    expect(states.at(-1)?.status).toBe('ready');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    client.stop();
  });

  it('rejects non-HTTPS and credential-bearing endpoints without fetching', async () => {
    const { client, states, fetchMock } = setup(
      undefined,
      'https://user:secret@quotes.example/msft.json',
    );
    client.start();
    await flush();
    expect(states.at(-1)?.status).toBe('error');
    expect(fetchMock).not.toHaveBeenCalled();
    client.stop();
  });
});

it('hydrates cloned Adaptive Card JSON and accessible speech, not HTML', () => {
  const template = {
    type: 'AdaptiveCard',
    body: [
      { type: 'TextBlock', id: 'quote-price', text: '—' },
      { type: 'TextBlock', id: 'quote-as-of', text: 'unavailable' },
      { type: 'TextBlock', id: 'quote-status', text: 'unavailable' },
    ],
  };
  const quote = parseStockQuote(fixture, now)!;
  const hydrated = hydrateStockQuoteCard(template, { status: 'ready', quote }, now);
  expect(JSON.stringify(hydrated)).toContain('42.00 USD');
  expect(JSON.stringify(hydrated)).toContain(fixture.asOf);
  expect(template.body[0]?.text).toBe('—');
  expect(hydrated.speak).toContain('end-of-day');
  expect(
    JSON.stringify(
      hydrateStockQuoteCard(template, { status: 'error', quote }, now + 48 * 60 * 60 * 1000),
    ),
  ).toContain('Quote is stale');
});
