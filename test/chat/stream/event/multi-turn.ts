import { z } from 'zod'
import { client, tool } from '../../../_shared'
import type { ChatMessage } from '../../../../types/chat-completion'

const tools = [tool('get_weather', '查询天气', z.object({ city: z.string() }))]

async function chatTurn(messages: ChatMessage[]) {
  let content = ''
  let reasoning = ''
  const toolCalls: Array<{ id: string; name: string; args: string }> = []
  let stopReason = ''

  for await (const e of client.chat.stream.event({
    model: 'deepseek-v4-flash',
    messages,
    tools,
    reasoning_effort: 'max',
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

  console.log('  reasoning:', reasoning, '...')
  console.log('  content:', content)
  for (const tc of toolCalls) console.log('  tool →', tc.name, tc.args)
  console.log('  stop:', stopReason)

  const tcMapped = toolCalls.map(tc => ({
    id: tc.id, type: 'function' as const,
    function: { name: tc.name, arguments: tc.args },
  }))
  messages.push({
    role: 'assistant',
    content: content || null,
    reasoning_content: reasoning || null,
    ...(tcMapped.length ? { tool_calls: tcMapped } : {}),
  })

  if (!toolCalls.length) return

  for (const tc of toolCalls) {
    const result = tc.args.includes('杭州') ? '晴，18°C ~ 28°C' : '多云转阵雨，22°C ~ 30°C'
    console.log('  ← tool result:', result)
    messages.push({ role: 'tool', tool_call_id: tc.id, content: result })
  }
}

console.log('═'.repeat(40) + '\nTurn 1: 杭州')
const messages: ChatMessage[] = [{ role: 'user', content: '杭州今天天气怎么样？' }]
await chatTurn(messages)

console.log('\n' + '═'.repeat(40) + '\nTurn 2: 广州')
messages.push({ role: 'user', content: '广州呢？' })
await chatTurn(messages)
