// ============================================================
// 结构化流式事件 —— 扁平事件类型，switch (event.type) 即可分发
// ============================================================

export type StreamEvent =
  | MessageStartEvent
  | ReasoningStartEvent
  | ReasoningDeltaEvent
  | ReasoningStopEvent
  | ContentStartEvent
  | ContentDeltaEvent
  | ContentStopEvent
  | ToolCallsStartEvent
  | ToolCallStartEvent
  | ToolCallDeltaEvent
  | ToolCallStopEvent
  | ToolCallsStopEvent
  | MessageDeltaEvent
  | MessageStopEvent

export interface MessageStartEvent {
  /** 消息开始 */
  type: 'message_start'
  id: string
  model: string
}

export interface ReasoningStartEvent {
  /** 推理开始 */
  type: 'reasoning_start'
}

export interface ReasoningDeltaEvent {
  /** 推理增量 */
  type: 'reasoning_delta'
  reasoning: string
}

export interface ReasoningStopEvent {
  /** 推理结束 */
  type: 'reasoning_end'
}

export interface ContentStartEvent {
  /** 正文开始 */
  type: 'content_start'
}

export interface ContentDeltaEvent {
  /** 正文增量 */
  type: 'content_delta'
  text: string
}

export interface ContentStopEvent {
  /** 正文结束 */
  type: 'content_end'
}

export interface ToolCallStartEvent {
  /** 工具调用开始 */
  type: 'tool_call_start'
  id: string
  name: string
}

export interface ToolCallDeltaEvent {
  /** 工具调用参数增量（逐步拼接完整 JSON） */
  type: 'tool_call_delta'
  partial_json: string
}

export interface ToolCallsStartEvent {
  /** 本次响应的所有工具调用开始 */
  type: 'tool_calls_start'
}

export interface ToolCallStartEvent {
  /** 单个工具调用开始 */
  type: 'tool_call_start'
  id: string
  name: string
}

export interface ToolCallDeltaEvent {
  /** 工具调用参数增量（逐步拼接完整 JSON） */
  type: 'tool_call_delta'
  partial_json: string
}

export interface ToolCallStopEvent {
  /** 单个工具调用结束 */
  type: 'tool_call_end'
}

export interface ToolCallsStopEvent {
  /** 本次响应的所有工具调用结束 */
  type: 'tool_calls_stop'
}

export interface MessageDeltaEvent {
  /** 消息结束信息 */
  type: 'message_delta'
  stop_reason: string
  output_tokens: number
}

export interface MessageStopEvent {
  /** 消息结束 */
  type: 'message_stop'
}
