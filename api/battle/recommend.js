import Anthropic from '@anthropic-ai/sdk'
import { connectDB } from '../lib/db.js'
import { Pokemon } from '../lib/models.js'
import { handleCors } from '../lib/cors.js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (handleCors(req, res)) return

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메서드입니다.' })
  }

  await connectDB()

  try {
    const { myParty, opponentParty, mode = 'single' } = req.body

    if (!myParty?.length || !opponentParty?.length) {
      return res.status(400).json({ error: 'myParty와 opponentParty는 필수입니다.' })
    }

    const [myPokemons, opponentPokemons] = await Promise.all([
      Pokemon.find({ _id: { $in: myParty } }).lean(),
      Pokemon.find({ _id: { $in: opponentParty } }).lean()
    ])

    const formatPokemon = p => ({
      id: p._id,
      name: p.name.ko,
      types: p.types,
      stats: p.baseStats
    })

    const systemPrompt = `당신은 포켓몬 챔피언스 배틀 전문가입니다.
내 파티와 상대 파티 정보를 분석하여 최적의 조합을 추천합니다.
타입 상성, 스피드 서열, 역할 분담을 종합적으로 고려해주세요.
응답은 반드시 JSON 형식으로만 반환하고, 다른 텍스트는 포함하지 마세요.`

    const comboSize = mode === 'double' ? 4 : 3

    const userPrompt = `배틀 모드: ${mode === 'double' ? '더블' : '싱글'} (${comboSize}마리 선택)

내 파티 (6마리):
${myPokemons.map((p, i) => `${i + 1}. ${p.name.ko} [${p.types.join('/')}] HP:${p.baseStats.hp} 공:${p.baseStats.attack} 방:${p.baseStats.defense} 특공:${p.baseStats.spAtk} 특방:${p.baseStats.spDef} 속:${p.baseStats.speed}`).join('\n')}

상대 파티 (6마리):
${opponentPokemons.map((p, i) => `${i + 1}. ${p.name.ko} [${p.types.join('/')}] HP:${p.baseStats.hp} 공:${p.baseStats.attack} 방:${p.baseStats.defense} 특공:${p.baseStats.spAtk} 특방:${p.baseStats.spDef} 속:${p.baseStats.speed}`).join('\n')}

내 파티에서 최적 ${comboSize}마리 조합 상위 3개를 추천해주세요.

응답 JSON 형식:
{
  "recommendations": [
    {
      "combo": ["포켓몬이름1", "포켓몬이름2", "포켓몬이름3"],
      "score": 85,
      "reason": "추천 이유 (2-3문장)",
      "strategy": "전략 설명 (2-3문장)",
      "warnings": ["주의사항1", "주의사항2"]
    }
  ]
}`

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })

    const rawText = message.content[0].text.trim()
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('AI 응답 파싱 실패')

    const aiResult = JSON.parse(jsonMatch[0])

    // 포켓몬 이름 → ID 매핑
    const nameToId = {}
    myPokemons.forEach(p => { nameToId[p.name.ko] = String(p._id) })

    const recommendations = aiResult.recommendations.map(rec => ({
      ...rec,
      comboIds: rec.combo.map(name => nameToId[name]).filter(Boolean)
    }))

    return res.status(200).json({
      mode,
      myParty: myPokemons.map(formatPokemon),
      opponentParty: opponentPokemons.map(formatPokemon),
      recommendations
    })
  } catch (err) {
    console.error('[POST /api/battle/recommend]', err)
    return res.status(500).json({ error: '추천 생성 중 오류가 발생했습니다.' })
  }
}
