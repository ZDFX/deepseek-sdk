// 目前 DeepSeek 不支持 Prefix 模式下使用 tool call / tool result
// 本文件仅用于占位
import { client } from '../../../_shared'

console.log('=== Prefix + tool results ===\n')

// 场景：历史中已有工具调用结果，用 prefix 续写
const messages = [
  { role: 'user' as const, content: '杭州今天天气怎么样？' },
  {
    role: 'assistant' as const,
    content: null,
    tool_calls: [
      {
        id: 'call_fake_001',
        type: 'function' as const,
        function: { name: 'get_weather', arguments: '{"city":"杭州"}' },
      },
    ],
  },
  { role: 'tool' as const, tool_call_id: 'call_fake_001', content: '晴，18°C ~ 28°C' },
  { role: 'user' as const, content: '那广州呢？' },
  {
    role: 'assistant' as const,
    content: '',
    reasoning_content: '用户刚才问了杭州天气，得到了晴天 18-28°C 的结果。现在接着问广州，我可以用同样的工具查询广州的天气。',
    prefix: true,
  },
]

let reasoning = '', content = '', stopReason = ''
let toolCalls: Array<{ id: string; name: string; args: string }> = []

for await (const e of client.chat.stream.event({
  model: 'deepseek-v4-flash',
  messages,
  max_tokens: 8192,
})) {
  switch (e.type) {
    case 'reasoning_delta':
      reasoning += e.text
      break
    case 'answer_delta':
      content += e.text
      break
    case 'tool_call_name':
      toolCalls.push({ id: e.id, name: e.name, args: '' })
      break
    case 'tool_call_argument':
      toolCalls[toolCalls.length - 1]!.args += e.partial_json
      break
    case 'finish_reason':
      stopReason = e.stop_reason
      break
  }
}

console.log('reasoning:', reasoning.slice(0, 200), reasoning.length > 200 ? '...' : '')
console.log('content:', content.slice(0, 200), content.length > 200 ? '...' : '')
for (const tc of toolCalls) console.log('tool_call:', tc.name, tc.args)
console.log('stop_reason:', stopReason)
