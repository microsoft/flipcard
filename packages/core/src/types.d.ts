/** Visible face of the card. */
export type FlipState = 'front' | 'back';
/** Workflow / actions a FlipCard binds to. */
export interface FlipCardWorkflow {
    /** Event name fired when the card flips. */
    onFlip?: string;
    /** Declarative action descriptors. */
    actions?: Array<{
        id: string;
        type: string;
        data?: unknown;
    }>;
}
/**
 * The schema/back-face spec for a FlipCard.
 *
 * Front = rendered design, back = this manifest. The front renderer
 * interprets `design`; the back renderer typically displays `schema`.
 */
export interface FlipCardManifest {
    /** Schema URL (draft-07). */
    $schema?: string;
    /** Manifest semver. */
    version?: string;
    /** Identifier. */
    id?: string;
    /** Optional title shown on back-face header. */
    title?: string;
    /** The design/front rendering descriptor — opaque to core, interpreted by renderer. */
    design?: unknown;
    /** Arbitrary structured payload — usually the back-face JSON. */
    schema?: unknown;
    /** Workflow / actions this card binds to. */
    workflow?: FlipCardWorkflow;
    /** Free-form metadata. */
    metadata?: Record<string, unknown>;
}
/** Options accepted by the FlipCard controller. */
export interface FlipCardOptions {
    defaultState?: FlipState;
    onChange?: (state: FlipState) => void;
}
//# sourceMappingURL=types.d.ts.map