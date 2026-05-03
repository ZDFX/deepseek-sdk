import type { LogProbContent, StreamOptions, Usage, Stop } from './common'

// ============================================================
// Messages（请求体中的 messages 字段）
// ============================================================

export interface SystemMessage {
  /** 该消息的发起角色，其值为 `system` */
  role: 'system'
  /** system 消息的内容 */
  content: string
  /** 参与者的名称，为模型提供信息以区分相同角色的参与者 */
  name?: string
}

export interface TextContentPart {
  type: 'text'
  text: string
}

export interface ImageContentPart {
  type: 'image_url'
  image_url: {
    url: string
    detail?: string
  }
}

export type ContentPart = TextContentPart | ImageContentPart

export interface UserMessage {
  /** 该消息的发起角色，其值为 `user` */
  role: 'user'
  /** user 消息的内容，可以是纯文本字符串或 content part 数组（支持图片输入） */
  content: string | ContentPart[]
  /** 参与者的名称，为模型提供信息以区分相同角色的参与者 */
  name?: string
}

export interface AssistantMessage {
  /** 该消息的发起角色，其值为 `assistant` */
  role: 'assistant'
  /** assistant 消息的内容。使用 prefix 模式时，如果设置了 `reasoning_content` 让模型续写推理而非正文，则 `content` 必须设为空字符串 `""` */
  content: string | null
  /** 参与者的名称，为模型提供信息以区分相同角色的参与者 */
  name?: string
  /** (Beta) 设置此参数为 true 来强制模型在其回答中以此消息中提供的前缀内容开始 */
  prefix?: boolean
  /** (Beta) 用于思考模式下对话前缀续写功能，作为最后一条 assistant 思维链内容的输入。使用时 prefix 必须为 true */
  reasoning_content?: string | null
  /** 模型生成的 tool 调用列表，例如 function 调用 */
  tool_calls?: ToolCall[]
}

export interface ToolMessage {
  /** 该消息的发起角色，其值为 `tool` */
  role: 'tool'
  /** tool 消息的内容 */
  content: string
  /** 此消息所响应的 tool call 的 ID */
  tool_call_id: string
}

export type ChatMessage = SystemMessage | UserMessage | AssistantMessage | ToolMessage

// ============================================================
// Tool Call（请求 & 响应共用）
// ============================================================

export interface ToolCall {
  /** tool 调用的 ID */
  id: string
  /** tool 调用的索引 */
  index?: number
  /** tool 的类型。目前仅支持 `function` */
  type: 'function'
  function: {
    /** 模型调用的 function 名称 */
    name: string
    /** 要调用的 function 的参数，由模型生成，格式为 JSON */
    arguments: string
  }
}

// ============================================================
// Tool 定义（请求体中的 tools 字段）
// ============================================================

export interface ToolFunction {
  /** function 的功能描述，供模型理解何时以及如何调用该 function */
  description?: string
  /** 要调用的 function 名称。必须由 a-z/A-Z/0-9/下划线/连字符组成，最大长度 64 */
  name: string
  /** function 的输入参数，以 JSON Schema 对象描述。省略则参数列表为空 */
  parameters?: Record<string, unknown>
  /** 如果为 true，强制输出符合 function 的 JSON Schema 定义 (Beta)，默认 false */
  strict?: boolean
}

export interface Tool {
  /** tool 的类型。目前仅支持 `function` */
  type: 'function'
  function: ToolFunction
}

// ============================================================
// Tool Choice
// ============================================================

/** 控制模型调用 tool 的行为。
 * - `none`: 不调用任何 tool，仅生成消息
 * - `auto`: 模型自主选择（有 tool 时的默认值）
 * - `required`: 必须调用一个或多个 tool
 */
export type ToolChoiceString = 'none' | 'auto' | 'required'

export interface NamedToolChoice {
  type: 'function'
  function: {
    /** 要强制调用的 function 名称 */
    name: string
  }
}

export type ToolChoice = ToolChoiceString | NamedToolChoice

// ============================================================
// Thinking
// ============================================================

export interface ThinkingEnabled {
  type: 'enabled'
}

export interface ThinkingDisabled {
  type: 'disabled'
}

/** `enabled` 使用思考模式，`disabled` 使用非思考模式，默认 `enabled` */
export type Thinking = ThinkingEnabled | ThinkingDisabled

// ============================================================
// Response Format
// ============================================================

export interface ResponseFormat {
  /** 输出格式：`text`（默认）或 `json_object`（JSON 模式） */
  type: 'text' | 'json_object'
}

// ============================================================
// Request
// ============================================================

type ChatCompletionRequestCommon = {
  /** 对话的消息列表，长度 >= 1 */
  messages: ChatMessage[]
  /** 使用的模型 ID：`deepseek-v4-flash` 或 `deepseek-v4-pro` */
  model: 'deepseek-v4-flash' | 'deepseek-v4-pro'
  /** 介于 -2.0 和 2.0 之间的数字。正值惩罚已出现 token 的频率，降低重复，默认 `0` */
  frequency_penalty?: number | null
  /** 限制生成 completion 的最大 token 数。输入+输出总长受上下文长度限制 */
  max_tokens?: number | null
  /** 介于 -2.0 和 2.0 之间的数字。正值增加谈论新主题的可能性，默认 `0` */
  presence_penalty?: number | null
  /** 指定模型输出的格式，默认 `{ type: "text" }` */
  response_format?: ResponseFormat | null
  /** 停止词：一个 string 或最多包含 16 个 string 的数组 */
  stop?: Stop
  /** 设为 `true` 时以 SSE 形式流式发送消息增量，以 `data: [DONE]` 结尾 */
  stream?: boolean | null
  /** 流式输出相关选项。仅在 `stream` 为 `true` 时可设置 */
  stream_options?: StreamOptions | null
  /** 采样温度，介于 0 和 2 之间。值越高输出越随机，默认 `1` */
  temperature?: number | null
  /** 核采样参数，模型仅考虑概率在前 `top_p` 的 token，介于 0 和 1 之间，默认 `1` */
  top_p?: number | null
  /** 模型可能会调用的 tool 列表，最多支持 128 个 function */
  tools?: Tool[] | null
  /** 控制模型调用 tool 的行为。无 tool 时默认 `none`，有 tool 时默认 `auto` */
  tool_choice?: ToolChoice | null
  /** 是否返回所输出 token 的对数概率 */
  logprobs?: boolean | null
  /** 指定每个输出位置返回 top N 的 token（0~20）。指定时 logprobs 必须为 true */
  top_logprobs?: number | null
}

/**
 * - `thinking.type === 'disabled'` 时不允许设置 `reasoning_effort`
 * - 其他情况（未传、`null`、`{ type: 'enabled' }`）允许设置 `reasoning_effort`
 */
export type ChatCompletionRequest =
  | (ChatCompletionRequestCommon & {
      /** 控制思考模式与非思考模式的转换，默认 `{ type: "enabled" }` */
      thinking?: ThinkingEnabled | null
      /** 控制模型的推理强度。普通请求默认 `high`，复杂 Agent 请求自动设为 `max` */
      reasoning_effort?: 'high' | 'max'
    })
  | (ChatCompletionRequestCommon & {
      /** 控制思考模式与非思考模式的转换 */
      thinking: ThinkingDisabled
    })

// ============================================================
// Response — 非流式
// ============================================================

export interface ResponseMessage {
  /** 该 completion 的内容 */
  content: string | null
  /** 仅适用于思考模式。assistant 消息中在最终答案之前的推理内容 */
  reasoning_content?: string | null
  /** 模型生成的 tool 调用，例如 function 调用 */
  tool_calls?: ToolCall[]
  /** 生成这条消息的角色，其值为 `assistant` */
  role: 'assistant'
}

/** 模型停止生成 token 的原因：
 * - `stop`: 自然停止或遇到 stop 序列
 * - `length`: 达到 max_tokens 或上下文长度限制
 * - `content_filter`: 触发内容过滤
 * - `tool_calls`: 模型发起 tool 调用
 * - `insufficient_system_resource`: 系统推理资源不足
 */
export type FinishReason = 'stop' | 'length' | 'content_filter' | 'tool_calls' | 'insufficient_system_resource'

export interface ChatChoice {
  /** 模型停止生成 token 的原因 */
  finish_reason: FinishReason
  /** 该 completion 在选择列表中的索引 */
  index: number
  /** 模型生成的 completion 消息 */
  message: ResponseMessage
  /** 该 choice 的对数概率信息 */
  logprobs: LogProbContent | null
}

export interface ChatCompletionResponse {
  /** 该对话的唯一标识符 */
  id: string
  /** 模型生成的 completion 选择列表 */
  choices: ChatChoice[]
  /** 创建聊天完成时的 Unix 时间戳（秒） */
  created: number
  /** 生成该 completion 的模型名 */
  model: string
  /** 模型运行时的后端配置指纹 */
  system_fingerprint: string
  /** 对象类型，其值为 `chat.completion` */
  object: 'chat.completion'
  /** 该对话补全请求的用量信息 */
  usage: Usage
}

// ============================================================
// Response — 流式 (SSE)
// ============================================================

export interface DeltaMessage {
  /** 增量内容 */
  content?: string | null
  /** 增量推理内容 */
  reasoning_content?: string | null
  /** 增量 tool 调用 */
  tool_calls?: ToolCall[]
  /** 生成消息的角色 */
  role?: 'assistant'
}

export interface ChoiceDelta {
  /** 该 completion 在选择列表中的索引 */
  index: number
  /** 流式增量消息 */
  delta: DeltaMessage
  /** 模型停止生成 token 的原因，仅在最后一个块中为非 null */
  finish_reason?: FinishReason | null
  /** 该 choice 的对数概率信息 */
  logprobs?: LogProbContent | null
}

export interface ChatCompletionChunk {
  /** 该对话的唯一标识符 */
  id: string
  /** 模型生成的 completion 增量选择列表 */
  choices: ChoiceDelta[]
  /** 创建聊天完成时的 Unix 时间戳（秒） */
  created: number
  /** 生成该 completion 的模型名 */
  model: string
  /** 模型运行时的后端配置指纹 */
  system_fingerprint: string
  /** 对象类型，其值为 `chat.completion.chunk` */
  object: 'chat.completion.chunk'
  /** 用量信息。所有普通块中为 null，仅在 `stream_options.include_usage` 开启时的最后一个块含实际数据 */
  usage?: Usage | null
}
