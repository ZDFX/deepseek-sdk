import type { StreamOptions, Usage, Stop, ModelName } from './common'

// ============================================================
// Request
// ============================================================

export interface FIMCompletionRequest {
  /** 模型的 ID */
  model: ModelName
  /** 用于生成完成内容的提示 */
  prompt: string
  /** 为 `true` 时在输出中回显 prompt 内容 */
  echo?: boolean | null
  /** 介于 -2.0 和 2.0 之间的数字。正值惩罚已出现 token 的频率，降低重复，默认 `0` */
  frequency_penalty?: number | null
  /** 返回最可能输出 token 的对数概率，最大值 20。响应中最多返回 logprobs+1 个元素 */
  logprobs?: number | null
  /** 最大生成 token 数 */
  max_tokens?: number | null
  /** 介于 -2.0 和 2.0 之间的数字。正值增加谈论新主题的可能性，默认 `0` */
  presence_penalty?: number | null
  /** 停止词：一个 string 或最多包含 16 个 string 的数组 */
  stop?: Stop
  /** 设为 `true` 时以 SSE 形式流式发送消息增量，以 `data: [DONE]` 结尾 */
  stream?: boolean | null
  /** 流式输出相关选项。仅在 `stream` 为 `true` 时可设置 */
  stream_options?: StreamOptions | null
  /** 指定被补全内容的后缀（FIM 核心参数） */
  suffix?: string | null
  /** 采样温度，介于 0 和 2 之间。值越高输出越随机，默认 `1` */
  temperature?: number | null
  /** 核采样参数，模型仅考虑概率在前 `top_p` 的 token，介于 0 和 1 之间，默认 `1` */
  top_p?: number | null
}

// ============================================================
// Response — 非流式
// ============================================================

export interface FIMLogprobs {
  /** 每个 token 对应的文本偏移量 */
  text_offset: number[]
  /** 每个 token 的对数概率 */
  token_logprobs: number[]
  /** 输出的 token 列表 */
  tokens: string[]
  /** 每个位置的概率 top N token 及对数概率 */
  top_logprobs: Record<string, number>[]
}

/** 模型停止生成 token 的原因：
 * - `stop`: 自然停止或遇到 stop 序列
 * - `length`: 达到 max_tokens 或上下文长度限制
 * - `content_filter`: 触发内容过滤
 * - `insufficient_system_resource`: 系统推理资源不足，生成被打断
 */
export type FIMFinishReason = 'stop' | 'length' | 'content_filter' | 'insufficient_system_resource'

export interface FIMChoice {
  /** 模型停止生成 token 的原因 */
  finish_reason: FIMFinishReason
  /** 该 completion 在选择列表中的索引 */
  index: number
  /** 补全文本 */
  text: string
  /** 该 choice 的对数概率信息 */
  logprobs: FIMLogprobs | null
}

export interface FIMCompletionResponse {
  /** 补全响应的 ID */
  id: string
  /** 模型生成的补全内容选择列表 */
  choices: FIMChoice[]
  /** 标志补全请求开始时间的 Unix 时间戳（秒） */
  created: number
  /** 补全请求所用的模型名 */
  model: string
  /** 模型运行时的后端配置指纹 */
  system_fingerprint?: string
  /** 对象类型，一定为 `text_completion` */
  object: 'text_completion'
  /** 该补全请求的用量信息 */
  usage: Usage
}

// ============================================================
// Response — 流式 (SSE)
// ============================================================

export interface FIMChoiceDelta {
  /** 该 completion 在选择列表中的索引 */
  index: number
  /** 增量补全文本 */
  text: string
  /** 模型停止生成 token 的原因，仅在最后一个块中为非 null */
  finish_reason?: FIMFinishReason | null
  /** 该 choice 的对数概率信息 */
  logprobs?: FIMLogprobs | null
}

export interface FIMCompletionChunk {
  /** 补全响应的 ID */
  id: string
  /** 模型生成的补全内容增量选择列表 */
  choices: FIMChoiceDelta[]
  /** 标志补全请求开始时间的 Unix 时间戳（秒） */
  created: number
  /** 补全请求所用的模型名 */
  model: string
  /** 模型运行时的后端配置指纹 */
  system_fingerprint?: string
  /** 对象类型，一定为 `text_completion` */
  object: 'text_completion'
  /** 用量信息。仅在 `stream_options.include_usage` 开启时的最后一个块含实际数据 */
  usage?: Usage | null
}
