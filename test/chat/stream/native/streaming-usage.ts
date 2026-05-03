import { client } from '../../../_shared'

console.log('=== native Streaming Usage ===')
let last: unknown = null
for await (const c of client.chat.stream.native({
  model: 'deepseek-v4-flash',
  messages: [{ role: 'user', content: 'hi' }],
  max_tokens: 8192,
  stream: true,
  stream_options: { include_usage: true },
})) {
  last = c
}
console.log('last chunk usage:', JSON.stringify((last as { usage?: unknown })?.usage, null, 2))
