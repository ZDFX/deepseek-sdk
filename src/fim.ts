import { DeepSeekClient } from './client.js'
import type { FIMCompletionRequest, FIMCompletionResponse, FIMCompletionChunk } from '../types/fim-completion.js'

export function fimCompletion(
  client: DeepSeekClient,
  request: FIMCompletionRequest & { stream?: false | null },
): Promise<FIMCompletionResponse>
export function fimCompletion(
  client: DeepSeekClient,
  request: FIMCompletionRequest & { stream: true },
): AsyncGenerator<FIMCompletionChunk>
export function fimCompletion(
  client: DeepSeekClient,
  request: FIMCompletionRequest,
): Promise<FIMCompletionResponse> | AsyncGenerator<FIMCompletionChunk> {
  if (request.stream) {
    return client.postStream<FIMCompletionChunk>('/beta/completions', request)
  }
  return client.post<FIMCompletionResponse>('/beta/completions', request)
}
