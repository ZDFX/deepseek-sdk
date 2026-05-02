import type { DeepSeekClient } from '../client'
import type { ChatCompletionRequest, ChatCompletionResponse, ChatCompletionChunk } from '../../types/chat-completion'
import type { StreamEvent } from '../../types/event-stream'
import { preprocessMessages, hasPrefix } from '../core/preprocess'
import { toEventStream, extractPrefix } from '../core/stream-adapter'

export class Chat {
  readonly stream: ChatStream

  constructor(private client: DeepSeekClient) {
    this.stream = new ChatStream(client)
  }

  /** 对话补全（非流式） */
  async create(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const messages = preprocessMessages(request.messages, request.thinking)
    const body = { ...request, messages }
    const path = hasPrefix(request.messages) ? '/beta/chat/completions' : '/chat/completions'
    return this.client.post<ChatCompletionResponse>(path, body)
  }
}

/** 流式对话，两种格式：native（DeepSeek 原始 chunk） / event（结构化事件） */
export class ChatStream {
  constructor(private client: DeepSeekClient) {}

  /** DeepSeek 原生格式：逐 chunk 返回，与 API 原始响应一致 */
  async *native(request: ChatCompletionRequest & { stream: true }): AsyncGenerator<ChatCompletionChunk> {
    const messages = preprocessMessages(request.messages, request.thinking)
    const body = { ...request, messages }
    const path = hasPrefix(request.messages) ? '/beta/chat/completions' : '/chat/completions'
    yield* this.client.postStream<ChatCompletionChunk>(path, body)
  }

  /** 结构化事件格式：按 event.type 分发处理（message_start → content_block_start/delta/stop → message_delta → message_stop） */
  async *event(request: ChatCompletionRequest): AsyncGenerator<StreamEvent> {
    const messages = preprocessMessages(request.messages, request.thinking)
    const body = { ...request, messages, stream: true }
    const path = hasPrefix(request.messages) ? '/beta/chat/completions' : '/chat/completions'

    const chunks = this.client.postStream<ChatCompletionChunk>(path, body)
    const prefix = extractPrefix(request.messages)
    yield* toEventStream(chunks, request.model, prefix)
  }
}
