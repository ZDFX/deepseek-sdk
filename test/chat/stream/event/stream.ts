import { z } from 'zod'
import { client, tool } from '../../../_shared'
import type { ChatCompletionRequest } from '../../../../types/chat-completion'

const weather = tool('get_weather', '查询天气', z.object({ city: z.string() }))

async function run(label: string, req: ChatCompletionRequest) {
  console.log(`\n${'─'.repeat(40)}\n${label}\n${'─'.repeat(40)}`)
  for await (const e of client.chat.stream.event(req)) {
    switch (e.type) {
      case 'message_start':
        console.log('[message_start]')
        break
      case 'reasoning_start':
        process.stdout.write('[推理] ')
        break
      case 'reasoning_delta':
        process.stdout.write(e.reasoning)
        break
      case 'reasoning_end':
        console.log('\n[/推理]')
        break
      case 'content_start':
        process.stdout.write('[回复] ')
        break
      case 'content_delta':
        process.stdout.write(e.text)
        break
      case 'content_end':
        console.log('\n[/回复]')
        break
      case 'tool_calls_start':
        console.log('[工具调用]')
        break
      case 'tool_call_start':
        process.stdout.write(`  ${e.name}(`)
        break
      case 'tool_call_delta':
        process.stdout.write(e.partial_json)
        break
      case 'tool_call_end':
        console.log(')')
        break
      case 'tool_calls_stop':
        console.log('[/工具调用]')
        break
      case 'message_delta':
        console.log(`stop: ${e.stop_reason}  tokens: ${e.output_tokens}`)
        break
    }
  }
}

await run('基础文本', {
  model: 'deepseek-v4-flash',
  messages: [{ role: 'user', content: '用一句话介绍 TypeScript。' }],
  thinking: { type: 'disabled' },
  max_tokens: 8192,
})
await run('思考模式', {
  model: 'deepseek-v4-flash',
  messages: [{ role: 'user', content: '9.11 和 9.8 哪个大？' }],
  max_tokens: 8192,
})
await run('工具调用', {
  model: 'deepseek-v4-flash',
  messages: [{ role: 'user', content: '上海今天天气怎么样？' }],
  tools: [weather],
  max_tokens: 8192,
})
