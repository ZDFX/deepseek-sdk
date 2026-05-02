import { DeepSeekClient } from './client.js'
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
} from '../types/chat-completion.js'
import { preprocessMessages, hasPrefix } from './chat-completion.js'

// ============================================================
// Anthropic 风格流式事件类型
// ============================================================

export type AnthropicStreamEvent =
  | MessageStartEvent
  | ContentBlockStartEvent
  | ContentBlockDeltaEvent
  | ContentBlockStopEvent
  | MessageDeltaEvent
  | MessageStopEvent

export interface MessageStartEvent {
  type: 'message_start'
  message: {
    id: string
    type: 'message'
    role: 'assistant'
    content: never[]
    model: string
    stop_reason: null
    stop_sequence: null
    usage: { input_tokens: number }
  }
}

export interface ContentBlockStartEvent {
  type: 'content_block_start'
  index: number
  content_block: ContentBlockStart
}

export type ContentBlockStart =
  | { type: 'text'; text: '' }
  | { type: 'thinking'; thinking: ''; signature: '' }
  | { type: 'tool_use'; id: string; name: string; input: {} }

export interface ContentBlockDeltaEvent {
  type: 'content_block_delta'
  index: number
  delta: ContentBlockDelta
}

export type ContentBlockDelta =
  | { type: 'text_delta'; text: string }
  | { type: 'thinking_delta'; thinking: string }
  | { type: 'input_json_delta'; partial_json: string }

export interface ContentBlockStopEvent {
  type: 'content_block_stop'
  index: number
}

export interface MessageDeltaEvent {
  type: 'message_delta'
  delta: { stop_reason: string; stop_sequence: null }
  usage: { output_tokens: number }
}

export interface MessageStopEvent {
  type: 'message_stop'
}

// ============================================================
// 状态机适配器：DeepSeek 流 → Anthropic 事件
// ============================================================

type BlockType = 'thinking' | 'text' | 'tool_use'
type State =
  | { phase: 'init' }
  | { phase: 'active'; blockIndex: number; blockType: BlockType }
  | { phase: 'closed' }

interface ToolCallState {
  id: string
  name: string
  sent: string
}

function mapStopReason(reason: string): string {
  switch (reason) {
    case 'stop':
      return 'end_turn'
    case 'tool_calls':
      return 'tool_use'
    case 'length':
      return 'max_tokens'
    default:
      return reason
  }
}

async function* toAnthropicStream(
  chunks: AsyncGenerator<ChatCompletionChunk>,
  requestModel: string,
): AsyncGenerator<AnthropicStreamEvent> {
  let state: State = { phase: 'init' }
  let blockIndex = 0
  let messageId = ''
  let model = requestModel
  let finishReason: string | null = null
  let outputTokens = 0

  const toolStates = new Map<number, ToolCallState>()

  for await (const chunk of chunks) {
    if (state.phase === 'init') {
      messageId = chunk.id
      model = chunk.model || model
      state = { phase: 'active', blockIndex: 0, blockType: 'thinking' }
      yield {
        type: 'message_start',
        message: {
          id: messageId,
          type: 'message',
          role: 'assistant',
          content: [],
          model,
          stop_reason: null,
          stop_sequence: null,
          usage: { input_tokens: 0 },
        },
      }
    }

    const delta = chunk.choices[0]?.delta
    if (!delta) continue
    if (state.phase !== 'active') continue

    // reasoning_content → thinking block
    if (delta.reasoning_content) {
      if (state.blockType !== 'thinking') {
        if (state.blockType) {
          yield { type: 'content_block_stop', index: state.blockIndex }
          blockIndex++
        }
        state = { phase: 'active', blockIndex, blockType: 'thinking' }
        yield {
          type: 'content_block_start',
          index: blockIndex,
          content_block: { type: 'thinking', thinking: '', signature: '' },
        }
      }
      yield {
        type: 'content_block_delta',
        index: state.blockIndex,
        delta: { type: 'thinking_delta', thinking: delta.reasoning_content },
      }
    }

    // content → text block
    if (delta.content) {
      if (state.blockType !== 'text') {
        if (state.blockType) {
          yield { type: 'content_block_stop', index: state.blockIndex }
          blockIndex++
        }
        state = { phase: 'active', blockIndex, blockType: 'text' }
        yield {
          type: 'content_block_start',
          index: blockIndex,
          content_block: { type: 'text', text: '' },
        }
      }
      yield {
        type: 'content_block_delta',
        index: state.blockIndex,
        delta: { type: 'text_delta', text: delta.content },
      }
    }

    // tool_calls → tool_use blocks
    if (delta.tool_calls?.length) {
      for (const tc of delta.tool_calls) {
        const ti = tc.index ?? 0

        if (!toolStates.has(ti)) {
          if (state.blockType) {
            yield { type: 'content_block_stop', index: state.blockIndex }
            blockIndex++
          }
          toolStates.set(ti, { id: tc.id, name: tc.function?.name ?? '', sent: '' })
          state = { phase: 'active', blockIndex, blockType: 'tool_use' }
          yield {
            type: 'content_block_start',
            index: blockIndex,
            content_block: { type: 'tool_use', id: tc.id, name: tc.function?.name ?? '', input: {} },
          }
        }

        const toolState = toolStates.get(ti)!
        const args = tc.function?.arguments ?? ''
        if (args.length > toolState.sent.length) {
          const partial = args.slice(toolState.sent.length)
          toolState.sent = args
          yield {
            type: 'content_block_delta',
            index: state.blockIndex,
            delta: { type: 'input_json_delta', partial_json: partial },
          }
        }
      }
    }

    if (chunk.choices[0]?.finish_reason) {
      finishReason = chunk.choices[0].finish_reason
    }
    if (chunk.usage) {
      outputTokens = chunk.usage.completion_tokens ?? outputTokens
    }
  }

  if (state.phase === 'active' && state.blockType) {
    yield { type: 'content_block_stop', index: state.blockIndex }
    blockIndex++
  }

  yield {
    type: 'message_delta',
    delta: { stop_reason: mapStopReason(finishReason ?? ''), stop_sequence: null },
    usage: { output_tokens: outputTokens },
  }

  yield { type: 'message_stop' }
}

// ============================================================
// Anthropic 风格流式入口
// ============================================================

export function chatCompletionAnthropic(
  client: DeepSeekClient,
  request: ChatCompletionRequest & { stream?: false | null },
): Promise<ChatCompletionResponse>

export function chatCompletionAnthropic(
  client: DeepSeekClient,
  request: ChatCompletionRequest & { stream: true },
): AsyncGenerator<AnthropicStreamEvent>

export function chatCompletionAnthropic(
  client: DeepSeekClient,
  request: ChatCompletionRequest,
): Promise<ChatCompletionResponse> | AsyncGenerator<AnthropicStreamEvent> {
  const messages = preprocessMessages(request.messages, request.thinking)
  const body = { ...request, messages }
  const path = hasPrefix(request.messages) ? '/beta/chat/completions' : '/chat/completions'

  if (!request.stream) {
    return client.post<ChatCompletionResponse>(path, body)
  }

  const chunks = client.postStream<ChatCompletionChunk>(path, body)
  return toAnthropicStream(chunks, request.model)
}
