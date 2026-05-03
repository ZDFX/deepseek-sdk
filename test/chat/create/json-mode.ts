import { client } from '../../_shared'
console.log('=== JSON 模式 ===')
const r = await client.chat.create( {
  model: 'deepseek-v4-flash',
  messages: [
    { role: 'system', content: '始终以 JSON 格式输出。' },
    { role: 'user', content: '列出 3 种排序算法，字段：name（名称）、complexity（平均时间复杂度）' },
  ],
  response_format: { type: 'json_object' },
  max_tokens: 8192,
})
console.log('content:', r.choices[0]!.message.content)
