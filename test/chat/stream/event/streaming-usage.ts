import { client } from '../../../_shared'

console.log('=== streaming usage ===')
let lastReason = ''
let lastUsage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null = null
for await (const e of client.chat.stream.event({
  model: 'deepseek-v4-flash',
  messages: [{ role: 'user', content: 'hi' }],
  max_tokens: 8192,
  stream_options: { include_usage: true },
})) {
  if (e.type === 'finish_reason') {
    lastReason = e.stop_reason
  }
  if (e.type === 'usage') {
    lastUsage = e.usage
  }
}
console.log('stop_reason:', lastReason, 'usage:', lastUsage)
