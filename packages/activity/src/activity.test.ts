// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import {
  ADAPTIVE_CARD_ACTION,
  ADAPTIVE_CARD_CONTENT_TYPE,
  ERROR_CONTENT_TYPE,
  MESSAGE_CONTENT_TYPE,
  ActivityValidationError,
  activityToFlipCards,
  adaptiveCardFromManifest,
  adaptiveCardToManifest,
  createAdaptiveCardAttachment,
  createAdaptiveCardInvoke,
  createAdaptiveCardInvokeResponse,
  createAdaptiveCardMessage,
  createErrorInvokeResponse,
  createFlipCardMessage,
  createMessageActivity,
  createMessageInvokeResponse,
  dispatchAdaptiveCardInvoke,
  parseActivity,
  parseActivityEnvelope,
  parseActivityRouting,
  parseAdaptiveCard,
  parseAdaptiveCardInvoke,
  parseAdaptiveCardInvokeResponse,
  serializeActivity,
  updateActivityCard,
  type ActivityRouting,
  type AdaptiveCard,
} from './index';

const routing: ActivityRouting = {
  channelId: 'msteams',
  conversation: { id: 'conversation-1', tenantId: 'tenant-1' },
  from: { id: 'user-1', name: 'User' },
  recipient: { id: 'agent-1', name: 'Agent' },
};

const card: AdaptiveCard = {
  type: 'AdaptiveCard',
  version: '1.4',
  body: [{ type: 'TextBlock', text: 'Approval request' }],
  actions: [{ type: 'Action.Execute', title: 'Approve', verb: 'approve', data: { requestId: 7 } }],
};

describe('Activity Protocol envelope profile', () => {
  it('requires type:string, but neither message text nor a channel-assigned id', () => {
    expect(parseActivityEnvelope({ type: 'message' })).toEqual({ type: 'message' });
    expect(createMessageActivity(routing)).toEqual({ ...routing, type: 'message' });
    expect(() => parseActivityEnvelope({})).toThrow(ActivityValidationError);
    expect(() => parseActivityEnvelope({ type: 1 })).toThrow('$.type');
    expect(() => parseActivityEnvelope({ type: 'message', text: 1 })).toThrow('$.text');
  });

  it('uses explicit context: incoming requires recipient, outgoing does not', () => {
    const outgoing = { channelId: 'custom', conversation: { id: 'c' }, from: { id: 'a' } };
    const activity = createMessageActivity(outgoing, { text: 'Hello' });
    expect(activity).not.toHaveProperty('recipient');
    expect(activity).not.toHaveProperty('id');
    expect(activity).not.toHaveProperty('serviceUrl');
    expect(() => parseActivity(activity)).toThrow('$.recipient');
    expect(parseActivity(activity, { direction: 'outgoing' })).toEqual(activity);
  });

  it('offers the stricter channel-to-agent profile without inferring an endpoint', () => {
    const activity = { ...routing, type: 'message' };
    expect(() => parseActivity(activity, { profile: 'channel-to-agent' })).toThrow('$.serviceUrl');
    const incoming = { ...activity, serviceUrl: 'https://channel.example.test' };
    expect(parseActivity(incoming, { profile: 'channel-to-agent' })).toEqual(incoming);
    expect(() =>
      parseActivity(incoming, { profile: 'channel-to-agent', direction: 'outgoing' }),
    ).toThrow('incoming direction');
    expect(() =>
      parseActivity({ ...incoming, serviceUrl: '' }, { profile: 'channel-to-agent' }),
    ).toThrow('$.serviceUrl');
  });

  it('rejects invalid routing profiles at untyped JavaScript boundaries', () => {
    expect(() => parseActivityRouting(routing, { direction: 'sideways' as 'incoming' })).toThrow(
      '$.options.direction',
    );
    expect(() => parseActivityRouting(routing, { profile: 'unknown' as 'adapter' })).toThrow(
      '$.options.profile',
    );
  });

  it.each([null, 'channel-specific', 42, false, ['opaque', { nested: true }]])(
    'preserves primitive and array channelData allowed by A2200: %j',
    (channelData) => {
      const activity = { ...routing, type: 'message', channelData };
      expect(JSON.parse(serializeActivity(activityToFlipCards(activity).activity))).toEqual(
        activity,
      );
      expect(createMessageActivity(routing, { extensions: { channelData } })).toEqual(activity);
    },
  );

  it.each([
    { channelId: 1 },
    { channelId: '' },
    { conversation: {} },
    { conversation: { id: 1 } },
    { conversation: { id: 'c', isGroup: 'yes' } },
    { from: [] },
    { from: { name: 'User' } },
    { recipient: { id: '' } },
    { serviceUrl: 3 },
  ])('rejects malformed routing %j', (bad) => {
    expect(() => parseActivity({ ...routing, type: 'message', ...bad })).toThrow(
      ActivityValidationError,
    );
  });

  it('round-trips unknown extension fields at all depths without mutating input', () => {
    const activity = {
      ...routing,
      type: 'message',
      from: { id: 'user-1', customIdentity: { audience: ['one', 'two'] } },
      conversation: { id: 'c', customConversation: true, role: { customExtension: true } },
      customEnvelope: { deeply: { nested: ['extension', null] } },
      channelData: { tenant: { id: 't' }, customChannel: 42 },
      entities: [{ type: 'custom', payload: { count: 2 } }],
      attachments: [
        {
          contentType: ADAPTIVE_CARD_CONTENT_TYPE,
          customAttachment: { enabled: true },
          content: { ...card, customCard: { nested: 5 } },
        },
      ],
    };
    const parsed = activityToFlipCards(activity);
    expect(JSON.parse(serializeActivity(parsed.activity))).toEqual(activity);
    expect(parsed.activity).not.toBe(activity);
    expect(parsed.cards[0]?.manifest.schema).toEqual(activity.attachments[0]?.content);
    parsed.activity.from.name = 'Changed copy';
    expect(activity.from).not.toHaveProperty('name');
  });

  it('retains JSON __proto__ extension keys without prototype pollution', () => {
    const value = JSON.parse('{"type":"custom","__proto__":{"customExtension":true}}');
    const parsed = parseActivityEnvelope(value);
    expect(Object.hasOwn(parsed, '__proto__')).toBe(true);
    expect(JSON.parse(serializeActivity(parsed))).toEqual(value);
    expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
    expect({}).not.toHaveProperty('customExtension');
  });

  it.each([undefined, NaN, Infinity, 1n, () => undefined, new Date()])(
    'rejects non-wire values %s',
    (value) => {
      expect(() => parseActivityEnvelope({ type: 'message', custom: value })).toThrow(
        ActivityValidationError,
      );
    },
  );

  it('rejects cyclic JSON and accessors without evaluating them', () => {
    const cycle: Record<string, unknown> = { type: 'message' };
    cycle.cycle = cycle;
    expect(() => parseActivityEnvelope(cycle)).toThrow('cyclic');
    const getter = vi.fn(() => 'message');
    expect(() =>
      parseActivityEnvelope(
        Object.defineProperty({}, 'type', {
          enumerable: true,
          get: getter,
        }),
      ),
    ).toThrow('accessors');
    expect(getter).not.toHaveBeenCalled();
  });

  it('rejects sparse arrays and array accessors without evaluating them', () => {
    const getter = vi.fn(() => 'secret');
    const entries = Object.defineProperty([], 0, { enumerable: true, get: getter });
    expect(() => parseActivityEnvelope({ type: 'custom', entries })).toThrow('accessors');
    expect(getter).not.toHaveBeenCalled();
    expect(() => parseActivityEnvelope({ type: 'custom', entries: new Array(1) })).toThrow(
      'sparse arrays',
    );
  });

  it('accepts unknown activity types without interpreting or dispatching their contents', () => {
    const value = { ...routing, type: 'custom/future', value: { arbitrary: true } };
    expect(activityToFlipCards(value)).toEqual({
      activity: value,
      cards: [],
      unsupportedAttachments: [],
    });
  });
});

describe('Adaptive Card attachment and FlipCard adapters', () => {
  it.each(['Hello, 世界', ''])('round-trips a text-only message: %j', (text) => {
    const message = createMessageActivity(routing, { text });
    const adapted = activityToFlipCards(message);
    expect(adapted.cards).toEqual([]);
    expect(adapted.text).toBe(text);
    expect(createMessageActivity(routing, { text: adapted.text })).toEqual(message);
    expect(JSON.parse(serializeActivity(adapted.activity))).toEqual(message);
  });

  it('extracts incoming text and actual inline cards into renderer-recognized schema', () => {
    const incoming = {
      ...routing,
      type: 'message',
      text: 'Please review',
      attachments: [{ contentType: ADAPTIVE_CARD_CONTENT_TYPE, name: 'Approval', content: card }],
    };
    const result = activityToFlipCards(incoming);
    expect(result.text).toBe('Please review');
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0]?.attachmentIndex).toBe(0);
    expect(result.cards[0]?.manifest).toEqual({ title: 'Approval', schema: card });
    expect(
      createFlipCardMessage(result.cards[0]!.manifest, routing, { text: result.text }),
    ).toEqual(incoming);
  });

  it('creates a card-only message with the official MIME type and no invented channel id', () => {
    const message = createAdaptiveCardMessage(card, routing);
    expect(message.attachments).toEqual([
      { contentType: ADAPTIVE_CARD_CONTENT_TYPE, content: card },
    ]);
    expect(message).not.toHaveProperty('text');
    expect(message).not.toHaveProperty('id');
    expect(message).not.toHaveProperty('timestamp');
  });

  it('follows renderer precedence for design.adaptiveCard versus manifest.schema', () => {
    const other: AdaptiveCard = { type: 'AdaptiveCard', version: '1.4', body: [] };
    expect(adaptiveCardFromManifest({ design: { adaptiveCard: card }, schema: other })).toEqual(
      card,
    );
    expect(adaptiveCardFromManifest(adaptiveCardToManifest(card))).toEqual(card);
    expect(() =>
      createFlipCardMessage({ title: 'Not a card', design: { headline: 'Hello' } }, routing),
    ).toThrow('expected an AdaptiveCard');
    expect(() => createFlipCardMessage({ schema: { type: 'FlipCardManifest' } }, routing)).toThrow(
      'expected AdaptiveCard',
    );
  });

  it('preserves unsupported attachments and never fetches URL-only cards', () => {
    const attachments = [
      { contentType: 'image/png', contentUrl: 'https://example.test/image.png', extra: 1 },
      { contentType: ADAPTIVE_CARD_CONTENT_TYPE, contentUrl: 'https://example.test/card.json' },
      { contentType: ADAPTIVE_CARD_CONTENT_TYPE, content: card },
    ];
    const result = activityToFlipCards({ ...routing, type: 'message', attachments });
    expect(result.cards[0]?.attachmentIndex).toBe(2);
    expect(result.unsupportedAttachments.map((item) => item.reason)).toEqual([
      'unsupported-content-type',
      'external-card-content',
    ]);
    expect(result.activity.attachments).toEqual(attachments);
  });

  it.each([
    null,
    {},
    { contentType: 1, content: {} },
    { contentType: 'image/png', contentUrl: 1 },
    { contentType: 'image/png' },
    { contentType: ADAPTIVE_CARD_CONTENT_TYPE, content: { title: 'A manifest is not a card' } },
    { contentType: ADAPTIVE_CARD_CONTENT_TYPE, content: { type: 'AdaptiveCard' } },
    {
      contentType: ADAPTIVE_CARD_CONTENT_TYPE,
      content: { type: 'AdaptiveCard', version: '1.4', body: {} },
    },
  ])('rejects malformed attachments %j', (attachment) => {
    expect(() =>
      activityToFlipCards({ ...routing, type: 'message', attachments: [attachment] }),
    ).toThrow(ActivityValidationError);
  });

  it.each([
    { type: 'AdaptiveCard', version: 1.4 },
    { type: 'AdaptiveCard', version: 'bad' },
    { ...card, actions: [{ type: 'Action.Execute', data: [] }] },
    { ...card, body: [{ type: 'TextBlock', text: 7 }] },
    { ...card, actions: [{ type: 'Action.OpenUrl', url: 1 }] },
  ])('checks structural card/action boundaries %j', (value) => {
    expect(() => parseAdaptiveCard(value)).toThrow(ActivityValidationError);
  });

  it('accepts host-specific extension elements without claiming full renderer support', () => {
    const future = {
      ...card,
      body: [
        {
          type: 'Vendor.Widget',
          custom: { feature: true },
          items: 'vendor-defined',
          actions: { proprietary: true },
          columns: 3,
          selectAction: 'opaque',
        },
      ],
    };
    expect(parseAdaptiveCard(future)).toEqual(future);
    expect(adaptiveCardFromManifest(adaptiveCardToManifest(future))).toEqual(future);
  });

  it('round-trips nested cards, containers, and declarative refresh without executing them', () => {
    const nested: AdaptiveCard = {
      ...card,
      body: [
        {
          type: 'ColumnSet',
          columns: [
            {
              type: 'Column',
              items: [
                { type: 'Container', items: [{ type: 'TextBlock', text: 'Nested' }] },
                { type: 'ActionSet', actions: card.actions },
              ],
            },
          ],
        },
      ],
      actions: [
        {
          type: 'Action.ShowCard',
          card: {
            type: 'AdaptiveCard',
            body: [{ type: 'TextBlock', text: 'No version required' }],
          },
        },
      ],
      refresh: { action: { type: 'Action.Execute', verb: 'refresh' }, userIds: ['u1'] },
    };
    expect(parseAdaptiveCard(nested)).toEqual(nested);
    const message = createAdaptiveCardMessage(nested, routing);
    const extracted = activityToFlipCards(message).cards[0]!;
    expect(updateActivityCard(message, extracted.attachmentIndex, extracted.manifest)).toEqual(
      message,
    );
  });

  it.each([
    { body: [{ type: 'Container', items: {} }] },
    { body: [{ type: 'ColumnSet', columns: [{ type: 'Column', items: [null] }] }] },
    { body: [{ type: 'ActionSet', actions: [{ type: 'Action.Execute', verb: 1 }] }] },
    { refresh: { action: { type: 'Action.Submit' } } },
    { refresh: { action: { type: 'Action.Execute' }, userIds: [1] } },
    { actions: [{ type: 'Action.ShowCard', card: { type: 'SomethingElse' } }] },
  ])('rejects malformed known nested card fields %j', (overrides) => {
    expect(() => parseAdaptiveCard({ ...card, ...overrides })).toThrow(ActivityValidationError);
  });

  it('does not execute OpenUrl actions while parsing or generating envelopes', () => {
    const urlCard = { ...card, actions: [{ type: 'Action.OpenUrl', url: 'https://example.test' }] };
    expect(createAdaptiveCardMessage(urlCard, routing).attachments?.[0]?.content).toEqual(urlCard);
  });

  it('supports extensions without allowing them to override explicit message fields', () => {
    expect(
      createMessageActivity(routing, { extensions: { channelData: { tenant: 't' } } }),
    ).toHaveProperty('channelData.tenant', 't');
    expect(() => createMessageActivity(routing, { extensions: { type: 'invoke' } })).toThrow(
      'explicit parameter',
    );
    expect(() =>
      createMessageActivity(routing, { extensions: { from: { id: 'other' } } }),
    ).toThrow();
    expect(() => createAdaptiveCardAttachment(card, { extensions: { content: {} } })).toThrow();
    expect(
      createAdaptiveCardAttachment(card, { extensions: { vendor: { data: true } } }),
    ).toHaveProperty('vendor.data', true);
  });

  it('updates card content while preserving the original envelope, routing and attachment extensions', () => {
    const incoming = {
      ...routing,
      type: 'message',
      text: 'Original text',
      customEnvelope: { value: 1 },
      attachments: [
        { contentType: 'image/png', contentUrl: 'https://example.test/image.png' },
        { contentType: ADAPTIVE_CARD_CONTENT_TYPE, content: card, customAttachment: { value: 2 } },
      ],
    };
    const extracted = activityToFlipCards(incoming);
    const entry = extracted.cards[0]!;
    expect(updateActivityCard(extracted.activity, entry.attachmentIndex, entry.manifest)).toEqual(
      incoming,
    );
    const replacement: AdaptiveCard = { ...card, body: [{ type: 'TextBlock', text: 'Updated' }] };
    const updated = updateActivityCard(extracted.activity, 1, { schema: replacement });
    expect(updated).toEqual({
      ...incoming,
      attachments: [incoming.attachments[0], { ...incoming.attachments[1], content: replacement }],
    });
    expect(incoming.attachments[1]?.content).toEqual(card);
    expect(() => updateActivityCard(incoming, 0, { schema: card })).toThrow('inline Adaptive Card');
    expect(() => updateActivityCard(incoming, -1, { schema: card })).toThrow('nonnegative integer');
    expect(() => updateActivityCard(incoming, 9, { schema: card })).toThrow('inline Adaptive Card');
  });
});

describe('Universal Action Model invoke and response bodies', () => {
  const action = {
    type: 'Action.Execute' as const,
    id: 'a1',
    verb: 'approve',
    data: { requestId: 7 },
  };

  it('creates and parses adaptiveCard/action invokes without running any action', () => {
    const invoke = createAdaptiveCardInvoke(action, routing, {
      extensions: { customEnvelope: true },
      valueExtensions: { state: 'opaque', customValue: { enabled: true } },
    });
    expect(invoke.type).toBe('invoke');
    expect(invoke.name).toBe(ADAPTIVE_CARD_ACTION);
    expect(invoke.value).toEqual({
      action,
      trigger: 'manual',
      state: 'opaque',
      customValue: { enabled: true },
    });
    expect(parseAdaptiveCardInvoke(invoke)).toEqual(invoke);
    expect(invoke).not.toHaveProperty('id');
  });

  it('allows optional action id/verb/data and string data as defined by Action.Execute', () => {
    const minimal = createAdaptiveCardInvoke({ type: 'Action.Execute' }, routing);
    expect(parseAdaptiveCardInvoke(minimal).value.action).toEqual({ type: 'Action.Execute' });
    expect(
      createAdaptiveCardInvoke({ type: 'Action.Execute', data: 'opaque' }, routing).value.action
        .data,
    ).toBe('opaque');
  });

  it.each([
    { type: 'message' },
    { name: 'other/action' },
    { value: {} },
    { value: { action: { type: 'Action.Submit' } } },
    { value: { action: { type: 'Action.Execute', verb: 1 } } },
    { value: { action: { type: 'Action.Execute', data: [] } } },
    { value: { action, trigger: 'sometimes' } },
  ])('rejects malformed or unsupported invokes %j', (overrides) => {
    const invoke = createAdaptiveCardInvoke(action, routing);
    expect(() => parseAdaptiveCardInvoke({ ...invoke, ...overrides })).toThrow(
      ActivityValidationError,
    );
  });

  it('builds card, text, and error response bodies with statusCode/type/value', () => {
    expect(createAdaptiveCardInvokeResponse(card)).toEqual({
      statusCode: 200,
      type: ADAPTIVE_CARD_CONTENT_TYPE,
      value: card,
    });
    expect(createMessageInvokeResponse('Approved')).toEqual({
      statusCode: 200,
      type: MESSAGE_CONTENT_TYPE,
      value: 'Approved',
    });
    expect(createErrorInvokeResponse(400, 'BadRequest', 'Invalid input')).toEqual({
      statusCode: 400,
      type: ERROR_CONTENT_TYPE,
      value: { code: 'BadRequest', message: 'Invalid input' },
    });
  });

  it('defaults omitted/null body status to 200 and preserves unknown response extensions', () => {
    expect(
      parseAdaptiveCardInvokeResponse({
        type: MESSAGE_CONTENT_TYPE,
        value: 'ok',
        extension: { nested: 1 },
      }),
    ).toEqual({
      statusCode: 200,
      type: MESSAGE_CONTENT_TYPE,
      value: 'ok',
      extension: { nested: 1 },
    });
    expect(
      parseAdaptiveCardInvokeResponse({
        statusCode: null,
        type: MESSAGE_CONTENT_TYPE,
        value: 'ok',
      }).statusCode,
    ).toBe(200);
  });

  it.each([
    { statusCode: 199, type: MESSAGE_CONTENT_TYPE, value: 'ok' },
    { statusCode: 600, type: MESSAGE_CONTENT_TYPE, value: 'ok' },
    { statusCode: 200.5, type: MESSAGE_CONTENT_TYPE, value: 'ok' },
    { statusCode: '200', type: MESSAGE_CONTENT_TYPE, value: 'ok' },
    { statusCode: 200, type: MESSAGE_CONTENT_TYPE, value: {} },
    { statusCode: 200, type: ADAPTIVE_CARD_CONTENT_TYPE, value: { title: 'not a card' } },
    { statusCode: 400, type: ADAPTIVE_CARD_CONTENT_TYPE, value: card },
    { statusCode: 200, type: MESSAGE_CONTENT_TYPE },
    { statusCode: 401, type: ERROR_CONTENT_TYPE, value: { code: 'Unauthorized' } },
    { statusCode: 200, type: ERROR_CONTENT_TYPE, value: { code: 'BadRequest' } },
    { statusCode: 500, type: ERROR_CONTENT_TYPE, value: null },
    { statusCode: 400, type: ERROR_CONTENT_TYPE, value: { code: 123 } },
    { statusCode: 400, type: ERROR_CONTENT_TYPE, value: { code: 'BadRequest', message: 123 } },
  ])('rejects malformed invoke response bodies %j', (response) => {
    expect(() => parseAdaptiveCardInvokeResponse(response)).toThrow(ActivityValidationError);
  });

  it('dispatches only an explicitly registered verb and validates the handler response', async () => {
    const handler = vi.fn(() => createMessageInvokeResponse('Approved'));
    const handlers = new Map([['approve', handler]]);
    const invoke = createAdaptiveCardInvoke(action, routing);
    parseAdaptiveCardInvoke(invoke);
    expect(handler).not.toHaveBeenCalled();
    expect(await dispatchAdaptiveCardInvoke(invoke, handlers)).toEqual(
      createMessageInvokeResponse('Approved'),
    );
    expect(handler).toHaveBeenCalledExactlyOnceWith(action, invoke);
    const unknown = createAdaptiveCardInvoke({ ...action, verb: 'toString' }, routing);
    expect((await dispatchAdaptiveCardInvoke(unknown, handlers)).statusCode).toBe(400);
    expect(handler).toHaveBeenCalledTimes(1);
    await expect(
      dispatchAdaptiveCardInvoke(
        invoke,
        new Map([
          ['approve', () => ({ statusCode: 200, type: ADAPTIVE_CARD_CONTENT_TYPE, value: {} })],
        ]),
      ),
    ).rejects.toThrow(ActivityValidationError);
  });

  it('preserves unknown response types without claiming to interpret or execute them', () => {
    const response = {
      statusCode: 412,
      type: 'application/vnd.vendor.result',
      value: { opaque: true },
      extension: { details: ['retained'] },
    };
    expect(parseAdaptiveCardInvokeResponse(response)).toEqual(response);
    expect(parseAdaptiveCardInvokeResponse(response).value).not.toBe(response.value);
  });

  it('does not dispatch malformed, missing, or differently-cased verbs', async () => {
    const handler = vi.fn(() => createMessageInvokeResponse('Approved'));
    const handlers = new Map([['approve', handler]]);
    for (const candidate of [{ type: 'Action.Execute' as const }, { ...action, verb: 'Approve' }]) {
      expect(
        (await dispatchAdaptiveCardInvoke(createAdaptiveCardInvoke(candidate, routing), handlers))
          .statusCode,
      ).toBe(400);
    }
    await expect(
      dispatchAdaptiveCardInvoke(
        { ...routing, type: 'invoke', name: ADAPTIVE_CARD_ACTION, value: { action: null } },
        handlers,
      ),
    ).rejects.toThrow(ActivityValidationError);
    expect(handler).not.toHaveBeenCalled();
  });

  it('propagates handler failure without retrying or hiding the failure', async () => {
    const error = new Error('Application failure');
    const handler = vi.fn(() => {
      throw error;
    });
    await expect(
      dispatchAdaptiveCardInvoke(
        createAdaptiveCardInvoke(action, routing),
        new Map([['approve', handler]]),
      ),
    ).rejects.toBe(error);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('requires explicit opt-in before dispatching automatic refresh invokes', async () => {
    const handler = vi.fn(() => createAdaptiveCardInvokeResponse(card));
    const handlers = new Map([['approve', handler]]);
    const invoke = createAdaptiveCardInvoke(action, routing, { trigger: 'automatic' });
    expect(parseAdaptiveCardInvoke(invoke).value.trigger).toBe('automatic');
    expect((await dispatchAdaptiveCardInvoke(invoke, handlers)).statusCode).toBe(400);
    expect(
      (
        await dispatchAdaptiveCardInvoke(invoke, handlers, {
          allowAutomatic: 'false' as unknown as boolean,
        })
      ).statusCode,
    ).toBe(400);
    expect(handler).not.toHaveBeenCalled();
    expect(
      (await dispatchAdaptiveCardInvoke(invoke, handlers, { allowAutomatic: true })).statusCode,
    ).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
