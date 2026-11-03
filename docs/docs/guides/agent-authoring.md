---
sidebar_position: 3
title: Agent authoring & protocols
---

# Agent authoring & protocols

FlipCard separates authoring tools, agent sessions, and channel messages.
MCP exposes tools and an Apps viewer; ACP connects to a host-owned agent;
Microsoft Activity adapters exchange envelopes and Adaptive Cards. They are
independent integrations, not interchangeable protocols.

## Configure the host

Build the local checkout first with `npm ci` and `npm run build:libs`. Use
Node.js 22.18+ in 22.x, 24.11+ in 24.x, or 26+. No npm publication is assumed.
Configure your MCP host with the absolute path to the built CLI:

```jsonc
{
  "mcpServers": {
    "flipcard": {
      "command": "node",
      "args": ["C:\\repos\\flipcard\\packages\\mcp-server\\dist\\cli.js"]
    }
  }
}
```

The [MCP package guide](../packages/mcp-server.md) covers the default stdio
transport, opt-in localhost HTTP, and the self-contained MCP Apps viewer.

## Agent Plugins 1.0

The repository root contains `plugin.json` and `mcp.json` for Agent Plugins
**1.0.0**. Install the built repository directory in a compatible host.
The host expands `${PLUGIN_ROOT}` in the command arguments and working directory.
Keep that checkout and its dependencies available after installation.

The plugin schema version is independent of the plugin release version.
Installation neither grants filesystem access nor approves tool execution;
the host retains its permission controls.

## Recommended agent loop

A reliable agent loop for producing a card looks like this:

1. **Discover** — call `list_categories` to learn the seven presets and their intent. Do this once per session.
2. **Plan** — pick the category whose intent matches the user's request.
3. **Generate** — call `generate_manifest` with the chosen category and any provided titles.
4. **Refine** — edit `design.front`, `schema.back.fields`, and `workflow.actions` in place.
5. **Validate** — call `validate_manifest` on the final draft.
6. **Adapt** — if rendering, wrap the manifest in a React/vanilla asset and supply
   the required `design.kind` / `design.headline` fields. MCP color presets are
   not asset categories.
7. **Persist** — use the host's authorized storage tools. The MCP server itself
   does not write files.

## Prompt scaffolding

A short system prompt that works well:

> You are a FlipCard authoring assistant. When the user asks for a card:
> 1. Call `list_categories` once to ground yourself.
> 2. Pick a category whose **intent** matches — never the closest color.
> 3. Call `generate_manifest` with `category`, `frontTitle`, and `backTitle`.
> 4. Edit the result so `design.front.summary` is one sentence and `schema.back.fields` reflects the data the user described.
> 5. Call `validate_manifest` and report the result.
> 6. Output the final JSON in a fenced `json` block.

## Quality bar

Before returning a manifest:

- `id` is stable, kebab‑case, and unique within the user's collection.
- `title` is human‑readable, not a duplicate of `id`.
- `design.front.title` is short enough to fit a card header.
- `design.front.summary` is one sentence and adds information the title doesn't.
- The category matches intent, not color preference.
- `validate_manifest` returns `{ valid: true }`, with its narrow scope understood.

The `design.front` / `schema.back` fields above are authoring conventions, not
the renderer API. Runtime validation does not validate those payloads, certify
renderer compatibility, execute workflows, or make arbitrary actions safe.
Use a draft-07 validator and application-specific checks when stronger validation
is needed.

## ACP v1 sessions

`@microsoft/flipcard-acp` uses `@agentclientprotocol/sdk` **2.0.2** for stable
**ACP v1**. The host supplies UTF-8 NDJSON Web streams and owns process startup,
authentication, and termination:

```ts
import { connectAcp } from '@microsoft/flipcard-acp';

const client = await connectAcp({
  input: agentOutput,
  output: agentInput,
});
const session = await client.createSession({
  cwd: absoluteProjectDirectory,
  mcpServers: [],
});
const unsubscribe = session.subscribe((state, event) => {
  console.log(state, event);
});
try {
  await session.prompt('Describe this project.');
} finally {
  unsubscribe();
  await session.dispose();
  await client.dispose();
}
```

`agentOutput` is a `ReadableStream<Uint8Array>` and `agentInput` is a
`WritableStream<Uint8Array>` supplied by the host. `cwd` must be absolute.
Updates are bounded per session (1,000 retained by default, configurable with
`maxUpdates`). A session supports one active prompt; separate sessions can run
concurrently.

Call `session.cancel()` during a prompt to send `session/cancel` and await the
agent's actual prompt response. `session.dispose()` also waits for graceful
cancellation; use `client.dispose()` to disconnect a stuck connection, then
terminate any subprocess in the host.

Permissions are **denied by default**. An optional `onPermission(request,
{ signal })` callback must obtain explicit consent and return an offered option
ID, or `null` to cancel. Observe the abort signal to dismiss consent UI.
This client does not implement authentication, filesystem, terminal,
session-restoration, or elicitation capabilities. It is not an ACP agent or a
browser-to-stdio server.

## Microsoft Activity envelopes

`@microsoft/flipcard-activity` provides transport-free Microsoft 365 Agents
Activity Protocol helpers:

```ts
import {
  activityToFlipCards,
  createFlipCardMessage,
} from '@microsoft/flipcard-activity';

const message = createFlipCardMessage(
  {
    title: 'Status',
    schema: {
      type: 'AdaptiveCard',
      version: '1.5',
      body: [{ type: 'TextBlock', text: 'Ready to review' }],
    },
  },
  {
    channelId: 'example',
    conversation: { id: 'conversation-1' },
    from: { id: 'agent' },
    recipient: { id: 'user' },
  },
);
const { cards } = activityToFlipCards(message);
```

`parseActivity` / `serializeActivity` handle envelopes; `createAdaptiveCardMessage`
handles actual Adaptive Cards directly. Unknown envelope fields and unsupported
attachments are preserved. Arbitrary Flipcard schemas are not labeled as
Adaptive Cards. Extracted manifests still need adaptation to renderer assets.

For `adaptiveCard/action`, use `parseAdaptiveCardInvoke`,
`createAdaptiveCardInvokeResponse`, and opt-in `dispatchAdaptiveCardInvoke`.
Parsing does not fetch attachments, open URLs, or execute actions. The host must
authorize dispatch, map invoke bodies to HTTP responses, and implement channel
authentication. These helpers do not provide Teams or Direct Line hosting/auth,
nor guarantee that every Adaptive Card feature is supported by every host.

## See also

- **[`@microsoft/flipcard-mcp`](../packages/mcp-server)** — the full tool/resource list.
- **[Categories & themes](./categories-and-themes)** — pick the right preset.
- **[Authoring manifests](./authoring-manifests)** — the underlying shape.
