import type { ChatCompletionChunk } from '../../types/chat-completion'
import type { StreamEvent } from '../../types/event-stream'
import type { Usage } from '../../types/common'

export async function* toEventStream(
  chunks: AsyncGenerator<ChatCompletionChunk>,
  requestModel: string,
): AsyncGenerator<StreamEvent> {
  let reasoning = false, answer = false, tools = false, started = false
  let finishReason: string | null = null, usage: Usage | null = null
  const seenTools = new Set<number>()

  for await (const chunk of chunks) {
    if (!started) {
      started = true
      yield { type: 'message_start', id: chunk.id, model: chunk.model || requestModel, created: chunk.created, system_fingerprint: chunk.system_fingerprint }
    }
    const d = chunk.choices[0]?.delta
    const lp = chunk.choices[0]?.logprobs
    const fr = chunk.choices[0]?.finish_reason
    if (fr) finishReason = fr
    if (chunk.usage) usage = chunk.usage
    if (!d) continue

    if (d.reasoning_content) {
      if (!reasoning) {
        reasoning = true
        yield { type: 'reasoning_start' }
      }
      yield { type: 'reasoning_delta', text: d.reasoning_content, logprobs: lp?.reasoning_content ?? null }
    }

    if (d.content) {
      if (!answer) {
        if (reasoning) { yield { type: 'reasoning_end' } }
        answer = true
        yield { type: 'answer_start' }
      }
      yield { type: 'answer_delta', text: d.content, logprobs: lp?.content ?? null }
    }

    if (d.tool_calls?.length) {
      if (!tools) {
        if (reasoning && !answer) { yield { type: 'reasoning_end' } }
        if (answer) { yield { type: 'answer_end' } }
        tools = true
        yield { type: 'tool_calls_start' }
      }
      for (const tc of d.tool_calls) {
        const ti = tc.index ?? 0
        if (!seenTools.has(ti)) {
          seenTools.add(ti)
          yield { type: 'tool_call_name', id: tc.id, name: tc.function?.name ?? '' }
        }
        const args = tc.function?.arguments ?? ''
        if (args) {
          yield { type: 'tool_call_argument', partial_json: args }
        }
      }
    }
  }

  if (tools) yield { type: 'tool_calls_end' }
  if (finishReason !== null) yield { type: 'finish_reason', stop_reason: mapStop(finishReason) }
  if (usage) yield { type: 'usage', usage }
  yield { type: 'message_end' }
}

function mapStop(r: string): string {
  if (r === 'stop') return 'end_turn'
  if (r === 'tool_calls') return 'tool_use'
  if (r === 'length') return 'max_tokens'
  return r
}
