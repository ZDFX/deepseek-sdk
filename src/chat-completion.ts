import { DeepSeekClient } from './client'
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  ChatMessage,
} from '../types/chat-completion'

// ============================================================
// Messages 预处理
// ============================================================

/**
 * 检测请求是否使用了对话前缀续写（Beta）功能。
 * 规则：messages 最后一条必须是 assistant 且 prefix 为 true。
 */
export function hasPrefix(messages: ChatMessage[]): boolean {
  const last = messages.at(-1)
  return last?.role === 'assistant' && last.prefix === true
}

/**
 * 根据 prefix / 思考模式状态预处理 messages。
 *
 * - prefix 模式：验证最后一条消息为 assistant 且 prefix=true
 * - 思考模式开启（默认）：保留 `reasoning_content`，API 自行判断
 * - 思考模式关闭：剥离 `reasoning_content` 以节省 token
 */
export function preprocessMessages(
  messages: ChatMessage[],
  thinking: ChatCompletionRequest['thinking'],
): ChatMessage[] {
  // prefix 参数验证
  for (const msg of messages) {
    if ('prefix' in msg && msg.prefix === true) {
      if (msg.role !== 'assistant') {
        throw new Error('prefix 参数仅对 role="assistant" 的消息有效')
      }
      if (msg !== messages.at(-1)) {
        throw new Error('prefix 参数只能设置在 messages 的最后一条消息上')
      }
    }
  }

  const disabled = thinking?.type === 'disabled'
  if (disabled) {
    return messages.map((msg) => {
      if (msg.role === 'assistant' && 'reasoning_content' in msg) {
        const { reasoning_content: _, ...rest } = msg
        return rest as ChatMessage
      }
      return msg
    })
  }
  return messages
}

// ============================================================
// DeepSeek 原生 API
// ============================================================

export function chatCompletion(
  client: DeepSeekClient,
  request: ChatCompletionRequest & { stream?: false | null },
): Promise<ChatCompletionResponse>
export function chatCompletion(
  client: DeepSeekClient,
  request: ChatCompletionRequest & { stream: true },
): AsyncGenerator<ChatCompletionChunk>
export function chatCompletion(
  client: DeepSeekClient,
  request: ChatCompletionRequest,
): Promise<ChatCompletionResponse> | AsyncGenerator<ChatCompletionChunk> {
  const messages = preprocessMessages(request.messages, request.thinking)
  const body = { ...request, messages }
  const path = hasPrefix(request.messages) ? '/beta/chat/completions' : '/chat/completions'

  if (request.stream) {
    return client.postStream<ChatCompletionChunk>(path, body)
  }
  return client.post<ChatCompletionResponse>(path, body)
}
