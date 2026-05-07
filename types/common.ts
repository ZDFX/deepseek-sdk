// 共享类型 —— Logprobs、Usage、StreamOptions、ModelName 等

/** 支持的模型 ID */
export type ModelName = 'deepseek-v4-flash' | 'deepseek-v4-pro'

export interface LogProbToken {
  /** 输出的 token */
  token: string
  /** 该 token 的对数概率。`-9999.0` 代表该 token 的输出概率极小，不在 top 20 最可能输出的 token 中 */
  logprob: number
  /** 该 token 的 UTF-8 字节表示。如果 token 没有对应的字节表示，则该值为 null */
  bytes: number[] | null
  /** 该输出位置上概率 top N 的 token 列表及对数概率 */
  top_logprobs: LogProbToken[]
}

export interface LogProbContent {
  /** 输出 token 的对数概率信息列表 */
  content: LogProbToken[] | null
  /** 推理 token 的对数概率信息列表（仅思考模式） */
  reasoning_content?: LogProbToken[] | null
}

export interface StreamOptions {
  /** 如果为 true，在流式消息最后的 `data: [DONE]` 之前会传输一个包含 usage 统计的额外块 */
  include_usage?: boolean
}

export interface CompletionTokensDetails {
  /** 推理模型所产生的思维链 token 数量 */
  reasoning_tokens?: number
}

export interface PromptTokensDetails {
  /** 命中缓存的 token 数 */
  cached_tokens?: number
}

export interface Usage {
  /** 模型 completion 产生的 token 数 */
  completion_tokens: number
  /** 用户 prompt 所包含的 token 数（= prompt_cache_hit_tokens + prompt_cache_miss_tokens） */
  prompt_tokens: number
  /** 用户 prompt 中命中上下文缓存的 token 数 */
  prompt_cache_hit_tokens: number
  /** 用户 prompt 中未命中上下文缓存的 token 数 */
  prompt_cache_miss_tokens: number
  /** 该请求中所有 token 的数量（prompt + completion） */
  total_tokens: number
  /** prompt tokens 的详细信息 */
  prompt_tokens_details?: PromptTokensDetails
  /** completion tokens 的详细信息 */
  completion_tokens_details?: CompletionTokensDetails
}

/** 一个 string 或最多包含 16 个 string 的数组，遇到这些词时 API 停止生成 token */
export type Stop = string | string[] | null
