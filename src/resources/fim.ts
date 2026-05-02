import type { DeepSeekClient } from '../client'
import type { FIMCompletionRequest, FIMCompletionResponse, FIMCompletionChunk } from '../../types/fim-completion'

export class FIM {
  constructor(private client: DeepSeekClient) {}

  /** FIM（Fill-In-the-Middle）补全（非流式） */
  create(request: FIMCompletionRequest & { stream?: false | null }): Promise<FIMCompletionResponse>
  /** FIM（Fill-In-the-Middle）补全（流式） */
  create(request: FIMCompletionRequest & { stream: true }): AsyncGenerator<FIMCompletionChunk>
  create(
    request: FIMCompletionRequest,
  ): Promise<FIMCompletionResponse> | AsyncGenerator<FIMCompletionChunk> {
    if (request.stream) {
      return this.client.postStream<FIMCompletionChunk>('/beta/completions', request)
    }
    return this.client.post<FIMCompletionResponse>('/beta/completions', request)
  }
}
