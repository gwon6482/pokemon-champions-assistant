import { connectDB } from '../../lib/db.js'
import { BattleRecord } from '../../lib/models.js'
import { handleCors } from '../../lib/cors.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메서드입니다.' })
  }

  await connectDB()

  try {
    const { mode, myParty, myCombo, opponentParty, opponentCombo, result, note } = req.body

    if (!mode || !result) {
      return res.status(400).json({ error: 'mode와 result는 필수입니다.' })
    }

    const record = await BattleRecord.create({
      mode,
      myParty: myParty || [],
      myCombo: myCombo || [],
      opponentParty: opponentParty || [],
      opponentCombo: opponentCombo || [],
      result,
      note: note || ''
    })

    return res.status(201).json(record)
  } catch (err) {
    console.error('[POST /api/battle/record]', err)
    return res.status(500).json({ error: '전적 저장 중 오류가 발생했습니다.' })
  }
}
