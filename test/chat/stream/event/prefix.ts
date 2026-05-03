import { client } from '../../../_shared'

console.log('=== Prefix + reasoning ===\n')
for await (const e of client.chat.stream.event({
  model: 'deepseek-v4-flash',
  messages: [
    { role: 'user', content: '请解释闭包' },
    { role: 'assistant', content: '', reasoning_content: '用户要解释闭包，我需要给出清晰的定义，然后用例子说明。', prefix: true },
  ],
  max_tokens: 8192,
})) {
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
    case 'message_delta':
      console.log(`stop: ${e.stop_reason}  tokens: ${e.output_tokens}`)
      break
  }
}
