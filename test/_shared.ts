import { config } from 'dotenv'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { DeepSeekClient } from '../src/index'
import type { ChatMessage, ToolCall } from '../types/chat-completion'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '..', '.env.local'), quiet: true })
const apiKey = process.env['DEEPSEEK_API_KEY']
if (!apiKey) throw new Error('DEEPSEEK_API_KEY not found in .env.local')
export const client = new DeepSeekClient({ apiKey })

/** 用 zod schema 定义 tool，自动转为 JSON Schema */
export function tool(name: string, description: string, schema: z.ZodType) {
  return { type: 'function' as const, function: { name, description, parameters: z.toJSONSchema(schema) } }
}

export function logAssistant(msg: {
  role?: string
  content?: string | null
  reasoning_content?: string | null
  tool_calls?: ToolCall[]
}) {
  if (msg.reasoning_content) {
    console.log('  reasoning:', msg.reasoning_content, '...')
  }
  if (msg.content) {
    console.log('  content:', msg.content)
  }
  if (msg.tool_calls?.length) {
    for (const tc of msg.tool_calls) {
      console.log('  tool_call →', tc.function.name, tc.function.arguments)
    }
  }
}
/** 运行一个包含工具调用循环的对话轮次 */
export async function runTurnWithTools(
  turnName: string,
  messages: ChatMessage[],
  tools: {
    type: 'function'
    function: {
      name: string
      description: string
      parameters: Record<string, unknown>
    }
  }[],
  toolExecutor: (name: string, args: Record<string, unknown>) => string,
) {
  console.log(`\n${'─'.repeat(50)}`)
  console.log(`${turnName}`)
  console.log(`${'─'.repeat(50)}`)
  let subTurn = 1
  while (true) {
    console.log(`\n--- 子轮 ${subTurn} ---`)
    const res = await client.chat.create({
      model: 'deepseek-v4-flash',
      messages,
      tools,
      tool_choice: 'auto',
      reasoning_effort: 'max',
      max_tokens: 8192,
    })
    const msg = res.choices[0]!.message
    logAssistant(msg)
    messages.push(msg)
    if (msg.tool_calls?.length) {
      for (const tc of msg.tool_calls) {
        const args = JSON.parse(tc.function.arguments)
        const result = toolExecutor(tc.function.name, args)
        console.log(`  ← tool result [${tc.function.name}]:`, result)
        messages.push({ role: 'tool', tool_call_id: tc.id, content: result })
      }
      subTurn++
    } else {
      break
    }
  }
}
