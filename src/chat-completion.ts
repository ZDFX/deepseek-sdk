import { DeepSeekClient } from './client.js'
import type { ChatCompletionRequest, ChatCompletionResponse, ChatCompletionChunk } from '../types/chat-completion.js'

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
  if (request.stream) {
    return client.postStream<ChatCompletionChunk>('/chat/completions', request)
  }
  return client.post<ChatCompletionResponse>('/chat/completions', request)
}
