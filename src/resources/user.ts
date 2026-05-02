import type { DeepSeekClient } from '../client'
import type { BalanceResponse } from '../../types/user'

export class User {
  constructor(private client: DeepSeekClient) {}

  /** 查询账号余额 */
  async balance(): Promise<BalanceResponse> {
    return this.client.get<BalanceResponse>('/user/balance')
  }
}
