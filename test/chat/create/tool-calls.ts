import { z } from 'zod'
import { client, logAssistant, tool } from '../../_shared'

const weather = tool('get_weather', '查询指定城市的天气', z.object({ city: z.string().describe('城市名称') }))

console.log('=== Tool Calls 非流式 ===')
const r = await client.chat.create({
  model: 'deepseek-v4-flash',
  messages: [{ role: 'user', content: '北京今天天气怎么样？' }],
  tools: [weather],
  tool_choice: 'auto',
  max_tokens: 8192,
})
const choice = r.choices[0]!
logAssistant(choice.message)
console.log('finish_reason:', choice.finish_reason)
console.log('tool_calls:', JSON.stringify(choice.message.tool_calls, null, 2))
