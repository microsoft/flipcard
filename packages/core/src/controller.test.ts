import { describe, it, expect, vi } from 'vitest';
import { FlipCardController } from './controller';

describe('FlipCardController', () => {
  it('defaults to front', () => {
    const c = new FlipCardController();
    expect(c.state).toBe('front');
  });

  it('honors defaultState option', () => {
    const c = new FlipCardController({ defaultState: 'back' });
    expect(c.state).toBe('back');
  });

  it('flip toggles between front and back', () => {
    const c = new FlipCardController();
    expect(c.flip()).toBe('back');
    expect(c.state).toBe('back');
    expect(c.flip()).toBe('front');
    expect(c.state).toBe('front');
  });

  it('set is idempotent for the same state', () => {
    const onChange = vi.fn();
    const c = new FlipCardController({ onChange });
    c.set('front');
    expect(onChange).not.toHaveBeenCalled();
    c.set('back');
    expect(onChange).toHaveBeenCalledTimes(1);
    c.set('back');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('invokes onChange option on state change', () => {
    const onChange = vi.fn();
    const c = new FlipCardController({ onChange });
    c.flip();
    expect(onChange).toHaveBeenCalledWith('back');
  });

  it('subscribe is notified and unsubscribe works', () => {
    const c = new FlipCardController();
    const listener = vi.fn();
    const unsubscribe = c.subscribe(listener);
    c.flip();
    expect(listener).toHaveBeenCalledWith('back');
    unsubscribe();
    c.flip();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
