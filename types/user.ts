export interface BalanceInfo {
  /** 货币种类 */
  currency: 'CNY' | 'USD'
  /** 总的可用余额（赠金 + 充值） */
  total_balance: string
  /** 未过期的赠金余额 */
  granted_balance: string
  /** 充值余额 */
  topped_up_balance: string
}

export interface BalanceResponse {
  /** 当前账户是否有余额可供 API 调用 */
  is_available: boolean
  /** 余额信息列表（按币种） */
  balance_infos: BalanceInfo[]
}
