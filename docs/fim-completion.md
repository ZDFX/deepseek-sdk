# FIM 补全 (Beta)

```
POST https://api.deepseek.com/beta/completions
```

FIM（Fill-In-the-Middle）补全 API。需设置 `base_url="https://api.deepseek.com/beta"`。

## Request Body (application/json)

### model — `string` required

可选值：`deepseek-v4-pro`、`deepseek-v4-flash`

---

### prompt — `string` required

用于生成完成内容的提示。默认 `"Once upon a time, "`。

---

### echo — `boolean` nullable

为 `true` 时在输出中回显 prompt 内容。

---

### frequency_penalty — `number` nullable

取值范围 `[-2, 2]`，默认 `0`。正值惩罚重复 token。

---

### logprobs — `integer` nullable

最大值 `20`。返回最可能输出 token 的对数概率。API 始终返回采样 token 的对数概率，响应中最多 `logprobs+1` 个元素。

---

### max_tokens — `integer` nullable

最大生成 token 数。

---

### presence_penalty — `number` nullable

取值范围 `[-2, 2]`，默认 `0`。正值使模型更倾向于谈论新主题。

---

### stop — string | string[] nullable

一个 string 或最多包含 16 个 string 的数组。遇到这些词时 API 停止生成 token。

---

### stream — `boolean` nullable

设为 `true` 时以 SSE 形式流式发送消息增量，以 `data: [DONE]` 结尾。

---

### stream_options — `object` nullable

仅在 `stream: true` 时设置。

| 字段 | 类型 | 说明 |
|------|------|------|
| `include_usage` | `boolean` | 为 `true` 时在 `[DONE]` 前传输含 usage 统计的额外块 |

---

### suffix — `string` nullable

指定被补全内容的后缀（FIM 的核心参数）。

---

### temperature — `number` nullable

取值范围 `[0, 2]`，默认 `1`。值越高输出越随机。

---

### top_p — `number` nullable

取值范围 `[0, 1]`，默认 `1`。模型仅考虑概率在前 `top_p` 的 token。

---

## Response (200 — No Streaming)

返回一个 `text_completion` 对象。

### 顶层字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 补全响应的唯一 ID |
| `choices` | `object[]` | 模型生成的补全内容选择列表 |
| `created` | `integer` | 创建时的 Unix 时间戳（秒） |
| `model` | `string` | 补全所用的模型名 |
| `system_fingerprint` | `string` | 后端配置指纹 |
| `object` | `"text_completion"` | 对象类型 |
| `usage` | `object` | 用量信息 |

### choices

| 字段 | 类型 | 说明 |
|------|------|------|
| `finish_reason` | `"stop"` \| `"length"` \| `"content_filter"` \| `"insufficient_system_resource"` | 停止生成原因 |
| `index` | `integer` | completion 索引 |
| `text` | `string` | 补全文本 |
| `logprobs` | `object \| null` | 对数概率信息 |

### choices.logprobs

| 字段 | 类型 |
|------|------|
| `text_offset` | `integer[]` |
| `token_logprobs` | `number[]` |
| `tokens` | `string[]` |
| `top_logprobs` | `object[]` |

### usage

| 字段 | 类型 | 说明 |
|------|------|------|
| `completion_tokens` | `integer` | completion 的 token 数 |
| `prompt_tokens` | `integer` | prompt 的 token 数（= hit + miss） |
| `prompt_cache_hit_tokens` | `integer` | 命中缓存的 token 数 |
| `prompt_cache_miss_tokens` | `integer` | 未命中缓存的 token 数 |
| `total_tokens` | `integer` | 总 token 数 |
| `prompt_tokens_details` | `object` | prompt token 详情 |
| `prompt_tokens_details.cached_tokens` | `integer` | 命中缓存的 token 数 |
| `completion_tokens_details` | `object` | completion token 详情 |
| `completion_tokens_details.reasoning_tokens` | `integer` | 思维链 token 数 |

---

## Response (200 — Streaming)

流式 SSE 事件。每个块的 `object` 为 `"text_completion"`。choices 结构与非流式一致，但 `finish_reason` 仅在最后一个块为非 `null`。

设置 `stream_options: { include_usage: true }` 后，最后一个块的 `usage` 字段包含完整用量统计。
