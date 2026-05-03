import type { Usage, LogProbToken } from './common'

// ============================================================
// 结构化流式事件 —— 扁平事件类型，switch (event.type) 即可分发
// ============================================================

export type StreamEvent =
  | MessageStartEvent
  | ReasoningStartEvent
  | ReasoningDeltaEvent
  | ReasoningEndEvent
  | AnswerStartEvent
  | AnswerDeltaEvent
  | AnswerEndEvent
  | ToolCallsStartEvent
  | ToolCallNameEvent
  | ToolCallArgEvent
  | ToolCallsEndEvent
  | FinishReasonEvent
  | UsageEvent
  | MessageEndEvent

export interface MessageStartEvent {
  type: 'message_start'
  id: string
  model: string
  created: number
  system_fingerprint: string
}

export interface ReasoningStartEvent {
  type: 'reasoning_start'
}

export interface ReasoningDeltaEvent {
  type: 'reasoning_delta'
  text: string
  logprobs?: LogProbToken[] | null
}

export interface ReasoningEndEvent {
  type: 'reasoning_end'
}

export interface AnswerStartEvent {
  type: 'answer_start'
}

export interface AnswerDeltaEvent {
  type: 'answer_delta'
  text: string
  logprobs?: LogProbToken[] | null
}

export interface AnswerEndEvent {
  type: 'answer_end'
}

export interface ToolCallsStartEvent {
  type: 'tool_calls_start'
}

export interface ToolCallNameEvent {
  type: 'tool_call_name'
  id: string
  name: string
}

export interface ToolCallArgEvent {
  type: 'tool_call_argument'
  partial_json: string
}

export interface ToolCallsEndEvent {
  type: 'tool_calls_end'
}

export interface FinishReasonEvent {
  type: 'finish_reason'
  stop_reason: string
}

export interface UsageEvent {
  type: 'usage'
  usage: Usage
}

export interface MessageEndEvent {
  type: 'message_end'
}
