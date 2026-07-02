import { useEffect, useRef, useState } from 'react';
import * as AdaptiveCards from 'adaptivecards';

export interface AdaptiveCardSurfaceProps {
  payload: Record<string, unknown>;
  hostConfig?: Record<string, unknown>;
}

export function AdaptiveCardSurface({ payload, hostConfig }: AdaptiveCardSurfaceProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
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
      setError((err as Error).message);
    }
    return () => {
      host.replaceChildren();
    };
  }, [payload, hostConfig]);

  return (
    <div
      className="fc-asset-adaptive-card"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      role="presentation"
    >
      <div ref={ref} />
      {error ? <p className="fc-asset-adaptive-card-error">{error}</p> : null}
    </div>
  );
}
