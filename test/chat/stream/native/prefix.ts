import { client } from '../../../_shared'

// --- 关闭思考 ---
console.log('=== stream.native | prefix | thinking=disabled ===')
for await (const chunk of client.chat.stream.native({
  model: 'deepseek-v4-flash',
  messages: [
    { role: 'user', content: '请用 python 写二分查找' },
    { role: 'assistant', content: '```python\n', prefix: true },
  ],
  stop: ['```'],
  max_tokens: 8192,
  stream: true,
  thinking: { type: 'disabled' },
})) {
  const d = chunk.choices[0]?.delta
  if (d?.content) process.stdout.write(d.content)
}
console.log()

// --- 开启思考 + reasoning_content 前缀 ---
console.log('\n=== stream.native | prefix | thinking=enabled ===')
let reasoning = false
for await (const chunk of client.chat.stream.native({
  model: 'deepseek-v4-flash',
  messages: [
    { role: 'user', content: '请用 python 写二分查找' },
    { role: 'assistant', content: '', reasoning_content: '用户要求', prefix: true },
  ],
  max_tokens: 8192,
  stream: true,
  reasoning_effort: 'max',
})) {
  const d = chunk.choices[0]?.delta
  if (d?.reasoning_content) {
    if (!reasoning) { process.stdout.write('[推理] '); reasoning = true }
    process.stdout.write(d.reasoning_content)
  }
  if (d?.content != null) {
    if (reasoning) { console.log('\n[/推理]'); reasoning = false }
    process.stdout.write(d.content)
  }
}
console.log()
