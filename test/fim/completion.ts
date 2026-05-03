import { client } from '../_shared'
// --- non-streaming ---
console.log('=== FIM Non-streaming ===')
const result = await client.fim.create( {
  model: 'deepseek-v4-pro',
  prompt: 'def fibonacci(n):\n    """返回第 n 个斐波那契数"""\n',
  suffix: '\n    return b',
  max_tokens: 8192,
  temperature: 0,
})
console.log(JSON.stringify(result, null, 2))
// --- streaming ---
console.log('\n=== FIM Streaming ===')
for await (const chunk of client.fim.create( {
  model: 'deepseek-v4-pro',
  prompt: 'const greet = (name: string): string => {\n  ',
  suffix: '\n}',
  max_tokens: 8192,
  stream: true,
})) {
  process.stdout.write(chunk.choices[0]?.text ?? '')
}
console.log()
