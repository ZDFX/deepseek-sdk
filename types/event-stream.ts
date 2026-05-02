// ============================================================
// 结构化流式事件 —— 将流式 chunks 转为带 type 的事件，便于按事件类型分发处理
// ============================================================

/** 流式事件的联合类型，可通过 `switch (event.type)` 按类型分发 */
export type StreamEvent =
  | MessageStartEvent
  | ContentBlockStartEvent
  | ContentBlockDeltaEvent
  | ContentBlockStopEvent
  | MessageDeltaEvent
  | MessageStopEvent

export interface MessageStartEvent {
  /** 消息开始 —— 始终是第一个事件 */
  type: 'message_start'
  message: {
    id: string
    /** `"message"` */
    type: 'message'
    /** `"assistant"` */
    role: 'assistant'
    /** 空数组，占位 */
    content: never[]
    model: string
    /** 流开始时恒为 null */
    stop_reason: null
    /** 恒为 null */
    stop_sequence: null
    /** 输入 token 数（流开始恒为 0） */
    usage: { input_tokens: number }
  }
}

export interface ContentBlockStartEvent {
  /** 内容块开始 —— 一个新的文本/思考/工具调用块开始 */
  type: 'content_block_start'
  /** 块序号（从 0 开始） */
  index: number
  content_block: ContentBlockStart
}

export interface TextContentBlock {
  /** 文本块 */
  type: 'text'
  text: ''
}

export interface ThinkingContentBlock {
  /** 思考块（思维链） */
  type: 'thinking'
  thinking: ''
  signature: ''
}

export interface ToolUseContentBlock {
  /** 工具调用块 */
  type: 'tool_use'
  id: string
  name: string
  input: {}
}

export type ContentBlockStart = TextContentBlock | ThinkingContentBlock | ToolUseContentBlock

export interface ContentBlockDeltaEvent {
  /** 内容块增量 —— 一段增量数据 */
  type: 'content_block_delta'
  index: number
  delta: ContentBlockDelta
}

export interface TextDelta {
  /** 文本增量 */
  type: 'text_delta'
  text: string
}

export interface ThinkingDelta {
  /** 思考增量（思维链） */
  type: 'thinking_delta'
  thinking: string
}

export interface InputJSONDelta {
  /** 工具调用参数 JSON 增量（逐字符拼接） */
  type: 'input_json_delta'
  partial_json: string
}

export type ContentBlockDelta = TextDelta | ThinkingDelta | InputJSONDelta

export interface ContentBlockStopEvent {
  /** 内容块结束 —— 当前块的数据已完整 */
  type: 'content_block_stop'
  index: number
}

export interface MessageDeltaEvent {
  /** 消息元信息 —— 停止原因和输出 token 统计 */
  type: 'message_delta'
  delta: {
    /** `end_turn` / `max_tokens` / `tool_use` */
    stop_reason: string
    stop_sequence: null
  }
  usage: { output_tokens: number }
}

export interface MessageStopEvent {
  /** 消息结束 —— 始终是最后一个事件 */
  type: 'message_stop'
}
