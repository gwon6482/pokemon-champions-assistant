import mongoose from 'mongoose'
import { connectDB } from '../../lib/db.js'
import { BattleRecord } from '../../lib/models.js'
import { handleCors } from '../../lib/cors.js'
import { verifyToken } from '../../lib/authMiddleware.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return

  const decoded = verifyToken(req, res)
  if (!decoded) return

  await connectDB()

  if (req.method !== 'GET') {
    return res.status(405).json({ error: '허용되지 않는 메서드입니다.' })
  }

  try {
    const { mode, result, page = 1, limit = 20 } = req.query
    const filter = { userId: decoded.userId }

    if (mode) filter.mode = mode
    if (result) filter.result = result

    const skip = (Number(page) - 1) * Number(limit)

    const [records, total] = await Promise.all([
      BattleRecord.find(filter)
        .populate('myParty myCombo opponentParty opponentCombo', 'name types imageUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      BattleRecord.countDocuments(filter)
    ])

    const userObjectId = new mongoose.Types.ObjectId(decoded.userId)
    const stats = await BattleRecord.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: '$result', count: { $sum: 1 } } }
    ])

    const winLoss = { win: 0, lose: 0, draw: 0 }
    stats.forEach(s => { winLoss[s._id] = s.count })

    return res.status(200).json({
      data: records,
      stats: winLoss,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    })
  } catch (err) {
    console.error('[GET /api/records]', err)
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
}
