import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'pokemon_champions_jwt_secret_key_2024'

export function verifyToken(req, res) {
  const authHeader = req.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '로그인이 필요합니다.' })
    return null
  }
  const token = authHeader.slice(7)
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    res.status(401).json({ error: '유효하지 않은 토큰입니다.' })
    return null
  }
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' })
}
