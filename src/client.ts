import { Models } from './resources/models'
import { FIM } from './resources/fim'
import { Chat } from './resources/chat'
import { User } from './resources/user'

export class DeepSeekClient {
  private apiKey: string
  private baseUrl: string

  readonly models = new Models(this)
  readonly fim = new FIM(this)
  readonly user = new User(this)
  readonly chat = new Chat(this)

  constructor(config: { apiKey: string; baseUrl?: string }) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl ?? 'https://api.deepseek.com'
  }

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`DeepSeek API error ${response.status}: ${body}`)
    }

    return response.json() as Promise<T>
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`DeepSeek API error ${response.status}: ${body}`)
    }

    return response.json() as Promise<T>
  }

  async *postStream<T>(path: string, body: unknown): AsyncGenerator<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`DeepSeek API error ${response.status}: ${body}`)
    }

    if (!response.body) {
      throw new Error('No response body')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue

          const data = trimmed.slice(6)
          if (data === '[DONE]') return

          yield JSON.parse(data) as T
        }
      }
    } finally {
      reader.releaseLock()
    }
  }
}
