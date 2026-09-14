import type { FlipState, FlipCardOptions } from './types';

/**
 * Framework-agnostic state machine for a FlipCard.
 *
 * Holds the current face (`'front' | 'back'`), exposes `flip()` / `set()`,
 * and notifies subscribers on state change.
 */
export class FlipCardController {
  private _state: FlipState;
  private _options: FlipCardOptions;
  private _listeners = new Set<(s: FlipState) => void>();

  constructor(options: FlipCardOptions = {}) {
    this._options = options;
    this._state = options.defaultState ?? 'front';
  }

  get state(): FlipState {
    return this._state;
  }

  /** Toggle between front and back. Returns the new state. */
  flip(): FlipState {
    return this.set(this._state === 'front' ? 'back' : 'front');
  }

  /** Set explicit state. Idempotent — no-op if state is unchanged. */
  set(state: FlipState): FlipState {
    if (state === this._state) return state;
    this._state = state;
    this._options.onChange?.(state);
    this._listeners.forEach((l) => l(state));
    return state;
  }

  /** Subscribe to state changes. Returns an unsubscribe function. */
  subscribe(listener: (s: FlipState) => void): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }
}
