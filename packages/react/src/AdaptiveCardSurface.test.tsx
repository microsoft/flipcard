import { render, screen } from '@testing-library/react';
import { AdaptiveCard } from 'adaptivecards';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdaptiveCardSurface } from './AdaptiveCardSurface';

function payload(text: string) {
  return {
    type: 'AdaptiveCard',
    version: '1.5',
    body: [{ type: 'TextBlock', text }],
  };
}

afterEach(() => vi.restoreAllMocks());

describe('AdaptiveCardSurface', () => {
  it('replaces rendered content when the payload changes', () => {
    const { rerender } = render(<AdaptiveCardSurface payload={payload('First card')} />);
    expect(screen.getByText('First card')).toBeTruthy();

    rerender(<AdaptiveCardSurface payload={payload('Second card')} />);
    expect(screen.queryByText('First card')).toBeNull();
    expect(screen.getByText('Second card')).toBeTruthy();
  });

  it('clears stale content on failure and recovers on the next payload', () => {
    const { rerender } = render(<AdaptiveCardSurface payload={payload('First card')} />);
    vi.spyOn(AdaptiveCard.prototype, 'render').mockImplementationOnce(() => {
      throw new Error('Card rendering failed');
    });

    rerender(<AdaptiveCardSurface payload={payload('Broken card')} />);
    expect(screen.queryByText('First card')).toBeNull();
    expect(screen.getByText('Card rendering failed')).toBeTruthy();

    rerender(<AdaptiveCardSurface payload={payload('Recovered card')} />);
    expect(screen.queryByText('Card rendering failed')).toBeNull();
    expect(screen.getByText('Recovered card')).toBeTruthy();
  });
});
