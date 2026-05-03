import { client } from '../../../_shared'

console.log('=== streaming usage ===')
let lastReason = ''
let lastTokens = 0
for await (const e of client.chat.stream.event({
  model: 'deepseek-v4-flash',
  messages: [{ role: 'user', content: 'hi' }],
  max_tokens: 8192,
  stream_options: { include_usage: true },
})) {
  if (e.type === 'message_delta') {
    lastReason = e.stop_reason
    lastTokens = e.output_tokens
  }
}
console.log('stop_reason:', lastReason, 'output_tokens:', lastTokens)
