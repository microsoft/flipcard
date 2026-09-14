declare module '@microsoft/flipcard-core' {
  export type FlipState = 'front' | 'back';

  export interface FlipCardWorkflow {
    onFlip?: string;
    actions?: Array<{ id: string; type: string; data?: unknown }>;
  }

  export interface FlipCardManifest {
    $schema?: string;
    version?: string;
    id?: string;
    title?: string;
    design?: unknown;
    schema?: unknown;
    workflow?: FlipCardWorkflow;
    metadata?: Record<string, unknown>;
  }

  export declare const FLIPCARD_SCHEMA_URL: string;
  export declare const flipCardManifestSchema: {
    $schema: string;
    $id: string;
    title: string;
    type: string;
    properties: Record<string, unknown>;
    additionalProperties: boolean;
  };

  export declare function validateManifest(input: unknown): {
    valid: boolean;
    errors: string[];
  };
}
