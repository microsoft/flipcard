import { useCallback, useState } from 'react';
import * as AdaptiveCards from 'adaptivecards';

export interface AdaptiveCardSurfaceProps {
  payload: Record<string, unknown>;
  hostConfig?: Record<string, unknown>;
}

export function AdaptiveCardSurface({ payload, hostConfig }: AdaptiveCardSurfaceProps) {
  const [error, setError] = useState<string | null>(null);

  const renderCard = useCallback((host: HTMLDivElement | null) => {
    if (!host) return;
    host.replaceChildren();
    try {
      const card = new AdaptiveCards.AdaptiveCard();
      if (hostConfig) {
        card.hostConfig = new AdaptiveCards.HostConfig(hostConfig);
      }
      card.parse(payload);
      const rendered = card.render();
      if (rendered) {
        host.replaceChildren(rendered);
        setError(null);
      } else {
        setError('Adaptive Card returned no content.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [payload, hostConfig]);

  return (
    <div
      className="fc-asset-adaptive-card"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      role="presentation"
    >
      <div ref={renderCard} />
      {error ? <p className="fc-asset-adaptive-card-error">{error}</p> : null}
    </div>
  );
}
