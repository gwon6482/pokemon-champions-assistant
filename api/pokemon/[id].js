import { connectDB } from '../../lib/db.js'
import { Pokemon } from '../../lib/models.js'
import { handleCors } from '../../lib/cors.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return

  await connectDB()

  const id = req.query.id || req.params?.id

  if (req.method !== 'GET') {
    return res.status(405).json({ error: '허용되지 않는 메서드입니다.' })
  }

  try {
    // nationalId 또는 ObjectId로 조회
    const pokemon = isNaN(id)
      ? await Pokemon.findById(id).lean()
      : await Pokemon.findOne({ nationalId: Number(id) }).lean()

    if (!pokemon) {
      return res.status(404).json({ error: '포켓몬을 찾을 수 없습니다.' })
    }

    return res.status(200).json(pokemon)
  } catch (err) {
    console.error('[GET /api/pokemon/:id]', err)
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
}
