/** Public URL where the FlipCard manifest JSON Schema is published. */
export declare const FLIPCARD_SCHEMA_URL = "https://microsoft.github.io/flipcard/schema/v0.1.json";
/**
 * JSON Schema (draft-07) describing a {@link FlipCardManifest}.
 *
 * Suitable for publishing to a static URL and referencing from manifest
 * documents via the `$schema` property.
 */
export declare const flipCardManifestSchema: {
    readonly $schema: "http://json-schema.org/draft-07/schema#";
    readonly $id: "https://microsoft.github.io/flipcard/schema/v0.1.json";
    readonly title: "FlipCardManifest";
    readonly type: "object";
    readonly properties: {
        readonly $schema: {
            readonly type: "string";
            readonly format: "uri";
        };
        readonly version: {
            readonly type: "string";
        };
        readonly id: {
            readonly type: "string";
        };
        readonly title: {
            readonly type: "string";
        };
        readonly design: {};
        readonly schema: {};
        readonly workflow: {
            readonly type: "object";
            readonly properties: {
                readonly onFlip: {
                    readonly type: "string";
                };
                readonly actions: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly required: readonly ["id", "type"];
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly type: {
                                readonly type: "string";
                            };
                            readonly data: {};
                        };
                    };
                };
            };
        };
        readonly metadata: {
            readonly type: "object";
            readonly additionalProperties: true;
        };
    };
    readonly additionalProperties: false;
};
/**
 * Lightweight, dependency-free runtime check for a FlipCard manifest.
 *
 * This is intentionally narrow — for full draft-07 validation use Ajv against
 * {@link flipCardManifestSchema}.
 */
export declare function validateManifest(input: unknown): {
    valid: boolean;
    errors: string[];
};
//# sourceMappingURL=schema.d.ts.map