import { client } from '../_shared'
console.log('=== FIM Streaming Usage ===')
let last = null
for await (const c of client.fim.create( {
  model: 'deepseek-v4-pro',
  prompt: 'def add(a, b):\n    ',
  suffix: '\n    return result',
  max_tokens: 8192,
  stream: true,
  stream_options: { include_usage: true },
})) {
  last = c
}
console.log('last chunk usage:', JSON.stringify(last?.usage, null, 2))
