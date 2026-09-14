import {
  FLIPCARD_SCHEMA_URL,
  flipCardManifestSchema,
  type FlipCardManifest,
  validateManifest,
} from '@microsoft/flipcard-core';
import { z } from 'zod';

export const CATEGORY_DESCRIPTIONS = [
  { category: 'teal', description: 'Primary action cards for live content and launch points.' },
  { category: 'navy', description: 'Reference cards for specifications, docs, and durable context.' },
  { category: 'gold', description: 'Highlight cards for featured content, wins, and callouts.' },
  { category: 'green', description: 'Healthy-state cards for success metrics and positive status.' },
  { category: 'red', description: 'Alert cards for urgent issues, risks, and destructive paths.' },
  { category: 'plum', description: 'Insight cards for analytics, experiments, and recommendations.' },
  { category: 'slate', description: 'Neutral utility cards for system metadata and supporting details.' },
] as const;

export type FlipCardCategory = (typeof CATEGORY_DESCRIPTIONS)[number]['category'];

export const CATEGORY_VALUES = CATEGORY_DESCRIPTIONS.map((entry) => entry.category) as [
  FlipCardCategory,
  ...FlipCardCategory[],
];

const categorySchema = z.enum(CATEGORY_VALUES);

export const listCategoriesInputSchema = {};
export const getSchemaInputSchema = {};
export const validateManifestInputSchema = { manifest: z.unknown() };
export const generateManifestInputSchema = {
  category: categorySchema.optional(),
  frontTitle: z.string().min(1).optional(),
  backTitle: z.string().min(1).optional(),
  includeWorkflow: z.boolean().optional(),
};
export const describeComponentInputSchema = {
  framework: z.enum(['react', 'vanilla', 'core']),
};

type ListCategoriesInput = z.infer<z.ZodObject<typeof listCategoriesInputSchema>>;
type GetSchemaInput = z.infer<z.ZodObject<typeof getSchemaInputSchema>>;
type ValidateManifestInput = z.infer<z.ZodObject<typeof validateManifestInputSchema>>;
type GenerateManifestInput = z.infer<z.ZodObject<typeof generateManifestInputSchema>>;
type DescribeComponentInput = z.infer<z.ZodObject<typeof describeComponentInputSchema>>;

export interface ToolResponse {
  content: Array<{ type: 'text'; text: string }>;
}

export type ToolHandler<TInput> = (input: TInput) => ToolResponse | Promise<ToolResponse>;

export interface ToolDefinition<TInput> {
  name: string;
  description: string;
  inputSchema: z.ZodRawShape;
  handler: ToolHandler<TInput>;
}

export type ToolRegistrar = Pick<import('@modelcontextprotocol/sdk/server/mcp.js').McpServer, 'registerTool'>;

function toTextResult(result: unknown): ToolResponse {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

function getCategoryDescription(category: FlipCardCategory): string {
  const match = CATEGORY_DESCRIPTIONS.find((entry) => entry.category === category);
  return match?.description ?? 'FlipCard category';
}

export function createStarterManifest(input: GenerateManifestInput): FlipCardManifest {
  const category = input.category ?? 'teal';
  const id = `flipcard-${Date.now()}`;
  const frontTitle = input.frontTitle ?? `${category.charAt(0).toUpperCase()}${category.slice(1)} card`;
  const backTitle = input.backTitle ?? `${frontTitle} manifest`;
  const includeWorkflow = input.includeWorkflow ?? false;

  const manifest: FlipCardManifest = {
    $schema: FLIPCARD_SCHEMA_URL,
    version: '0.1.0',
    id,
    title: backTitle,
    design: {
      category,
      front: {
        title: frontTitle,
        summary: getCategoryDescription(category),
      },
    },
    schema: {
      category,
      back: {
        title: backTitle,
        fields: [
          { name: 'title', type: 'string', example: frontTitle },
          { name: 'category', type: 'string', example: category },
        ],
      },
    },
    metadata: {
      category,
      generatedBy: 'flipcard-mcp',
      generatedAt: new Date().toISOString(),
    },
    ...(includeWorkflow
      ? {
          workflow: {
            onFlip: 'flipcard.flip',
            actions: [
              {
                id: 'log-flip',
                type: 'telemetry',
                data: {
                  event: 'flipcard.flip',
                  category,
                },
              },
            ],
          },
        }
      : {}),
  };

  return manifest;
}

function describeComponent(framework: DescribeComponentInput['framework']): string {
  switch (framework) {
    case 'react':
      return [
        '# `@microsoft/flipcard-react`',
        '',
        '- `FlipCard` accepts `FlipCardProps` with `asset`, `defaultState`, `interactive`, `className`, and `onFlip`.',
        '- `asset` is a `FlipCardRenderableAsset` containing category, theme, summary, accent, and a manifest payload.',
        '- `FlipCardCatalog` accepts `FlipCardCatalogProps` with an `assets` array and optional `className`.',
        '- Use React when you want rendered cards backed by manifest data and React state updates.',
      ].join('\n');
    case 'vanilla':
      return [
        '# `@microsoft/flipcard`',
        '',
        '- Registers the `<flip-card>` custom element via `defineFlipCard()`.',
        '- Key attributes: `front-title`, `back-title`, `flip-hint`, `default-flipped`, `show-flip-hint`, `schema`, and `manifest`.',
        '- Fires `flipcard:flip` with `{ flipped: boolean }` and `flipcard:copy` with `{ text: string }`.',
        '- Use the web component when you need framework-neutral embedding in HTML or other UI shells.',
      ].join('\n');
    case 'core':
      return [
        '# `@microsoft/flipcard-core`',
        '',
        '- `FlipCardManifest` is the schema-facing manifest shape for FlipCard documents.',
        '- `FlipState` is the face state union: `front | back`.',
        '- `FlipCardController` exposes `state`, `flip()`, `set(state)`, and `subscribe(listener)` for state-machine control.',
        `- Schema helpers include \`FLIPCARD_SCHEMA_URL\`, \`flipCardManifestSchema\`, and \`validateManifest(input)\`.`,
      ].join('\n');
  }
}

export const flipCardToolDefinitions = [
  {
    name: 'list_categories',
    description: 'List the supported FlipCard category presets and their intended use.',
    inputSchema: listCategoriesInputSchema,
    handler: async () => toTextResult(CATEGORY_DESCRIPTIONS),
  },
  {
    name: 'get_schema',
    description: 'Return the FlipCard manifest JSON Schema.',
    inputSchema: getSchemaInputSchema,
    handler: async () => toTextResult(flipCardManifestSchema),
  },
  {
    name: 'validate_manifest',
    description: 'Validate a candidate FlipCard manifest with the core runtime validator.',
    inputSchema: validateManifestInputSchema,
    handler: async ({ manifest }) => toTextResult(validateManifest(manifest)),
  },
  {
    name: 'generate_manifest',
    description: 'Generate a starter FlipCard manifest for a category and optional titles.',
    inputSchema: generateManifestInputSchema,
    handler: async (input) => toTextResult(createStarterManifest(input)),
  },
  {
    name: 'describe_component',
    description: 'Describe the public FlipCard API surface for a framework package.',
    inputSchema: describeComponentInputSchema,
    handler: async ({ framework }) => toTextResult({ framework, markdown: describeComponent(framework) }),
  },
] as const satisfies readonly [
  ToolDefinition<ListCategoriesInput>,
  ToolDefinition<GetSchemaInput>,
  ToolDefinition<ValidateManifestInput>,
  ToolDefinition<GenerateManifestInput>,
  ToolDefinition<DescribeComponentInput>,
];

export function registerFlipCardTools(server: ToolRegistrar): void {
  for (const definition of flipCardToolDefinitions) {
    server.registerTool(
      definition.name,
      {
        description: definition.description,
        inputSchema: definition.inputSchema,
      },
      definition.handler as never,
    );
  }
}
