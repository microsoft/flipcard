/**
 * Transport-free JSON adapters for Microsoft 365 Agents Activity Protocol and Adaptive Cards.
 * Structural wire types do not require a published SDK package or imply host support for every card.
 * Parsing never fetches attachments, opens URLs, or executes actions; dispatch is explicitly opt-in.
 *
 * @see https://github.com/microsoft/Agents/blob/main/specs/activity/protocol-activity.md
 * @see https://learn.microsoft.com/en-us/adaptive-cards/authoring-cards/universal-action-model
 */
export * from './types';
export {
  ActivityValidationError,
  parseActivity,
  parseActivityEnvelope,
  parseActivityRouting,
  parseAdaptiveCard,
  serializeActivity,
} from './validation';
export {
  activityToFlipCards,
  adaptiveCardFromManifest,
  adaptiveCardToManifest,
  createAdaptiveCardAttachment,
  createAdaptiveCardMessage,
  createFlipCardMessage,
  createMessageActivity,
  updateActivityCard,
} from './cards';
export {
  createAdaptiveCardInvoke,
  createAdaptiveCardInvokeResponse,
  createErrorInvokeResponse,
  createMessageInvokeResponse,
  dispatchAdaptiveCardInvoke,
  parseAdaptiveCardInvoke,
  parseAdaptiveCardInvokeResponse,
} from './actions';
