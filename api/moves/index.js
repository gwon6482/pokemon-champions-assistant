import { connectDB } from '../lib/db.js'
import { handleCors } from '../lib/cors.js'
import mongoose from 'mongoose'

export default async function handler(req, res) {
  if (handleCors(req, res)) return

  if (req.method !== 'GET') {
    return res.status(405).json({ error: '허용되지 않는 메서드입니다.' })
  }

  await connectDB()

  const q = (req.query.q || '').trim()
  if (!q) return res.status(200).json([])

  try {
    const col = mongoose.connection.db.collection('pokemons')

    // 포켓몬 도큐먼트에 내장된 moves를 언와인드해서 중복 제거 후 검색
    const results = await col.aggregate([
      { $unwind: '$moves' },
      {
        $match: {
          'moves.nameKo': { $regex: q, $options: 'i' }
        }
      },
      {
        $group: {
          _id: '$moves.nameKo',
          nameKo:      { $first: '$moves.nameKo' },
          nameEn:      { $first: '$moves.nameEn' },
          type:        { $first: '$moves.type' },
          damageClass: { $first: '$moves.damageClass' },
          power:       { $first: '$moves.power' },
          pp:          { $first: '$moves.pp' }
        }
      },
      { $sort: { nameKo: 1 } },
      { $limit: 30 }
    ]).toArray()

    return res.status(200).json(results)
  } catch (err) {
    console.error('[GET /api/moves]', err)
    return res.status(500).json({ error: '기술 검색 중 오류가 발생했습니다.' })
  }
}
