export { DeepSeekClient } from './client.js'
export { listModels } from './models.js'
export { fimCompletion } from './fim.js'
export { chatCompletion } from './chat-completion.js'
export { chatCompletionAnthropic } from './anthropic.js'
export type {
  AnthropicStreamEvent,
  MessageStartEvent,
  ContentBlockStartEvent,
  ContentBlockDeltaEvent,
  ContentBlockStopEvent,
  MessageDeltaEvent,
  MessageStopEvent,
} from './anthropic.js'
export type * from '../types/index.js'
