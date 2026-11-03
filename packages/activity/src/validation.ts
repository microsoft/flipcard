import type {
  ActivityEnvelope,
  ActivityReadOptions,
  ActivityRouting,
  AdaptiveCard,
  AdaptiveCardExecuteAction,
  RoutedActivity,
} from './types';
import { ADAPTIVE_CARD_CONTENT_TYPE } from './types';

export class ActivityValidationError extends TypeError {
  constructor(
    public readonly path: string,
    message: string,
  ) {
    super(`${path}: ${message}`);
    this.name = 'ActivityValidationError';
  }
}

export function fail(path: string, message: string): never {
  throw new ActivityValidationError(path, message);
}

export function object(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail(path, 'expected an object');
  }
  return value as Record<string, unknown>;
}

export function string(value: unknown, path: string, nonempty = false): asserts value is string {
  if (typeof value !== 'string' || (nonempty && !value.trim())) {
    fail(path, nonempty ? 'expected a nonempty string' : 'expected a string');
  }
}

function optionalStrings(value: Record<string, unknown>, keys: string[], path: string): void {
  for (const key of keys) {
    if (key in value) string(value[key], `${path}.${key}`);
  }
}

/** Clone JSON without a stripping schema, preserving extension fields at every depth (A2005). */
export function copyJson(value: unknown, path = '$', ancestors = new Set<object>()): unknown {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'object' || !value) fail(path, 'expected a JSON value');
  if (ancestors.has(value)) fail(path, 'cyclic data is not JSON');
  if (ancestors.size >= 128) fail(path, 'JSON nesting exceeds 128 levels');
  if (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    fail(path, 'expected a plain JSON object');
  }
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      return Array.from({ length: value.length }, (_, index) => {
        const descriptor = Object.getOwnPropertyDescriptor(value, index);
        if (!descriptor || !('value' in descriptor)) {
          fail(`${path}[${index}]`, 'sparse arrays and accessors are not JSON');
        }
        return copyJson(descriptor.value, `${path}[${index}]`, ancestors);
      });
    }
    return Object.fromEntries(
      Object.keys(value).map((key) => {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!descriptor || !('value' in descriptor))
          fail(`${path}.${key}`, 'accessors are not JSON');
        return [key, copyJson(descriptor.value, `${path}.${key}`, ancestors)];
      }),
    );
  } finally {
    ancestors.delete(value);
  }
}

function account(value: unknown, path: string, conversation = false): void {
  const record = object(value, path);
  string(record.id, `${path}.id`, true);
  optionalStrings(
    record,
    conversation ? ['name', 'conversationType', 'tenantId'] : ['name', 'role', 'aadObjectId'],
    path,
  );
  if (conversation) {
    if ('isGroup' in record && typeof record.isGroup !== 'boolean') {
      fail(`${path}.isGroup`, 'expected a boolean');
    }
  }
}

export function validateExecuteAction(value: unknown, path: string): AdaptiveCardExecuteAction {
  const action = object(value, path);
  if (action.type !== 'Action.Execute') fail(`${path}.type`, 'expected Action.Execute');
  optionalStrings(action, ['id', 'verb', 'title'], path);
  if ('data' in action && typeof action.data !== 'string') object(action.data, `${path}.data`);
  return action as AdaptiveCardExecuteAction;
}

function cardAction(value: unknown, path: string): void {
  const action = object(value, path);
  string(action.type, `${path}.type`, true);
  if (!action.type.startsWith('Action.')) fail(`${path}.type`, 'expected an Adaptive Card action');
  optionalStrings(action, ['id', 'title'], path);
  if (action.type === 'Action.Execute') validateExecuteAction(action, path);
  if (action.type === 'Action.OpenUrl') string(action.url, `${path}.url`, true);
  if (action.type === 'Action.ShowCard') validateCard(action.card, `${path}.card`, false);
  if ('fallback' in action && typeof action.fallback !== 'string') {
    cardAction(action.fallback, `${path}.fallback`);
  }
}

function cardElements(value: unknown, path: string): void {
  if (!Array.isArray(value)) fail(path, 'expected an array');
  value.forEach((entry, index) => {
    const itemPath = `${path}[${index}]`;
    const item = object(entry, itemPath);
    string(item.type, `${itemPath}.type`, true);
    // Unknown element types can assign their own meaning to fields such as items/actions.
    if ((item.type === 'Container' || item.type === 'Column') && 'items' in item) {
      cardElements(item.items, `${itemPath}.items`);
    }
    if (item.type === 'ColumnSet' && 'columns' in item) {
      cardElements(item.columns, `${itemPath}.columns`);
    }
    if (item.type === 'ActionSet' && 'actions' in item) {
      cardActions(item.actions, `${itemPath}.actions`);
    }
    if (
      ['Container', 'Column', 'ColumnSet', 'Image'].includes(item.type) &&
      'selectAction' in item
    ) {
      cardAction(item.selectAction, `${itemPath}.selectAction`);
    }
    if (item.type === 'TextBlock') string(item.text, `${itemPath}.text`);
  });
}

function cardActions(value: unknown, path: string): void {
  if (!Array.isArray(value)) fail(path, 'expected an array');
  value.forEach((entry, index) => cardAction(entry, `${path}[${index}]`));
}

function validateCard(value: unknown, path: string, requireVersion = true): AdaptiveCard {
  const card = object(value, path);
  if (card.type !== 'AdaptiveCard') fail(`${path}.type`, 'expected AdaptiveCard');
  if (requireVersion || 'version' in card) {
    string(card.version, `${path}.version`);
    if (!/^\d+\.\d+$/.test(card.version)) fail(`${path}.version`, 'expected major.minor');
  }
  if ('body' in card) cardElements(card.body, `${path}.body`);
  if ('actions' in card) cardActions(card.actions, `${path}.actions`);
  if ('selectAction' in card) cardAction(card.selectAction, `${path}.selectAction`);
  if ('refresh' in card) {
    const refresh = object(card.refresh, `${path}.refresh`);
    validateExecuteAction(refresh.action, `${path}.refresh.action`);
    if ('userIds' in refresh) {
      if (!Array.isArray(refresh.userIds)) fail(`${path}.refresh.userIds`, 'expected an array');
      refresh.userIds.forEach((id, index) => string(id, `${path}.refresh.userIds[${index}]`));
    }
  }
  return card as AdaptiveCard;
}

export function parseAdaptiveCard(value: unknown): AdaptiveCard {
  return validateCard(copyJson(value), '$');
}

/**
 * Validate the supported wire boundary, not every activity subtype. New activity types and
 * unknown extension fields are preserved, including primitive channelData (A2200).
 * No routing is inferred from an HTTP URL.
 */
export function parseActivityEnvelope(value: unknown): ActivityEnvelope {
  const activity = object(copyJson(value), '$');
  string(activity.type, '$.type');
  optionalStrings(
    activity,
    [
      'id',
      'channelId',
      'serviceUrl',
      'replyToId',
      'text',
      'name',
      'locale',
      'textFormat',
      'attachmentLayout',
      'summary',
      'speak',
      'inputHint',
      'timestamp',
      'localTimestamp',
      'localTimezone',
      'valueType',
      'label',
      'code',
      'deliveryMode',
      'action',
    ],
    '$',
  );
  for (const key of ['from', 'recipient', 'conversation']) {
    if (key in activity) account(activity[key], `$.${key}`, key === 'conversation');
  }
  if ('entities' in activity) {
    if (!Array.isArray(activity.entities)) fail('$.entities', 'expected an array');
    activity.entities.forEach((entry, index) => {
      const entity = object(entry, `$.entities[${index}]`);
      string(entity.type, `$.entities[${index}].type`, true);
    });
  }
  if ('attachments' in activity) {
    if (!Array.isArray(activity.attachments)) fail('$.attachments', 'expected an array');
    activity.attachments.forEach((value, index) => {
      const path = `$.attachments[${index}]`;
      const attachment = object(value, path);
      string(attachment.contentType, `${path}.contentType`, true);
      optionalStrings(attachment, ['contentUrl', 'thumbnailUrl', 'name'], path);
      if (!('content' in attachment) && !attachment.contentUrl) {
        fail(path, 'expected content or contentUrl');
      }
      if (attachment.contentType === ADAPTIVE_CARD_CONTENT_TYPE && 'content' in attachment) {
        validateCard(attachment.content, `${path}.content`);
      }
    });
  }
  return activity as ActivityEnvelope;
}

export function parseActivityRouting(
  value: unknown,
  options: ActivityReadOptions = {},
): ActivityRouting {
  if (
    options.direction !== undefined &&
    options.direction !== 'incoming' &&
    options.direction !== 'outgoing'
  ) {
    fail('$.options.direction', 'expected incoming or outgoing');
  }
  if (
    options.profile !== undefined &&
    options.profile !== 'adapter' &&
    options.profile !== 'channel-to-agent'
  ) {
    fail('$.options.profile', 'expected adapter or channel-to-agent');
  }
  if (options.profile === 'channel-to-agent' && options.direction === 'outgoing') {
    fail('$.options.direction', 'channel-to-agent requires incoming direction');
  }
  const routing = object(copyJson(value), '$');
  string(routing.channelId, '$.channelId', true);
  account(routing.conversation, '$.conversation', true);
  account(routing.from, '$.from');
  if (options.direction !== 'outgoing' || 'recipient' in routing) {
    account(routing.recipient, '$.recipient');
  }
  optionalStrings(routing, ['serviceUrl', 'replyToId'], '$');
  if (options.profile === 'channel-to-agent') {
    string(routing.serviceUrl, '$.serviceUrl', true);
  }
  return Object.fromEntries(
    ['channelId', 'conversation', 'from', 'recipient', 'serviceUrl', 'replyToId']
      .filter((key) => key in routing)
      .map((key) => [key, routing[key]]),
  ) as unknown as ActivityRouting;
}

export function parseActivity(value: unknown, options: ActivityReadOptions = {}): RoutedActivity {
  const activity = parseActivityEnvelope(value);
  parseActivityRouting(activity, options);
  return activity as RoutedActivity;
}

export function serializeActivity(value: ActivityEnvelope): string {
  return JSON.stringify(parseActivityEnvelope(value));
}
