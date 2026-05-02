export interface Model {
  /** 模型的标识符，例如 `deepseek-v4-flash` */
  id: string
  /** 对象类型，其值为 `model` */
  object: 'model'
  /** 拥有该模型的组织 */
  owned_by: string
}

export interface ListModelsResponse {
  /** 对象类型，其值为 `list` */
  object: 'list'
  /** 可用模型列表 */
  data: Model[]
}
