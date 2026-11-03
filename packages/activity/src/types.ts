import type { FlipCardManifest } from '@microsoft/flipcard-core';

export const ADAPTIVE_CARD_CONTENT_TYPE = 'application/vnd.microsoft.card.adaptive';
export const MESSAGE_CONTENT_TYPE = 'application/vnd.microsoft.activity.message';
export const ERROR_CONTENT_TYPE = 'application/vnd.microsoft.error';
export const ADAPTIVE_CARD_ACTION = 'adaptiveCard/action';

export interface ChannelAccount extends Record<string, unknown> {
  id: string;
  name?: string;
  role?: string;
}

export interface ConversationAccount extends Record<string, unknown> {
  id: string;
  name?: string;
  isGroup?: boolean;
  conversationType?: string;
}

/** Explicit routing for the transport-free adapter; use the channel-to-agent profile for A2300. */
export interface ActivityRouting {
  channelId: string;
  conversation: ConversationAccount;
  from: ChannelAccount;
  recipient?: ChannelAccount;
  serviceUrl?: string;
  replyToId?: string;
}

export interface ActivityAttachment extends Record<string, unknown> {
  contentType: string;
  content?: unknown;
  contentUrl?: string;
  thumbnailUrl?: string;
  name?: string;
}

/** JSON wire shape, not an authenticated or fully implemented channel activity. */
export interface ActivityEnvelope extends Record<string, unknown> {
  type: string;
  id?: string;
  channelId?: string;
  conversation?: ConversationAccount;
  from?: ChannelAccount;
  recipient?: ChannelAccount;
  serviceUrl?: string;
  replyToId?: string;
  text?: string;
  attachments?: ActivityAttachment[];
  name?: string;
  value?: unknown;
}

export type RoutedActivity = ActivityEnvelope & ActivityRouting;

export interface ActivityReadOptions {
  /** Incoming single-recipient messages require recipient.id; outgoing messages do not. */
  direction?: 'incoming' | 'outgoing';
  /**
   * Default adapter profile requires explicit routing, but no transport endpoint.
   * channel-to-agent additionally requires serviceUrl (A2300) and incoming direction.
   * Neither profile authenticates the envelope or trusts the supplied serviceUrl.
   */
  profile?: 'adapter' | 'channel-to-agent';
}

/** Structural card boundary only; host-specific element/version support remains with the renderer. */
export interface AdaptiveCard extends Record<string, unknown> {
  type: 'AdaptiveCard';
  version: string;
  body?: Array<Record<string, unknown> & { type: string }>;
  actions?: Array<Record<string, unknown> & { type: string }>;
}

export interface AdaptiveCardAttachment extends ActivityAttachment {
  contentType: typeof ADAPTIVE_CARD_CONTENT_TYPE;
  content: AdaptiveCard;
}

export interface ActivityFlipCard {
  attachmentIndex: number;
  attachment: AdaptiveCardAttachment;
  manifest: FlipCardManifest;
}

export interface AdaptedActivity {
  /** Original validated envelope, including unknown fields and unsupported attachments. */
  activity: RoutedActivity;
  text?: string;
  cards: ActivityFlipCard[];
  unsupportedAttachments: Array<{
    attachmentIndex: number;
    attachment: ActivityAttachment;
    reason: 'unsupported-content-type' | 'external-card-content';
  }>;
}

export interface MessageOptions {
  text?: string;
  attachments?: ActivityAttachment[];
  /** Protocol extensions cannot override type, routing, text, or attachments. */
  extensions?: Record<string, unknown>;
}

export interface AdaptiveCardExecuteAction extends Record<string, unknown> {
  type: 'Action.Execute';
  id?: string;
  verb?: string;
  data?: string | Record<string, unknown>;
}

export interface AdaptiveCardInvokeValue extends Record<string, unknown> {
  action: AdaptiveCardExecuteAction;
  trigger?: 'manual' | 'automatic';
}

export interface AdaptiveCardInvokeActivity extends RoutedActivity {
  type: 'invoke';
  name: typeof ADAPTIVE_CARD_ACTION;
  value: AdaptiveCardInvokeValue;
}

/** The invoke response body. This is NOT an HTTP response or an invokeResponse activity. */
export interface AdaptiveCardInvokeResponse extends Record<string, unknown> {
  statusCode: number;
  type: string;
  value: unknown;
}

export type AdaptiveCardActionHandler = (
  action: AdaptiveCardExecuteAction,
  activity: AdaptiveCardInvokeActivity,
) => AdaptiveCardInvokeResponse | Promise<AdaptiveCardInvokeResponse>;
