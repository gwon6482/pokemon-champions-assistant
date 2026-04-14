/**
 * 메가진화 포켓몬 DB 추가 스크립트
 * 실행: node scripts/add-mega-pokemon.js
 *
 * Regulation M-A 메가진화 목록을 PokeAPI로 조회해 MongoDB에 추가
 * DB ID 규칙: formId=000 → nationalId 그대로, 나머지 → nationalId*1000+formIndex
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import fetch from 'node-fetch'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// ─── Regulation M-A 메가진화 목록 (Bulbapedia 기준, nationalId) ──────────────
// 단일 메가: [nationalId, 'mega']
// 복수 형태: [nationalId, 'mega-x'], [nationalId, 'mega-y']
const MEGA_TARGETS = [
  [3,   'mega'],    // Venusaur
  [6,   'mega-x'],  // Charizard X
  [6,   'mega-y'],  // Charizard Y
  [9,   'mega'],    // Blastoise
  [15,  'mega'],    // Beedrill
  [18,  'mega'],    // Pidgeot
  [36,  'mega'],    // Clefable (Legends Z-A)
  [65,  'mega'],    // Alakazam
  [71,  'mega'],    // Victreebel (Legends Z-A)
  [80,  'mega'],    // Slowbro
  [94,  'mega'],    // Gengar
  [115, 'mega'],    // Kangaskhan
  [121, 'mega'],    // Starmie (Legends Z-A)
  [127, 'mega'],    // Pinsir
  [130, 'mega'],    // Gyarados
  [142, 'mega'],    // Aerodactyl
  [149, 'mega'],    // Dragonite (Legends Z-A)
  [154, 'mega'],    // Meganium (Legends Z-A)
  [160, 'mega'],    // Feraligatr (Legends Z-A)
  [181, 'mega'],    // Ampharos
  [208, 'mega'],    // Steelix
  [212, 'mega'],    // Scizor
  [214, 'mega'],    // Heracross
  [227, 'mega'],    // Skarmory (Legends Z-A)
  [229, 'mega'],    // Houndoom
  [248, 'mega'],    // Tyranitar
  [282, 'mega'],    // Gardevoir
  [302, 'mega'],    // Sableye
  [306, 'mega'],    // Aggron
  [308, 'mega'],    // Medicham
  [310, 'mega'],    // Manectric
  [319, 'mega'],    // Sharpedo
  [323, 'mega'],    // Camerupt
  [334, 'mega'],    // Altaria
  [354, 'mega'],    // Banette
  [358, 'mega'],    // Chimecho (Legends Z-A)
  [359, 'mega'],    // Absol
  [362, 'mega'],    // Glalie
  [428, 'mega'],    // Lopunny
  [445, 'mega'],    // Garchomp
  [448, 'mega'],    // Lucario
  [460, 'mega'],    // Abomasnow
  [475, 'mega'],    // Gallade
  [478, 'mega'],    // Froslass (Legends Z-A)
  [500, 'mega'],    // Emboar (Legends Z-A)
  [530, 'mega'],    // Excadrill (Legends Z-A)
  [531, 'mega'],    // Audino
  [609, 'mega'],    // Chandelure (Legends Z-A)
  [623, 'mega'],    // Golurk (Legends Z-A)
  [652, 'mega'],    // Chesnaught (Legends Z-A)
  [655, 'mega'],    // Delphox (Legends Z-A)
  [658, 'mega'],    // Greninja (Legends Z-A)
  [670, 'mega'],    // Floette (Legends Z-A)
  [678, 'mega'],    // Meowstic (Legends Z-A)
  [701, 'mega'],    // Hawlucha (Legends Z-A)
  [740, 'mega'],    // Crabominable (Legends Z-A)
  [780, 'mega'],    // Drampa (Legends Z-A)
  [952, 'mega'],    // Scovillain (Legends Z-A)
  [970, 'mega'],    // Kilowattrel (Legends Z-A)
]

// ─── Pokemon 스키마 (scrape-pokemon.js와 동일한 규칙) ────────────────────────
const pokemonSchema = new mongoose.Schema({
  nationalId: { type: Number, required: true, unique: true },
  formId:     { type: String, default: '000' },
  name:       { ko: String, en: String },
  types:      [String],
  imageUrl:   String,
  spriteUrl:  String,
  baseStats: {
    hp: Number, attack: Number, defense: Number,
    spAtk: Number, spDef: Number, speed: Number
  },
  availableInChampions: { type: Boolean, default: true },
  abilities: Array,
  moves:     Array,
}, { timestamps: true })

// ─── 유틸 ────────────────────────────────────────────────────────────────────
const delay = ms => new Promise(r => setTimeout(r, ms))

async function fetchJson(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      if (res.status === 404) return null
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (e) {
      if (i === retries - 1) return null
      await delay(800 * (i + 1))
    }
  }
}

// ─── 메가 폼 조회 ─────────────────────────────────────────────────────────────
async function fetchMegaData(nationalId, megaSuffix) {
  const species = await fetchJson(`https://pokeapi.co/api/v2/pokemon-species/${nationalId}`)
  if (!species) return null

  const nameKo = species.names.find(n => n.language.name === 'ko')?.name || ''
  const nameEn = species.names.find(n => n.language.name === 'en')?.name || ''

  // varieties 중에서 mega-suffix 이름 찾기
  const targetSuffix = megaSuffix // e.g., 'mega', 'mega-x', 'mega-y'
  let varietyIdx = -1
  let varietyUrl = null

  for (let i = 0; i < species.varieties.length; i++) {
    const vName = species.varieties[i].pokemon.name
    if (vName.endsWith(`-${targetSuffix}`)) {
      varietyIdx = i
      varietyUrl = species.varieties[i].pokemon.url
      break
    }
  }

  if (varietyIdx < 0) {
    return { notFound: true, nationalId, megaSuffix, nameKo, nameEn }
  }

  const pokemon = await fetchJson(varietyUrl)
  if (!pokemon) return { notFound: true, nationalId, megaSuffix, nameKo, nameEn }

  // DB nationalId 계산 (scrape-pokemon.js와 동일한 규칙)
  const formIdStr = String(varietyIdx).padStart(3, '0')
  const dbNationalId = varietyIdx === 0
    ? nationalId
    : nationalId * 1000 + varietyIdx

  // 한국어 메가 이름
  const megaNameKo = targetSuffix === 'mega-x'
    ? `메가${nameKo} X`
    : targetSuffix === 'mega-y'
    ? `메가${nameKo} Y`
    : `메가${nameKo}`

  const megaNameEn = targetSuffix === 'mega-x'
    ? `Mega ${nameEn} X`
    : targetSuffix === 'mega-y'
    ? `Mega ${nameEn} Y`
    : `Mega ${nameEn}`

  return {
    dbNationalId,
    formId: formIdStr,
    name: { ko: megaNameKo, en: megaNameEn },
    types: pokemon.types.map(t => t.type.name),
    imageUrl: pokemon.sprites?.other?.['official-artwork']?.front_default
      || pokemon.sprites?.front_default || '',
    spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`,
    baseStats: {
      hp:      pokemon.stats[0].base_stat,
      attack:  pokemon.stats[1].base_stat,
      defense: pokemon.stats[2].base_stat,
      spAtk:   pokemon.stats[3].base_stat,
      spDef:   pokemon.stats[4].base_stat,
      speed:   pokemon.stats[5].base_stat,
    },
    availableInChampions: true,
  }
}

// ─── 메인 ────────────────────────────────────────────────────────────────────
async function main() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('MongoDB 연결 완료')

  const Pokemon = mongoose.models.Pokemon || mongoose.model('Pokemon', pokemonSchema)
  const existing = await Pokemon.find({}).lean()
  const existingIds = new Set(existing.map(p => p.nationalId))

  console.log(`기존 DB 포켓몬: ${existing.length}개\n`)

  let added = 0
  let skipped = 0
  let notFound = []

  for (const [nationalId, megaSuffix] of MEGA_TARGETS) {
    const label = `#${nationalId} ${megaSuffix}`
    process.stdout.write(`조회 중: ${label} ... `)

    const data = await fetchMegaData(nationalId, megaSuffix)
    await delay(300)

    if (!data) {
      console.log('오류')
      notFound.push({ nationalId, megaSuffix, reason: '조회 실패' })
      continue
    }

    if (data.notFound) {
      console.log(`PokeAPI 미수록 (${data.nameKo})`)
      notFound.push({ nationalId, megaSuffix, nameKo: data.nameKo, reason: 'PokeAPI에 없음 (Legends Z-A 신규)' })
      continue
    }

    if (existingIds.has(data.dbNationalId)) {
      console.log(`이미 존재 (${data.name.ko})`)
      skipped++
      continue
    }

    await Pokemon.findOneAndUpdate(
      { nationalId: data.dbNationalId },
      {
        $set: {
          nationalId: data.dbNationalId,
          formId: data.formId,
          name: data.name,
          types: data.types,
          imageUrl: data.imageUrl,
          spriteUrl: data.spriteUrl,
          baseStats: data.baseStats,
          availableInChampions: true,
        }
      },
      { upsert: true, new: true }
    )
    console.log(`추가: ${data.name.ko} (${data.types.join('/')}) DEF${data.baseStats.defense}`)
    added++
    existingIds.add(data.dbNationalId)
  }

  console.log('\n' + '='.repeat(60))
  console.log(`추가 완료: ${added}개`)
  console.log(`이미 존재: ${skipped}개`)
  console.log(`PokeAPI 미수록: ${notFound.length}개`)
  console.log('='.repeat(60))

  if (notFound.length > 0) {
    console.log('\n=== PokeAPI 미수록 목록 ===')
    notFound.forEach(p => console.log(`  - #${p.nationalId} ${p.megaSuffix} (${p.nameKo || '?'}): ${p.reason}`))
  }

  await mongoose.disconnect()
  console.log('\n완료!')
}

main().catch(e => { console.error(e); process.exit(1) })
