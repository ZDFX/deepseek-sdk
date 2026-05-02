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
