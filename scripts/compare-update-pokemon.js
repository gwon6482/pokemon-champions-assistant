/**
 * CSV와 MongoDB 포켓몬 데이터 비교/업데이트 스크립트
 * 실행: node scripts/compare-update-pokemon.js
 *
 * CSV 파일(pokemon-champions-list.csv)의 스탯을 MongoDB의 baseStats와 비교하여 다른 경우 업데이트
 * DB에 없는 포켓몬은 목록으로 출력
 */

import fs from 'fs'
import path from 'path'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// ─── 인코딩 복원 ─────────────────────────────────────────────────────────────
// 파일이 UTF-8 데이터를 Latin-1로 오해석한 mojibake 상태로 저장됨
// 복원: UTF-8 디코딩 → latin1 바이트로 재인코딩 → UTF-8 디코딩
function fixEncoding(buffer) {
  const mojibake = buffer.toString('utf8')
  return Buffer.from(mojibake, 'latin1').toString('utf8')
}

// ─── CSV 파싱 ─────────────────────────────────────────────────────────────────
function parseCsv(content) {
  const lines = content.split('\n')

  // 헤더 행 찾기 ("번호,이름," 으로 시작)
  let headerIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('번호,이름,')) {
      headerIdx = i
      break
    }
  }
  if (headerIdx === -1) throw new Error('헤더 행을 찾을 수 없습니다')

  const rows = []
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // CSV 파싱 (따옴표 처리 포함)
    const cols = parseCSVLine(line)
    if (cols.length < 16) continue

    const [num, name, form, type1, type2, ability1, ability2, hiddenAbility, wiki,
           hp, attack, defense, spAtk, spDef, speed, total] = cols

    const parsedHp = parseInt(hp)
    if (!name || isNaN(parsedHp)) continue

    rows.push({
      num: parseInt(num) || 0,
      name: name.trim(),
      form: form.trim(),
      type1: type1.trim(),
      type2: type2.trim(),
      baseStats: {
        hp: parsedHp,
        attack: parseInt(attack) || 0,
        defense: parseInt(defense) || 0,
        spAtk: parseInt(spAtk) || 0,
        spDef: parseInt(spDef) || 0,
        speed: parseInt(speed) || 0,
      }
    })
  }
  return rows
}

function parseCSVLine(line) {
  const result = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  result.push(cur)
  return result
}

// ─── Pokemon 스키마 ──────────────────────────────────────────────────────────
const pokemonSchema = new mongoose.Schema({
  nationalId: Number,
  name: { ko: String, en: String },
  types: [String],
  imageUrl: String,
  spriteUrl: String,
  baseStats: {
    hp: Number, attack: Number, defense: Number,
    spAtk: Number, spDef: Number, speed: Number
  },
  availableInChampions: Boolean,
  abilities: Array,
  moves: Array,
}, { timestamps: true, strict: false })

// ─── 메인 ────────────────────────────────────────────────────────────────────
async function main() {
  // CSV 읽기 & 인코딩 복원
  const csvPath = path.resolve(__dirname, 'pokemon-champions-list.csv')
  const rawBuffer = fs.readFileSync(csvPath)
  const content = fixEncoding(rawBuffer)
  const csvRows = parseCsv(content)

  console.log(`\nCSV 포켓몬 수: ${csvRows.length}개`)

  // MongoDB 연결
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('MongoDB 연결 완료')

  const Pokemon = mongoose.models.Pokemon || mongoose.model('Pokemon', pokemonSchema)
  const allPokemon = await Pokemon.find({}).lean()

  console.log(`DB 포켓몬 수: ${allPokemon.length}개\n`)

  // DB 포켓몬을 한국어 이름으로 인덱싱
  const byKoName = {}
  for (const p of allPokemon) {
    if (p.name?.ko) byKoName[p.name.ko] = p
  }

  let updated = 0
  let skipped = 0
  const notFound = []

  for (const row of csvRows) {
    const dbPoke = byKoName[row.name]

    if (!dbPoke) {
      notFound.push(row)
      continue
    }

    const bs = dbPoke.baseStats || {}
    const csv = row.baseStats
    const changed =
      bs.hp      !== csv.hp      ||
      bs.attack  !== csv.attack  ||
      bs.defense !== csv.defense ||
      bs.spAtk   !== csv.spAtk  ||
      bs.spDef   !== csv.spDef  ||
      bs.speed   !== csv.speed

    if (!changed) {
      skipped++
      continue
    }

    console.log(`[UPDATE] ${row.name}${row.form ? ` (${row.form})` : ''}`)
    console.log(`  HP: ${bs.hp} → ${csv.hp}`)
    console.log(`  공격: ${bs.attack} → ${csv.attack}`)
    console.log(`  방어: ${bs.defense} → ${csv.defense}`)
    console.log(`  특수공격: ${bs.spAtk} → ${csv.spAtk}`)
    console.log(`  특수방어: ${bs.spDef} → ${csv.spDef}`)
    console.log(`  스피드: ${bs.speed} → ${csv.speed}`)

    await Pokemon.updateOne(
      { _id: dbPoke._id },
      { $set: { baseStats: csv } }
    )
    updated++
  }

  // ─── 결과 출력 ──────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60))
  console.log(`업데이트 완료: ${updated}개`)
  console.log(`변경 없음: ${skipped}개`)
  console.log(`DB에 없는 포켓몬: ${notFound.length}개`)
  console.log('='.repeat(60))

  if (notFound.length > 0) {
    console.log('\n=== DB에 없는 포켓몬 ===')
    for (const p of notFound) {
      const form = p.form ? ` (${p.form})` : ''
      const type2 = p.type2 ? `/${p.type2}` : ''
      const bs = p.baseStats
      console.log(
        `  [${String(p.num).padStart(3)}] ${p.name}${form} | ${p.type1}${type2} | ` +
        `HP${bs.hp} ATK${bs.attack} DEF${bs.defense} SpAtk${bs.spAtk} SpDef${bs.spDef} Spd${bs.speed} Total${bs.hp+bs.attack+bs.defense+bs.spAtk+bs.spDef+bs.speed}`
      )
    }
  }

  await mongoose.disconnect()
  console.log('\n완료!')
}

main().catch(e => { console.error(e); process.exit(1) })
