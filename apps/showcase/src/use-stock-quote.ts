import { useEffect, useMemo, useState } from 'react';
import {
  createStockQuoteClient,
  hydrateStockQuoteCard,
  type StockQuoteState,
} from '@microsoft/flipcard-core';
import type { FlipCardAssetEntry } from '@microsoft/flipcard';

export function useStockQuoteAssets(
  assets: readonly FlipCardAssetEntry[],
  endpoint = import.meta.env.VITE_STOCK_QUOTE_ENDPOINT as string | undefined,
) {
  const [state, setState] = useState<StockQuoteState>({ status: 'not-configured' });

  useEffect(() => {
    const client = createStockQuoteClient({ endpoint, onState: setState });
    const syncAvailability = () => {
      if (!navigator.onLine) client.offline();
      else if (document.visibilityState === 'hidden') client.stop();
      else client.start();
    };
    document.addEventListener('visibilitychange', syncAvailability);
    window.addEventListener('online', syncAvailability);
    window.addEventListener('offline', syncAvailability);
    syncAvailability();
    return () => {
      client.stop();
      document.removeEventListener('visibilitychange', syncAvailability);
      window.removeEventListener('online', syncAvailability);
      window.removeEventListener('offline', syncAvailability);
    };
  }, [endpoint]);

  return useMemo(
    () =>
      assets.map((asset) => {
        if (asset.id !== 'adaptive-card-stock-update') return asset;
        const card = hydrateStockQuoteCard(asset.manifest.schema, state);
        return {
          ...asset,
          manifest: {
            ...asset.manifest,
            schema: card,
            design: { ...asset.manifest.design, adaptiveCard: card },
          },
        };
      }),
    [assets, state],
  );
}
