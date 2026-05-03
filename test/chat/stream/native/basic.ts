import { client } from '../../../_shared'

console.log('=== stream.native | thinking=disabled ===')
for await (const chunk of client.chat.stream.native({
  model: 'deepseek-v4-flash',
  messages: [{ role: 'user', content: '用一句话介绍 TypeScript' }],
  thinking: { type: 'disabled' },
  max_tokens: 8192,
  stream: true,
})) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? '')
}
console.log()
