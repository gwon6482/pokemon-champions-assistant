/**
 * 포켓몬별 기술/특성 데이터 수집 스크립트
 * 실행: npm run fetch-moves
 */

import fetch from 'node-fetch'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// ─── 특성 캐시 ───────────────────────────────────────────────────────────────
const abilityCache = {}
async function fetchAbility(url) {
  if (abilityCache[url]) return abilityCache[url]
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  const result = {
    nameKo: data.names.find(n => n.language.name === 'ko')?.name || data.name,
    nameEn: data.names.find(n => n.language.name === 'en')?.name || data.name
  }
  abilityCache[url] = result
  return result
}

// ─── 기술 캐시 ───────────────────────────────────────────────────────────────
const moveCache = {}
async function fetchMove(url) {
  if (moveCache[url]) return moveCache[url]
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  const result = {
    nameKo: data.names.find(n => n.language.name === 'ko')?.name || data.name,
    nameEn: data.names.find(n => n.language.name === 'en')?.name || data.name,
    type: data.type?.name || '',
    damageClass: data.damage_class?.name || 'status',
    power: data.power ?? null,
    pp: data.pp ?? null
  }
  moveCache[url] = result
  return result
}

// ─── nationalId + formId → PokeAPI 포켓몬 URL ────────────────────────────────
const speciesCache = {}
async function getPokemonUrl(rawNationalId, formId) {
  const formIndex = parseInt(formId || '000', 10)
  // DB의 nationalId: 폼이면 nationalId*1000+formIndex로 저장됨
  const nationalId = rawNationalId < 1000 ? rawNationalId : Math.floor(rawNationalId / 1000)

  if (formIndex === 0) {
    return `https://pokeapi.co/api/v2/pokemon/${nationalId}`
  }

  if (!speciesCache[nationalId]) {
    const r = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${nationalId}`)
    if (!r.ok) return null
    speciesCache[nationalId] = await r.json()
  }
  const species = speciesCache[nationalId]
  const variety = species.varieties[formIndex] ?? species.varieties[0]
  return variety?.pokemon?.url ?? null
}

// ─── 메인 ────────────────────────────────────────────────────────────────────
async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) { console.error('❌ MONGODB_URI 없음'); process.exit(1) }

  await mongoose.connect(uri)
  const col = mongoose.connection.db.collection('pokemons')
  console.log('✅ MongoDB 연결 완료')

  const allPokemon = await col.find({}).sort({ nationalId: 1 }).toArray()
  console.log(`📋 처리할 포켓몬: ${allPokemon.length}마리\n`)

  let updated = 0, failed = 0

  for (let i = 0; i < allPokemon.length; i++) {
    const p = allPokemon[i]
    process.stdout.write(`[${String(i + 1).padStart(3)}/${allPokemon.length}] ${p.name.ko} ... `)

    try {
      const pokemonUrl = await getPokemonUrl(p.nationalId, p.formId)
      if (!pokemonUrl) { console.log('❌ URL 없음'); failed++; continue }

      const pokemonRes = await fetch(pokemonUrl)
      if (!pokemonRes.ok) { console.log(`❌ HTTP ${pokemonRes.status}`); failed++; continue }
      const pokemon = await pokemonRes.json()

      // 특성
      const abilities = []
      for (const a of pokemon.abilities) {
        await new Promise(r => setTimeout(r, 100))
        const d = await fetchAbility(a.ability.url)
        if (d) abilities.push({ ...d, isHidden: a.is_hidden })
      }

      // 기술 (레벨업/머신/교사/알 기술)
      const LEARN_METHODS = new Set(['level-up', 'machine', 'tutor', 'egg'])
      const moveUrls = [...new Set(
        pokemon.moves
          .filter(m => m.version_group_details.some(v => LEARN_METHODS.has(v.move_learn_method.name)))
          .map(m => m.move.url)
      )]

      const moves = []
      for (const url of moveUrls) {
        await new Promise(r => setTimeout(r, 80))
        const d = await fetchMove(url)
        if (d) moves.push(d)
      }
      moves.sort((a, b) => (a.nameKo ?? '').localeCompare(b.nameKo ?? '', 'ko'))

      await col.updateOne(
        { _id: p._id },
        { $set: { abilities, moves } }
      )
      console.log(`✅ 특성 ${abilities.length}개, 기술 ${moves.length}개`)
      updated++

    } catch (err) {
      console.log(`⚠️  ${err.message}`)
      failed++
    }

    await new Promise(r => setTimeout(r, 200))
  }

  console.log('\n' + '─'.repeat(50))
  console.log(`✅ 완료: ${updated}마리 | ❌ 실패: ${failed}마리`)
  await mongoose.disconnect()
}

main().catch(err => { console.error('❌', err); process.exit(1) })
