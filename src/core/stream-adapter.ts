import type { ChatCompletionChunk } from '../../types/chat-completion'
import type { StreamEvent } from '../../types/event-stream'

export async function* toEventStream(
  chunks: AsyncGenerator<ChatCompletionChunk>,
  requestModel: string,
): AsyncGenerator<StreamEvent> {
  let reasoning = false, text = false, tools = false, started = false
  let activeTool = -1, finishReason: string | null = null, outputTokens = 0
  const toolStates = new Map<number, { id: string; name: string; sent: string }>()

  for await (const chunk of chunks) {
    if (!started) { started = true; yield { type: 'message_start', id: chunk.id, model: chunk.model || requestModel } }
    const d = chunk.choices[0]?.delta
    const fr = chunk.choices[0]?.finish_reason
    if (fr) finishReason = fr
    if (chunk.usage) outputTokens = chunk.usage.completion_tokens ?? outputTokens
    if (!d) continue

    if (d.reasoning_content) {
      if (!reasoning) {
        reasoning = true
        yield { type: 'reasoning_start' }
      }
      yield { type: 'reasoning_delta', reasoning: d.reasoning_content }
    }

    if (d.content) {
      if (!text) {
        if (reasoning) { yield { type: 'reasoning_end' }; reasoning = false }
        text = true
        yield { type: 'content_start' }
      }
      yield { type: 'content_delta', text: d.content }
    }

    if (d.tool_calls?.length) {
      if (!tools) {
        if (reasoning) { yield { type: 'reasoning_end' }; reasoning = false }
        if (text) { yield { type: 'content_end' }; text = false }
        tools = true
        yield { type: 'tool_calls_start' }
      }
      for (const tc of d.tool_calls) {
        const ti = tc.index ?? 0
        if (!toolStates.has(ti)) {
          if (activeTool >= 0) yield { type: 'tool_call_end' }
          activeTool = ti
          toolStates.set(ti, { id: tc.id, name: tc.function?.name ?? '', sent: '' })
          yield { type: 'tool_call_start', id: tc.id, name: tc.function?.name ?? '' }
        }
        const ts = toolStates.get(ti)!
        const args = tc.function?.arguments ?? ''
        if (args.length > ts.sent.length) {
          const partial = args.slice(ts.sent.length)
          ts.sent = args
          yield { type: 'tool_call_delta', partial_json: partial }
        }
      }
    }
  }

  if (activeTool >= 0) yield { type: 'tool_call_end' }
  if (tools) yield { type: 'tool_calls_stop' }
  if (reasoning) yield { type: 'reasoning_end' }
  if (text) yield { type: 'content_end' }

  yield { type: 'message_delta', stop_reason: mapStop(finishReason ?? ''), output_tokens: outputTokens }
  yield { type: 'message_stop' }
}

function mapStop(r: string): string {
  if (r === 'stop') return 'end_turn'
  if (r === 'tool_calls') return 'tool_use'
  if (r === 'length') return 'max_tokens'
  return r
}
