import { z } from 'zod'
import { runTurnWithTools, tool } from '../../_shared'
import type { ChatMessage } from '../../../types/chat-completion'

const tools = [
  tool('get_date', '获取当前日期', z.object({})),
  tool('get_weather', '查询指定城市和日期的天气', z.object({
    city: z.string().describe('城市名称'),
    date: z.string().describe('日期，格式 YYYY-mm-dd'),
  })),
]
function toolExecutor(name: string, args: Record<string, unknown>): string {
  if (name === 'get_date') return '2026-05-02'
  if (name === 'get_weather') {
    return args.city === '杭州'
      ? '晴，18°C ~ 28°C，东南风 2-3 级'
      : '多云转阵雨，22°C ~ 30°C，南风 3 级'
  }
  return `mock result for ${name}`
}
const messages: ChatMessage[] = [
  { role: 'user', content: '杭州明天天气怎么样？' },
]
await runTurnWithTools('Turn 1: 杭州明天天气', messages, tools, toolExecutor)
messages.push({ role: 'user', content: '那广州明天呢？' })
await runTurnWithTools('Turn 2: 广州明天天气', messages, tools, toolExecutor)
messages.push({ role: 'user', content: '两地温差大吗？适合穿什么？' })
await runTurnWithTools('Turn 3: 两地对比', messages, tools, toolExecutor)
