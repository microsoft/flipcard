export interface StockQuote {
  symbol: 'MSFT';
  currency: 'USD';
  price: number;
  asOf: string;
  provider: string;
  delay: 'delayed' | 'end-of-day' | 'real-time';
  change?: number;
  changePercent?: number;
  open?: number;
  high?: number;
  low?: number;
}

export type StockQuoteStatus =
  'not-configured' | 'loading' | 'ready' | 'stale' | 'error' | 'no-data' | 'offline';

export interface StockQuoteState {
  status: StockQuoteStatus;
  quote?: StockQuote;
  message?: string;
}

export const STOCK_QUOTE_INTERVAL_MS = 5 * 60 * 1000;
export const STOCK_QUOTE_STALE_MS = 36 * 60 * 60 * 1000;

/** The endpoint must supply the market timestamp, never its response-generation time. */
export function parseStockQuote(value: unknown, now = Date.now()): StockQuote | null {
  if (value === null) return null;
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid quote response.');
  const data = value as Record<string, unknown>;
  const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
  if (
    data.symbol !== 'MSFT' ||
    data.currency !== 'USD' ||
    !finite(data.price) ||
    data.price <= 0 ||
    typeof data.asOf !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(data.asOf) ||
    !Number.isFinite(Date.parse(data.asOf)) ||
    Date.parse(data.asOf) > now + 5 * 60 * 1000 ||
    typeof data.provider !== 'string' ||
    !data.provider.trim() ||
    !/^[\p{L}\p{N} .,'/&()-]{1,80}$/u.test(data.provider) ||
    typeof data.delay !== 'string' ||
    !['delayed', 'end-of-day', 'real-time'].includes(data.delay)
  ) {
    throw new Error('Invalid quote response.');
  }
  if (
    new Date(`${data.asOf.slice(0, 10)}T00:00:00Z`).toISOString().slice(0, 10) !==
    data.asOf.slice(0, 10)
  ) {
    throw new Error('Invalid quote date.');
  }
  for (const key of ['change', 'changePercent', 'open', 'high', 'low']) {
    if (
      data[key] !== undefined &&
      (!finite(data[key]) || (['open', 'high', 'low'].includes(key) && data[key] <= 0))
    ) {
      throw new Error(`Invalid quote ${key}.`);
    }
  }
  if (finite(data.high) && finite(data.low) && data.high < data.low)
    throw new Error('Invalid quote range.');
  return {
    symbol: 'MSFT',
    currency: 'USD',
    price: data.price,
    asOf: data.asOf,
    provider: data.provider,
    delay: data.delay as StockQuote['delay'],
    ...Object.fromEntries(
      ['change', 'changePercent', 'open', 'high', 'low']
        .filter((key) => data[key] !== undefined)
        .map((key) => [key, data[key]]),
    ),
  };
}

export interface StockQuoteClientOptions {
  endpoint?: string;
  onState: (state: StockQuoteState) => void;
  fetch?: typeof globalThis.fetch;
  now?: () => number;
  intervalMs?: number;
  timeoutMs?: number;
  staleAfterMs?: number;
}

/** Only explicitly configured public endpoints are fetched; no credentials or referrer are sent. */
export function createStockQuoteClient(options: StockQuoteClientOptions) {
  const fetchQuote = options.fetch ?? globalThis.fetch;
  const now = options.now ?? Date.now;
  const staleAfterMs = options.staleAfterMs ?? STOCK_QUOTE_STALE_MS;
  let state: StockQuoteState = { status: 'not-configured' };
  let active = false;
  let generation = 0;
  let controller: AbortController | undefined;
  let poll: ReturnType<typeof setInterval> | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const publish = (next: StockQuoteState) => {
    state = next;
    options.onState(next);
  };
  const cancel = () => {
    generation++;
    controller?.abort();
    controller = undefined;
    clearTimeout(timeout);
  };
  const refresh = async () => {
    if (!active) return;
    cancel();
    if (!options.endpoint?.trim()) {
      publish({ status: 'not-configured' });
      return;
    }
    const request = generation;
    controller = new AbortController();
    const signal = controller.signal;
    let rejectAbort: () => void = () => {};
    const aborted = new Promise<never>((_, reject) => {
      rejectAbort = () => reject(new Error('Quote request aborted.'));
      signal.addEventListener('abort', rejectAbort, { once: true });
    });
    publish({ status: 'loading', quote: state.quote });
    timeout = setTimeout(() => controller?.abort(), options.timeoutMs ?? 10_000);
    try {
      const base = typeof location === 'undefined' ? undefined : location.href;
      const url = new URL(options.endpoint, base);
      const sameOrigin = base && url.origin === new URL(base).origin;
      if (
        (url.protocol !== 'https:' && !(sameOrigin && url.protocol === 'http:')) ||
        url.username ||
        url.password ||
        url.hash
      ) {
        throw new Error('Use a public HTTPS quote endpoint or a same-origin URL.');
      }
      const quote = await Promise.race([
        (async () => {
          const response = await fetchQuote(url.href, {
            signal,
            credentials: 'omit',
            referrerPolicy: 'no-referrer',
            cache: 'no-store',
            headers: { Accept: 'application/json' },
          });
          if (!response.ok) throw new Error(`Quote endpoint returned HTTP ${response.status}.`);
          return parseStockQuote(await response.json(), now());
        })(),
        aborted,
      ]);
      if (!active || request !== generation || signal.aborted) return;
      if (quote && state.quote && Date.parse(quote.asOf) < Date.parse(state.quote.asOf)) {
        throw new Error('Quote endpoint returned an older market timestamp.');
      }
      if (!quote) {
        publish({
          status: 'no-data',
          quote: state.quote,
          message: 'The provider returned no quote.',
        });
      } else {
        publish({
          status: now() - Date.parse(quote.asOf) > staleAfterMs ? 'stale' : 'ready',
          quote,
        });
      }
    } catch (error) {
      if (!active || request !== generation) return;
      publish({
        status: 'error',
        quote: state.quote,
        message: signal.aborted
          ? 'Quote request timed out.'
          : error instanceof Error
            ? error.message
            : 'Quote request failed.',
      });
    } finally {
      signal.removeEventListener('abort', rejectAbort);
      if (request === generation) clearTimeout(timeout);
    }
  };
  const stop = () => {
    active = false;
    cancel();
    clearInterval(poll);
    poll = undefined;
  };
  return {
    refresh,
    start() {
      if (active) return;
      active = true;
      void refresh();
      if (options.endpoint?.trim())
        poll = setInterval(() => void refresh(), options.intervalMs ?? STOCK_QUOTE_INTERVAL_MS);
    },
    stop,
    offline() {
      stop();
      publish({
        status: options.endpoint?.trim() ? 'offline' : 'not-configured',
        quote: state.quote,
      });
    },
  };
}

/** Hydrate Adaptive Card TextBlocks by ID, keeping JSON separate from HTML. */
export function hydrateStockQuoteCard(
  template: Record<string, unknown>,
  state: StockQuoteState,
  now = Date.now(),
): Record<string, unknown> {
  const quote = state.quote;
  const stale = quote && now - Date.parse(quote.asOf) > STOCK_QUOTE_STALE_MS;
  const labels: Record<StockQuoteStatus, string> = {
    'not-configured': 'Not configured — set VITE_STOCK_QUOTE_ENDPOINT to a public quote endpoint.',
    loading: 'Loading quote…',
    ready: 'Quote refreshed',
    stale: 'Stale quote — source timestamp is more than 36 hours old.',
    error: 'Quote refresh failed. Check the configured endpoint and its CORS policy.',
    'no-data': 'No quote available from the provider.',
    offline: 'Offline — refresh paused.',
  };
  const money = (value: number | undefined) =>
    value === undefined ? '—' : `${value.toFixed(2)} USD`;
  const values: Record<string, string> = {
    'quote-status': `${labels[state.status]}${quote && state.status !== 'ready' && state.status !== 'stale' ? ' Showing the last received quote.' : ''}${stale && state.status !== 'stale' ? ' Quote is stale.' : ''}`,
    'quote-price': quote ? money(quote.price) : '—',
    'quote-as-of': quote ? `Market timestamp: ${quote.asOf}` : 'Market timestamp: unavailable',
    'quote-provider': quote
      ? `Source: ${quote.provider} · ${quote.delay}`
      : state.status === 'not-configured'
        ? 'No quote provider configured'
        : 'Source: awaiting a valid provider response',
    'quote-change':
      quote?.change !== undefined
        ? `${quote.change >= 0 ? '+' : ''}${money(quote.change)}${quote.changePercent !== undefined ? ` (${quote.changePercent.toFixed(2)}%)` : ''}`
        : quote?.changePercent !== undefined
          ? `Change: ${quote.changePercent.toFixed(2)}%`
          : 'Change: unavailable',
    'quote-open': `Open: ${money(quote?.open)}`,
    'quote-high': `High: ${money(quote?.high)}`,
    'quote-low': `Low: ${money(quote?.low)}`,
  };
  const visit = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(visit);
    if (!value || typeof value !== 'object') return value;
    const node = value as Record<string, unknown>;
    const copy = Object.fromEntries(
      Object.entries(node).map(([key, child]) => [key, visit(child)]),
    );
    if (node.type === 'TextBlock' && typeof node.id === 'string' && values[node.id] !== undefined) {
      copy.text = values[node.id];
    }
    return copy;
  };
  return {
    ...(visit(template) as Record<string, unknown>),
    speak: `${values['quote-status']} ${values['quote-price']}. ${values['quote-as-of']}. ${values['quote-provider']}.`,
  };
}
