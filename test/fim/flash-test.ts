import { client } from '../_shared'

console.log('=== 测试 deepseek-v4-flash FIM 非流式 ===')

const result = await client.fim.create({
  model: 'deepseek-v4-flash',
  prompt: 'def fibonacci(n):\n    """返回第 n 个斐波那契数"""\n',
  suffix: '\n    return b',
  max_tokens: 128,
  temperature: 0,
})
console.log('返回 model:', result.model)
console.log('choices:', JSON.stringify(result.choices, null, 2))

console.log('\n=== 测试 deepseek-v4-flash FIM 流式 ===')
for await (const chunk of client.fim.create({
  model: 'deepseek-v4-flash',
  prompt: 'const greet = (name: string): string => {\n  ',
  suffix: '\n}',
  max_tokens: 128,
  stream: true,
})) {
  process.stdout.write(chunk.choices[0]?.text ?? '')
}
console.log()
