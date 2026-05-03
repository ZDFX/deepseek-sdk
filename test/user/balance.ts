import { client } from '../_shared'
const result = await client.user.balance()
console.log('Balance:', JSON.stringify(result, null, 2))
