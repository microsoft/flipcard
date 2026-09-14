import type { FlipState, FlipCardOptions } from './types';
/**
 * Framework-agnostic state machine for a FlipCard.
 *
 * Holds the current face (`'front' | 'back'`), exposes `flip()` / `set()`,
 * and notifies subscribers on state change.
 */
export declare class FlipCardController {
    private _state;
    private _options;
    private _listeners;
    constructor(options?: FlipCardOptions);
    get state(): FlipState;
    /** Toggle between front and back. Returns the new state. */
    flip(): FlipState;
    /** Set explicit state. Idempotent — no-op if state is unchanged. */
    set(state: FlipState): FlipState;
    /** Subscribe to state changes. Returns an unsubscribe function. */
    subscribe(listener: (s: FlipState) => void): () => void;
}
//# sourceMappingURL=controller.d.ts.map