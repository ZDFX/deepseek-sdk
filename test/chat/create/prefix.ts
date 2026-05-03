import { client } from '../../_shared'

console.log('=== create | prefix ===')
const r = await client.chat.create({
  model: 'deepseek-v4-flash',
  messages: [
    { role: 'user', content: '请用 python 写快速排序' },
    { role: 'assistant', content: '```python\n', prefix: true },
  ],
  stop: ['```'],
  max_tokens: 8192,
})
console.log(r.choices[0]!.message.content)
