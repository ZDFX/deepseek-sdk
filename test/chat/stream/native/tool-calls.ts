import { z } from 'zod'
import { client, tool } from '../../../_shared'

const weather = tool('get_weather', '查询指定城市的天气', z.object({ city: z.string().describe('城市名称') }))

console.log('=== stream.native | tool calls ===')
for await (const chunk of client.chat.stream.native({
  model: 'deepseek-v4-flash',
  messages: [{ role: 'user', content: '查一下深圳的天气' }],
  tools: [weather],
  stream: true,
  max_tokens: 8192,
})) {
  const delta = chunk.choices[0]?.delta
  if (delta?.content) process.stdout.write(delta.content)
  if (delta?.tool_calls?.length) {
    console.log('\ntool_calls delta:', JSON.stringify(delta.tool_calls, null, 2))
  }
}
console.log()
