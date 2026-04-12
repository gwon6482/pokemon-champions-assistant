import { connectDB } from '../lib/db.js'
import { Pokemon } from '../lib/models.js'
import { handleCors } from '../lib/cors.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return

  await connectDB()

  if (req.method !== 'GET') {
    return res.status(405).json({ error: '허용되지 않는 메서드입니다.' })
  }

  try {
    const { q, types, championsOnly, page = 1, limit = 50 } = req.query

    const filter = {}

    if (championsOnly !== 'false') {
      filter.availableInChampions = true
    }

    if (types) {
      const typeList = types.split(',').map(t => t.trim())
      filter.types = { $all: typeList }
    }

    if (q) {
      const regex = new RegExp(q, 'i')
      filter.$or = [
        { 'name.ko': regex },
        { 'name.en': regex }
      ]
    }

    const skip = (Number(page) - 1) * Number(limit)

    const [pokemons, total] = await Promise.all([
      Pokemon.find(filter)
        .sort({ nationalId: 1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Pokemon.countDocuments(filter)
    ])

    return res.status(200).json({
      data: pokemons,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    })
  } catch (err) {
    console.error('[GET /api/pokemon]', err)
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
}
