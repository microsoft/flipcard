import type { FlipCardManifest } from '@microsoft/flipcard-core';
import {
  ADAPTIVE_CARD_CONTENT_TYPE,
  type ActivityReadOptions,
  type ActivityRouting,
  type AdaptedActivity,
  type AdaptiveCard,
  type AdaptiveCardAttachment,
  type MessageOptions,
  type RoutedActivity,
} from './types';
import {
  copyJson,
  fail,
  object,
  parseActivity,
  parseActivityEnvelope,
  parseActivityRouting,
  parseAdaptiveCard,
  string,
} from './validation';

/**
 * Use the same payload precedence as FlipCard's React renderer. Opaque design/schema
 * descriptors are not Adaptive Cards and are never relabeled with the card MIME type.
 */
export function adaptiveCardFromManifest(manifest: FlipCardManifest): AdaptiveCard {
  const record = object(copyJson(manifest), '$.manifest');
  for (const key of ['$schema', 'version', 'id', 'title']) {
    if (key in record) string(record[key], `$.manifest.${key}`);
  }
  const design = record.design;
  if (design && typeof design === 'object' && !Array.isArray(design) && 'adaptiveCard' in design) {
    return parseAdaptiveCard(design.adaptiveCard);
  }
  if (record.schema && typeof record.schema === 'object' && !Array.isArray(record.schema)) {
    return parseAdaptiveCard(record.schema);
  }
  return fail('$.manifest', 'expected an AdaptiveCard in design.adaptiveCard or schema');
}

export function adaptiveCardToManifest(
  card: AdaptiveCard,
  options: { id?: string; title?: string } = {},
): FlipCardManifest {
  const manifest: FlipCardManifest = { schema: parseAdaptiveCard(card) };
  if (options.id !== undefined) {
    string(options.id, '$.id');
    manifest.id = options.id;
  }
  if (options.title !== undefined) {
    string(options.title, '$.title');
    manifest.title = options.title;
  }
  return manifest;
}

export function createAdaptiveCardAttachment(
  card: AdaptiveCard,
  options: { name?: string; extensions?: Record<string, unknown> } = {},
): AdaptiveCardAttachment {
  const extensions = checkedExtensions(options.extensions, [
    'contentType',
    'content',
    'contentUrl',
    'name',
  ]);
  const attachment: AdaptiveCardAttachment = {
    ...extensions,
    contentType: ADAPTIVE_CARD_CONTENT_TYPE,
    content: parseAdaptiveCard(card),
  };
  if (options.name !== undefined) {
    string(options.name, '$.name');
    attachment.name = options.name;
  }
  parseActivityEnvelope({ type: 'message', attachments: [attachment] });
  return attachment;
}

/** Reading never fetches external content or executes card actions. */
export function activityToFlipCards(
  value: unknown,
  options: ActivityReadOptions = {},
): AdaptedActivity {
  const activity = parseActivity(value, options);
  const result: AdaptedActivity = { activity, cards: [], unsupportedAttachments: [] };
  if (activity.type !== 'message') return result;
  if (activity.text !== undefined) result.text = activity.text;
  activity.attachments?.forEach((attachment, attachmentIndex) => {
    if (attachment.contentType !== ADAPTIVE_CARD_CONTENT_TYPE || !('content' in attachment)) {
      result.unsupportedAttachments.push({
        attachmentIndex,
        attachment,
        reason:
          attachment.contentType === ADAPTIVE_CARD_CONTENT_TYPE
            ? 'external-card-content'
            : 'unsupported-content-type',
      });
      return;
    }
    const card = parseAdaptiveCard(attachment.content);
    result.cards.push({
      attachmentIndex,
      attachment: attachment as AdaptiveCardAttachment,
      manifest: adaptiveCardToManifest(card, { title: attachment.name }),
    });
  });
  return result;
}

/** Replace only an inline card payload, preserving the envelope and all attachment extensions. */
export function updateActivityCard(
  value: unknown,
  attachmentIndex: number,
  manifest: FlipCardManifest,
  options: ActivityReadOptions = {},
): RoutedActivity {
  const activity = parseActivity(value, options);
  if (activity.type !== 'message') fail('$.type', 'expected message');
  if (!Number.isInteger(attachmentIndex) || attachmentIndex < 0) {
    fail('$.attachmentIndex', 'expected a nonnegative integer');
  }
  const attachment = activity.attachments?.[attachmentIndex];
  if (
    !attachment ||
    attachment.contentType !== ADAPTIVE_CARD_CONTENT_TYPE ||
    !('content' in attachment)
  ) {
    fail(`$.attachments[${attachmentIndex}]`, 'expected an inline Adaptive Card attachment');
  }
  attachment.content = adaptiveCardFromManifest(manifest);
  return activity;
}

export function checkedExtensions(
  input: Record<string, unknown> | undefined,
  reserved: string[],
): Record<string, unknown> {
  if (input === undefined) return {};
  const extensions = object(copyJson(input), '$.extensions');
  for (const key of reserved) {
    if (key in extensions) fail(`$.extensions.${key}`, 'use the explicit parameter instead');
  }
  return extensions;
}

export const RESERVED_ACTIVITY_FIELDS = [
  'type',
  'channelId',
  'conversation',
  'from',
  'recipient',
  'serviceUrl',
  'replyToId',
  'text',
  'attachments',
  'name',
  'value',
];

export function createMessageActivity(
  routing: ActivityRouting,
  options: MessageOptions = {},
): RoutedActivity & { type: 'message' } {
  const activity: Record<string, unknown> = {
    ...checkedExtensions(options.extensions, RESERVED_ACTIVITY_FIELDS),
    ...parseActivityRouting(routing, { direction: 'outgoing' }),
    type: 'message',
  };
  if (options.text !== undefined) activity.text = options.text;
  if (options.attachments !== undefined) activity.attachments = options.attachments;
  return parseActivity(activity, { direction: 'outgoing' }) as RoutedActivity & { type: 'message' };
}

export function createAdaptiveCardMessage(
  card: AdaptiveCard,
  routing: ActivityRouting,
  options: Omit<MessageOptions, 'attachments'> & { name?: string } = {},
): RoutedActivity & { type: 'message' } {
  return createMessageActivity(routing, {
    text: options.text,
    extensions: options.extensions,
    attachments: [createAdaptiveCardAttachment(card, { name: options.name })],
  });
}

export function createFlipCardMessage(
  manifest: FlipCardManifest,
  routing: ActivityRouting,
  options: Omit<MessageOptions, 'attachments'> = {},
): RoutedActivity & { type: 'message' } {
  return createAdaptiveCardMessage(adaptiveCardFromManifest(manifest), routing, {
    ...options,
    name: manifest.title,
  });
}
