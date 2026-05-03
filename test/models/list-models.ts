import { client } from '../_shared'
const result = await client.models.list()
console.log('Models:', JSON.stringify(result, null, 2))
