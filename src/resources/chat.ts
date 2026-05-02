import type { DeepSeekClient } from '../client'
import type { ChatCompletionRequest, ChatCompletionResponse, ChatCompletionChunk } from '../../types/chat-completion'
import type { StreamEvent } from '../../types/event-stream'
import { preprocessMessages, hasPrefix } from '../chat-completion'
import { toEventStream, extractPrefix } from '../event-stream'

export class Chat {
  readonly completions: Completions

  constructor(client: DeepSeekClient) {
    this.completions = new Completions(client)
  }
}

class Completions {
  constructor(private client: DeepSeekClient) {}

  /** 对话补全（非流式） */
  create(request: ChatCompletionRequest & { stream?: false | null }): Promise<ChatCompletionResponse>
  /** 对话补全（流式，DeepSeek 原生 chunk） */
  create(request: ChatCompletionRequest & { stream: true }): AsyncGenerator<ChatCompletionChunk>
  create(
    request: ChatCompletionRequest,
  ): Promise<ChatCompletionResponse> | AsyncGenerator<ChatCompletionChunk> {
    const messages = preprocessMessages(request.messages, request.thinking)
    const body = { ...request, messages }
    const path = hasPrefix(request.messages) ? '/beta/chat/completions' : '/chat/completions'

    if (request.stream) {
      return this.client.postStream<ChatCompletionChunk>(path, body)
    }
    return this.client.post<ChatCompletionResponse>(path, body)
  }

  /** 对话补全（结构化事件流，按 event.type 分发处理，始终为流式） */
  async *stream(request: ChatCompletionRequest): AsyncGenerator<StreamEvent> {
    const messages = preprocessMessages(request.messages, request.thinking)
    const body = { ...request, messages }
    const path = hasPrefix(request.messages) ? '/beta/chat/completions' : '/chat/completions'

    const chunks = this.client.postStream<ChatCompletionChunk>(path, body)
    const prefix = extractPrefix(request.messages)
    yield* toEventStream(chunks, request.model, prefix)
  }
}
