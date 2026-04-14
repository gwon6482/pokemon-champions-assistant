import bcrypt from 'bcryptjs'
import { connectDB } from '../lib/db.js'
import { User } from '../lib/models.js'
import { signToken } from '../lib/authMiddleware.js'
import { handleCors } from '../lib/cors.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: '허용되지 않는 메서드입니다.' })

  await connectDB()

  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호를 입력해주세요.' })
  }

  try {
    const user = await User.findOne({ username })
    if (!user) return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' })

    const token = signToken({ userId: user._id, username: user.username })
    return res.status(200).json({ token, username: user.username })
  } catch (err) {
    console.error('[/api/auth/login]', err)
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
}
