import bcrypt from 'bcryptjs'
import { connectDB } from '../lib/db.js'
import { User } from '../lib/models.js'
import { signToken } from '../lib/authMiddleware.js'
import { handleCors } from '../lib/cors.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: '허용되지 않는 메서드입니다.' })

  await connectDB()

  const { username, password, confirmPassword } = req.body

  // 입력값 검증
  if (!username || !password || !confirmPassword) {
    return res.status(400).json({ error: '모든 항목을 입력해주세요.' })
  }
  if (!/^[a-zA-Z0-9]{1,8}$/.test(username)) {
    return res.status(400).json({ error: '아이디는 영문/숫자 조합 최대 8자입니다.' })
  }
  if (!/^\d+$/.test(password)) {
    return res.status(400).json({ error: '비밀번호는 숫자만 입력 가능합니다.' })
  }
  if (password.length < 4) {
    return res.status(400).json({ error: '비밀번호는 4자리 이상이어야 합니다.' })
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: '비밀번호가 일치하지 않습니다.' })
  }

  try {
    const exists = await User.findOne({ username })
    if (exists) return res.status(409).json({ error: '이미 사용 중인 아이디입니다.' })

    const hashed = await bcrypt.hash(password, 10)
    const user = await User.create({ username, password: hashed })

    const token = signToken({ userId: user._id, username: user.username })
    return res.status(201).json({ token, username: user.username })
  } catch (err) {
    console.error('[/api/auth/register]', err)
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
}
