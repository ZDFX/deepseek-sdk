import type {
  ChatCompletionChunk,
  ChatMessage,
} from '../../types/chat-completion'
import type {
  StreamEvent,
} from '../../types/event-stream'

// ============================================================
// 状态机：DeepSeek 原始 chunk → 结构化事件（按 type 分发）
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

interface PrefixInput {
  reasoning_content?: string | null | undefined
  content?: string | null | undefined
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

export async function* toEventStream(
  chunks: AsyncGenerator<ChatCompletionChunk>,
  requestModel: string,
  prefix?: PrefixInput,
): AsyncGenerator<StreamEvent> {
  let state: State = { phase: 'init' }
  let blockIndex = 0
  let messageId = ''
  let model = requestModel
  let finishReason: string | null = null
  let outputTokens = 0
  let prefixContentSent = false

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

      // 注入 reasoning_content 前缀（在第一个 chunk 到达前）
      if (prefix?.reasoning_content) {
        state = { phase: 'active', blockIndex, blockType: 'thinking' }
        yield {
          type: 'content_block_start',
          index: blockIndex,
          content_block: { type: 'thinking', thinking: '', signature: '' },
        }
        yield {
          type: 'content_block_delta',
          index: blockIndex,
          delta: { type: 'thinking_delta', thinking: prefix.reasoning_content },
        }
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

        // 如果 thinking block 从未被打开（flash 模式），但在 init 时又没发送 reasoning 前缀
        // 这种情况下 prefix content 应该在下面的 text block 中处理
        state = { phase: 'active', blockIndex, blockType: 'text' }
        yield {
          type: 'content_block_start',
          index: blockIndex,
          content_block: { type: 'text', text: '' },
        }

        // 注入 content 前缀（在第一个 text delta 前）
        if (prefix?.content && !prefixContentSent) {
          yield {
            type: 'content_block_delta',
            index: blockIndex,
            delta: { type: 'text_delta', text: prefix.content },
          }
          prefixContentSent = true
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

export function extractPrefix(messages: ChatMessage[]): PrefixInput | undefined {
  const last = messages.at(-1)
  if (last?.role === 'assistant' && last.prefix === true) {
    return {
      reasoning_content: last.reasoning_content,
      content: last.content,
    }
  }
  return undefined
}

