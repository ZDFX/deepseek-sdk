import { DeepSeekClient } from './client'
import type { ListModelsResponse } from '../types/models'

/** 列出可用的模型列表 */
export async function listModels(client: DeepSeekClient): Promise<ListModelsResponse> {
  return client.get<ListModelsResponse>('/models')
}
