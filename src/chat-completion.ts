import { DeepSeekClient } from './client.js'
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  ChatMessage,
} from '../types/chat-completion.js'

/**
 * 根据思考模式状态预处理 messages。
 *
 * 思考模式开启（默认）：保留所有 assistant 消息中的 `reasoning_content`，
 * API 会在无工具调用时自动忽略，有工具调用时必须存在。
 *
 * 思考模式关闭：剥离 `reasoning_content` 以节省 token。
 */
function preprocessMessages(
  messages: ChatMessage[],
  thinking: ChatCompletionRequest['thinking'],
): ChatMessage[] {
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

  if (request.stream) {
    return client.postStream<ChatCompletionChunk>('/chat/completions', body)
  }
  return client.post<ChatCompletionResponse>('/chat/completions', body)
}
