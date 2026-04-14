import { connectDB } from '../lib/db.js'
import { MyRoster } from '../lib/models.js'
import { handleCors } from '../lib/cors.js'
import { verifyToken } from '../lib/authMiddleware.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return

  const decoded = verifyToken(req, res)
  if (!decoded) return

  await connectDB()

  const id = req.query.id || req.params?.id
  const userId = decoded.userId

  try {
    if (req.method === 'PUT') {
      const slot = await MyRoster.findOneAndUpdate(
        { _id: id, userId },
        req.body,
        { new: true }
      ).populate('pokemonId').lean()

      if (!slot) return res.status(404).json({ error: '슬롯을 찾을 수 없습니다.' })
      return res.status(200).json(slot)
    }

    if (req.method === 'DELETE') {
      const slot = await MyRoster.findOneAndDelete({ _id: id, userId })
      if (!slot) return res.status(404).json({ error: '슬롯을 찾을 수 없습니다.' })
      return res.status(200).json({ message: '삭제되었습니다.' })
    }

    return res.status(405).json({ error: '허용되지 않는 메서드입니다.' })
  } catch (err) {
    console.error('[/api/roster/:id]', err)
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
}
