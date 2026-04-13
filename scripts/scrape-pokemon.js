/**
 * 포켓몬 챔피언스 DB 구축 스크립트
 * 실행: npm run scrape
 *
 * 공식 챔피언스 페이지에서 213마리 목록을 가져와
 * PokeAPI로 nationalId/타입/스탯/이미지를 보완 후 MongoDB에 저장
 */

import fetch from 'node-fetch'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// ─── 스키마 ──────────────────────────────────────────────────────────────────
const pokemonSchema = new mongoose.Schema({
  nationalId: { type: Number, required: true, unique: true },
  formId:     { type: String, default: '000' }, // "000", "001" 등
  name:       { ko: String, en: String },
  types:      [String],
  imageUrl:   String,
  spriteUrl:  String,
  baseStats: {
    hp: Number, attack: Number, defense: Number,
    spAtk: Number, spDef: Number, speed: Number
  },
  availableInChampions: { type: Boolean, default: true }
}, { timestamps: true })

const Pokemon = mongoose.models.Pokemon || mongoose.model('Pokemon', pokemonSchema)

// ─── 공식 챔피언스 페이지에서 포켓몬 목록 파싱 ──────────────────────────────
async function fetchChampionsList() {
  const res = await fetch(
    'https://web-view.app.pokemonchampions.jp/battle/pages/events/rs177501629259kmzbny/ko/pokemon.html',
    { headers: { 'User-Agent': 'Mozilla/5.0' } }
  )
  const html = await res.text()
  const match = html.match(/const pokemons = (\[[\s\S]*?\]);/)
  if (!match) throw new Error('포켓몬 목록을 찾을 수 없습니다')

  const raw = JSON.parse(match[1])
  // ["XXXX-YYY", 1, "한국어이름"]
  return raw.map(([idStr, , nameKo]) => {
    const [nationalStr, formStr] = idStr.split('-')
    return {
      nationalId: parseInt(nationalStr, 10),
      formId: formStr, // "000", "001", ...
      nameKo
    }
  })
}

// ─── PokeAPI: 종 정보(varieties) + 한국/영어 이름 가져오기 ───────────────────
const speciesCache = {}
async function fetchSpecies(nationalId) {
  if (speciesCache[nationalId]) return speciesCache[nationalId]
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${nationalId}`)
  if (!res.ok) return null
  const data = await res.json()
  speciesCache[nationalId] = data
  return data
}

// ─── PokeAPI: 포켓몬 폼 데이터 가져오기 ─────────────────────────────────────
async function fetchPokemonByForm(nationalId, formId) {
  const species = await fetchSpecies(nationalId)
  if (!species) return null

  // varieties 배열에서 폼 인덱스로 선택
  // formId "000" → index 0 (기본폼), "001" → index 1, ...
  const formIndex = parseInt(formId, 10)
  const variety = species.varieties[formIndex] || species.varieties[0]

  const pokemonRes = await fetch(variety.pokemon.url)
  if (!pokemonRes.ok) return null
  const pokemon = await pokemonRes.json()

  const nameKo = species.names.find(n => n.language.name === 'ko')?.name || ''
  const nameEn = species.names.find(n => n.language.name === 'en')?.name || pokemon.name

  return {
    pokeApiId: pokemon.id,
    nameEn,
    types: pokemon.types.map(t => t.type.name),
    imageUrl: pokemon.sprites?.other?.['official-artwork']?.front_default
      || pokemon.sprites?.front_default
      || '',
    spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`,
    baseStats: {
      hp:      pokemon.stats[0].base_stat,
      attack:  pokemon.stats[1].base_stat,
      defense: pokemon.stats[2].base_stat,
      spAtk:   pokemon.stats[3].base_stat,
      spDef:   pokemon.stats[4].base_stat,
      speed:   pokemon.stats[5].base_stat
    }
  }
}

// ─── DB에 저장 (nationalId + formId 복합 키) ─────────────────────────────────
async function savePokemon(entry, apiData) {
  // 같은 nationalId의 다른 폼은 formId로 구분
  // DB unique key는 nationalId이므로, 폼이 다르면 nationalId를 가상으로 구분
  // ex) 128-001 → nationalId = 1280001 (형식: NNNNFFF)
  const dbId = entry.formId === '000'
    ? entry.nationalId
    : entry.nationalId * 1000 + parseInt(entry.formId, 10)

  await Pokemon.findOneAndUpdate(
    { nationalId: dbId },
    {
      $set: {
        nationalId: dbId,
        formId: entry.formId,
        name: { ko: entry.nameKo, en: apiData.nameEn },
        types: apiData.types,
        imageUrl: apiData.imageUrl,
        spriteUrl: apiData.spriteUrl,
        baseStats: apiData.baseStats,
        availableInChampions: true
      }
    },
    { upsert: true, new: true }
  )
}

// ─── 메인 ────────────────────────────────────────────────────────────────────
async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) { console.error('❌ MONGODB_URI 없음'); process.exit(1) }

  await mongoose.connect(uri)
  console.log('✅ MongoDB 연결 완료')

  console.log('📡 공식 챔피언스 페이지 파싱 중...')
  const championsList = await fetchChampionsList()
  console.log(`📋 총 ${championsList.length}마리\n`)

  let saved = 0, failed = 0
  const failedList = []

  for (let i = 0; i < championsList.length; i++) {
    const entry = championsList[i]
    process.stdout.write(
      `[${String(i + 1).padStart(3)}/${championsList.length}] No.${entry.nationalId}-${entry.formId} ${entry.nameKo} ... `
    )

    try {
      const apiData = await fetchPokemonByForm(entry.nationalId, entry.formId)
      if (!apiData) {
        console.log('❌ PokeAPI 없음')
        failedList.push(`${entry.nationalId}-${entry.formId} ${entry.nameKo}`)
        failed++
      } else {
        await savePokemon(entry, apiData)
        console.log(`✅ [${apiData.types.join('/')}]`)
        saved++
      }
    } catch (err) {
      console.log(`⚠️  ${err.message}`)
      failedList.push(`${entry.nationalId}-${entry.formId} ${entry.nameKo}`)
      failed++
    }

    await new Promise(r => setTimeout(r, 250))
  }

  console.log('\n' + '─'.repeat(50))
  console.log(`✅ 저장: ${saved}마리 | ❌ 실패: ${failed}마리`)
  if (failedList.length) {
    console.log('\n실패 목록:')
    failedList.forEach(s => console.log(`  - ${s}`))
  }

  await mongoose.disconnect()
}

main().catch(err => { console.error('❌', err); process.exit(1) })
