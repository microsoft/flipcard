import { checkedExtensions, RESERVED_ACTIVITY_FIELDS } from './cards';
import {
  ADAPTIVE_CARD_ACTION,
  ADAPTIVE_CARD_CONTENT_TYPE,
  ERROR_CONTENT_TYPE,
  MESSAGE_CONTENT_TYPE,
  type ActivityReadOptions,
  type ActivityRouting,
  type AdaptiveCard,
  type AdaptiveCardActionHandler,
  type AdaptiveCardExecuteAction,
  type AdaptiveCardInvokeActivity,
  type AdaptiveCardInvokeResponse,
} from './types';
import {
  copyJson,
  fail,
  object,
  parseActivity,
  parseActivityRouting,
  parseAdaptiveCard,
  string,
  validateExecuteAction,
} from './validation';

/** Parse only; authentication, authorization, deduplication and dispatch belong to the caller. */
export function parseAdaptiveCardInvoke(
  value: unknown,
  options: ActivityReadOptions = {},
): AdaptiveCardInvokeActivity {
  const activity = parseActivity(value, options);
  if (activity.type !== 'invoke') fail('$.type', 'expected invoke');
  if (activity.name !== ADAPTIVE_CARD_ACTION) fail('$.name', `expected ${ADAPTIVE_CARD_ACTION}`);
  const invoke = object(activity.value, '$.value');
  validateExecuteAction(invoke.action, '$.value.action');
  if ('trigger' in invoke && invoke.trigger !== 'manual' && invoke.trigger !== 'automatic') {
    fail('$.value.trigger', 'expected manual or automatic');
  }
  return activity as AdaptiveCardInvokeActivity;
}

export function createAdaptiveCardInvoke(
  action: AdaptiveCardExecuteAction,
  routing: ActivityRouting,
  options: {
    trigger?: 'manual' | 'automatic';
    extensions?: Record<string, unknown>;
    valueExtensions?: Record<string, unknown>;
  } = {},
): AdaptiveCardInvokeActivity {
  return parseAdaptiveCardInvoke(
    {
      ...checkedExtensions(options.extensions, RESERVED_ACTIVITY_FIELDS),
      ...parseActivityRouting(routing, { direction: 'outgoing' }),
      type: 'invoke',
      name: ADAPTIVE_CARD_ACTION,
      value: {
        ...checkedExtensions(options.valueExtensions, ['action', 'trigger']),
        action,
        trigger: options.trigger ?? 'manual',
      },
    },
    { direction: 'outgoing' },
  );
}

/**
 * Parse the Universal Action Model's response BODY. The containing HTTP response, if any,
 * must use HTTP 200 after application processing; this library does not open a listener.
 * Omitted/null statusCode defaults to 200 per the Universal Action Model.
 * Unrecognized MIME types are retained as opaque payloads, not interpreted as card/message/error.
 */
export function parseAdaptiveCardInvokeResponse(value: unknown): AdaptiveCardInvokeResponse {
  const response = object(copyJson(value), '$');
  const statusCode = response.statusCode ?? 200;
  if (
    typeof statusCode !== 'number' ||
    !Number.isInteger(statusCode) ||
    statusCode < 200 ||
    statusCode > 599
  ) {
    fail('$.statusCode', 'expected an integer from 200 through 599');
  }
  string(response.type, '$.type', true);
  if (!('value' in response)) fail('$.value', 'required');
  if (response.type === ADAPTIVE_CARD_CONTENT_TYPE) {
    if (statusCode !== 200) fail('$.statusCode', 'card responses require 200');
    parseAdaptiveCard(response.value);
  } else if (response.type === MESSAGE_CONTENT_TYPE) {
    if (statusCode !== 200) fail('$.statusCode', 'message responses require 200');
    string(response.value, '$.value');
  } else if (response.type === ERROR_CONTENT_TYPE) {
    if (statusCode !== 400 && statusCode !== 500) {
      fail('$.statusCode', 'application/vnd.microsoft.error responses require 400 or 500');
    }
    const error = object(response.value, '$.value');
    string(error.code, '$.value.code', true);
    if ('message' in error) string(error.message, '$.value.message');
  }
  return { ...response, statusCode } as AdaptiveCardInvokeResponse;
}

export function createAdaptiveCardInvokeResponse(card: AdaptiveCard): AdaptiveCardInvokeResponse {
  return parseAdaptiveCardInvokeResponse({
    statusCode: 200,
    type: ADAPTIVE_CARD_CONTENT_TYPE,
    value: card,
  });
}

export function createMessageInvokeResponse(text: string): AdaptiveCardInvokeResponse {
  return parseAdaptiveCardInvokeResponse({
    statusCode: 200,
    type: MESSAGE_CONTENT_TYPE,
    value: text,
  });
}

export function createErrorInvokeResponse(
  statusCode: 400 | 500,
  code: string,
  message: string,
): AdaptiveCardInvokeResponse {
  return parseAdaptiveCardInvokeResponse({
    statusCode,
    type: ERROR_CONTENT_TYPE,
    value: { code, message },
  });
}

/**
 * Explicit, opt-in dispatch to an exact verb allowlist. Parsing/rendering does not call this.
 * There is no implicit workflow execution, URL navigation, or network transport.
 */
export async function dispatchAdaptiveCardInvoke(
  input: unknown,
  handlers: ReadonlyMap<string, AdaptiveCardActionHandler>,
  options: ActivityReadOptions & { allowAutomatic?: boolean } = {},
): Promise<AdaptiveCardInvokeResponse> {
  const activity = parseAdaptiveCardInvoke(input, options);
  if (activity.value.trigger === 'automatic' && options.allowAutomatic !== true) {
    return createErrorInvokeResponse(
      400,
      'AutomaticActionNotAllowed',
      'Automatic refresh requires explicit opt-in.',
    );
  }
  const verb = activity.value.action.verb;
  const handler = verb === undefined ? undefined : handlers.get(verb);
  if (!handler)
    return createErrorInvokeResponse(
      400,
      'UnknownAction',
      'No handler is registered for this action.',
    );
  return parseAdaptiveCardInvokeResponse(await handler(activity.value.action, activity));
}
