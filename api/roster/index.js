import { connectDB } from '../../lib/db.js'
import { MyRoster } from '../../lib/models.js'
import { handleCors } from '../../lib/cors.js'
import { verifyToken } from '../../lib/authMiddleware.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return

  const decoded = verifyToken(req, res)
  if (!decoded) return

  await connectDB()

  const userId = decoded.userId

  try {
    if (req.method === 'GET') {
      const roster = await MyRoster.find({ userId })
        .populate('pokemonId')
        .sort({ slotIndex: 1 })
        .lean()
      return res.status(200).json(roster)
    }

    if (req.method === 'POST') {
      const { slotIndex, pokemonId, nickname, nature, ability, heldItem, moves, evTraining } = req.body

      if (slotIndex === undefined || !pokemonId) {
        return res.status(400).json({ error: 'slotIndex와 pokemonId는 필수입니다.' })
      }

      // 같은 슬롯이 있으면 교체
      const existing = await MyRoster.findOne({ userId, slotIndex })
      if (existing) {
        await MyRoster.deleteOne({ userId, slotIndex })
      }

      const slot = await MyRoster.create({
        userId,
        slotIndex,
        pokemonId,
        nickname: nickname || '',
        nature: nature || '',
        ability: ability || '',
        heldItem: heldItem || '',
        moves: moves || [],
        evTraining: evTraining || {}
      })

      const populated = await slot.populate('pokemonId')
      return res.status(201).json(populated)
    }

    // DELETE ALL (파티 초기화)
    if (req.method === 'DELETE') {
      await MyRoster.deleteMany({ userId })
      return res.status(200).json({ message: '파티가 초기화되었습니다.' })
    }

    return res.status(405).json({ error: '허용되지 않는 메서드입니다.' })
  } catch (err) {
    console.error('[/api/roster]', err)
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
}
