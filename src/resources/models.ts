import type { DeepSeekClient } from '../client'
import type { ListModelsResponse } from '../../types/models'

export class Models {
  constructor(private client: DeepSeekClient) {}

  /** 列出可用的模型列表 */
  async list(): Promise<ListModelsResponse> {
    return this.client.get<ListModelsResponse>('/models')
  }
}
