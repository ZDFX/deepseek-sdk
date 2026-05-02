# DeepSeek SDK

Unofficial DeepSeek API SDK for JavaScript / TypeScript.

```bash
npm install @hjning/deepseek-sdk
```

## Quick Start

```ts
import { DeepSeekClient } from '@hjning/deepseek-sdk'

const client = new DeepSeekClient({ apiKey: 'sk-...' })

// 列出模型
const models = await client.models.list()

// 查询余额
const balance = await client.user.balance()

// 对话补全
const res = await client.chat.create({
  model: 'deepseek-v4-flash',
  messages: [{ role: 'user', content: '你好' }],
})
console.log(res.choices[0].message.content)
```

## Chat Completion

### 非流式 `client.chat.create()`

```ts
const res = await client.chat.create({
  model: 'deepseek-v4-flash',
  messages: [
    { role: 'system', content: '你是一个严谨的数学老师。' },
    { role: 'user', content: '9.11 和 9.8 哪个大？' },
  ],
  temperature: 0.6,
  max_tokens: 200,
})
```

### 流式 — native `client.chat.stream.native()`

返回 DeepSeek 原始 chunk，与 API 响应格式一致：

```ts
for await (const chunk of client.chat.stream.native({
  model: 'deepseek-v4-flash',
  messages: [{ role: 'user', content: '写一首诗' }],
  stream: true,
  max_tokens: 200,
})) {
  const delta = chunk.choices[0].delta
  if (delta?.content) process.stdout.write(delta.content)
  if (delta?.reasoning_content) process.stdout.write(delta.reasoning_content)
}
```

### 流式 — event `client.chat.stream.event()`

返回结构化事件，按 `event.type` 分发：

```ts
for await (const e of client.chat.stream.event({
  model: 'deepseek-v4-flash',
  messages: [{ role: 'user', content: '9.11 和 9.8 哪个大？' }],
  max_tokens: 200,
})) {
  switch (e.type) {
    case 'reasoning_start':
      process.stdout.write('[推理] ')
      break
    case 'reasoning_delta':
      process.stdout.write(e.reasoning)
      break
    case 'reasoning_end':
      console.log('')
      break
    case 'content_start':
      process.stdout.write('[回复] ')
      break
    case 'content_delta':
      process.stdout.write(e.text)
      break
    case 'content_end':
      console.log('')
      break
    case 'tool_calls_start':
      console.log('工具调用:')
      break
    case 'tool_call_start':
      console.log(`  ${e.name}(`)
      break
    case 'tool_call_delta':
      process.stdout.write(e.partial_json)
      break
    case 'tool_call_end':
      console.log(')')
      break
    case 'tool_calls_stop':
      console.log('结束')
      break
    case 'message_delta':
      console.log(`stop_reason: ${e.stop_reason}`)
      break
  }
}
```

事件类型一览：

| 事件 | 说明 |
|------|------|
| `message_start` | 消息开始，含 id/model |
| `reasoning_start` | 推理开始 |
| `reasoning_delta` | 推理增量，字段 `reasoning` |
| `reasoning_end` | 推理结束 |
| `content_start` | 正文开始 |
| `content_delta` | 正文增量，字段 `text` |
| `content_end` | 正文结束 |
| `tool_calls_start` | 所有工具调用开始 |
| `tool_call_start` | 单个工具调用开始，字段 `id`/`name` |
| `tool_call_delta` | 工具参数 JSON 增量，字段 `partial_json` |
| `tool_call_end` | 单个工具调用结束 |
| `tool_calls_stop` | 所有工具调用结束 |
| `message_delta` | 停止原因和输出 token 数 |
| `message_stop` | 消息结束 |

## Thinking Mode

DeepSeek 默认开启思考模式，模型会先推理再回答。关闭只需要设置 `thinking: { type: 'disabled' }`：

```ts
// 关闭思考模式
await client.chat.create({
  model: 'deepseek-v4-flash',
  messages: [{ role: 'user', content: '你好' }],
  thinking: { type: 'disabled' },
})

// 控制推理强度
await client.chat.create({
  model: 'deepseek-v4-flash',
  messages: [{ role: 'user', content: '复杂问题...' }],
  reasoning_effort: 'max', // high (默认) | max
})
```

多轮对话时，上一轮的 `reasoning_content` 需要保留在 assistant 消息中。推荐直接使用 API 返回的完整 message：

```ts
const res = await client.chat.create({ model: '...', messages })
messages.push(res.choices[0].message) // 包含 content + reasoning_content + tool_calls
```

## Tool Calls

```ts
const res = await client.chat.create({
  model: 'deepseek-v4-flash',
  messages: [{ role: 'user', content: '上海今天天气怎么样？' }],
  tools: [{
    type: 'function',
    function: {
      name: 'get_weather',
      description: '查询指定城市的天气',
      parameters: {
        type: 'object',
        properties: { city: { type: 'string', description: '城市名称' } },
        required: ['city'],
      },
    },
  }],
})

// 模型返回 tool_calls
const tc = res.choices[0].message.tool_calls[0]
// { id: 'call_...', function: { name: 'get_weather', arguments: '{"city":"上海"}' } }

// 执行工具后，继续对话
messages.push(res.choices[0].message)
messages.push({ role: 'tool', tool_call_id: tc.id, content: '晴，25°C' })
const res2 = await client.chat.create({ model: '...', messages, tools })
```

## Prefix Completion (Beta)

让模型从指定前缀续写：

```ts
// 续写正文：模型从 "```python\n" 开始生成代码
await client.chat.create({
  model: 'deepseek-v4-flash',
  messages: [
    { role: 'user', content: '请用 python 写二分查找' },
    { role: 'assistant', content: '```python\n', prefix: true },
  ],
  stop: ['```'],
})

// 续写推理：模型从指定的 reasoning_content 继续思考
// 注意：续写推理时 content 必须为空字符串 ""
await client.chat.create({
  model: 'deepseek-v4-flash',
  messages: [
    { role: 'user', content: '请解释闭包' },
    { role: 'assistant', content: '', reasoning_content: '先给定义，再举例。', prefix: true },
  ],
})
```

## FIM Completion (Beta)

Fill-In-the-Middle 补全：

```ts
// 非流式
const res = await client.fim.create({
  model: 'deepseek-v4-pro',
  prompt: 'def fibonacci(n):\n    """第 n 个斐波那契数"""\n',
  suffix: '\n    return result',
  max_tokens: 50,
})

// 流式
for await (const chunk of client.fim.create({
  model: 'deepseek-v4-pro',
  prompt: 'const greet = (name: string): string => {\n  ',
  suffix: '\n}',
  max_tokens: 30,
  stream: true,
})) {
  process.stdout.write(chunk.choices[0].text)
}
```

## API Reference

### `new DeepSeekClient(config)`

| 参数 | 类型 | 说明 |
|------|------|------|
| `apiKey` | `string` | DeepSeek API Key |
| `baseUrl` | `string` | 可选，默认 `https://api.deepseek.com` |

### `client.models.list()`

返回模型列表，类型 `ListModelsResponse`。

### `client.user.balance()`

查询余额，类型 `BalanceResponse`。

### `client.chat.create(request)`

非流式对话补全。返回 `Promise<ChatCompletionResponse>`。

### `client.chat.stream.native(request)`

流式对话 — DeepSeek 原生格式。接受 `stream: true`，返回 `AsyncGenerator<ChatCompletionChunk>`。

### `client.chat.stream.event(request)`

流式对话 — 结构化事件格式。返回 `AsyncGenerator<StreamEvent>`。

### `client.fim.create(request)`

FIM 补全。支持 `stream: true` 切换流式，返回 `Promise<FIMCompletionResponse>` 或 `AsyncGenerator<FIMCompletionChunk>`。

## License

ISC
