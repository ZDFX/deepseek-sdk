import { client } from '../../_shared'

// --- create: thinking enabled ---
console.log('=== create | thinking=enabled ===')
const r1 = await client.chat.create({
  model: 'deepseek-v4-flash',
  messages: [
    { role: 'system', content: '你是一个严谨的数学老师，回答前先展示推理过程。' },
    { role: 'user', content: '斐波那契数列第10项是多少？' },
  ],
  thinking: { type: 'enabled' },
  max_tokens: 8192,
})
const m1 = r1.choices[0]!.message
console.log('reasoning_content:', m1.reasoning_content)
console.log('content:', m1.content)
console.log('usage:', JSON.stringify(r1.usage, null, 2))

// --- create: thinking disabled ---
console.log('\n=== create | thinking=disabled ===')
const r2 = await client.chat.create({
  model: 'deepseek-v4-flash',
  messages: [{ role: 'user', content: '用一句话介绍 TypeScript' }],
  thinking: { type: 'disabled' },
  max_tokens: 8192,
})
console.log('content:', r2.choices[0]!.message.content)
console.log('reasoning_content:', r2.choices[0]!.message.reasoning_content)
