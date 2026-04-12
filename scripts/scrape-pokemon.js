/**
 * 포켓몬 챔피언스 DB 크롤링 스크립트
 * 실행: node scripts/scrape-pokemon.js
 *
 * 소스:
 * 1. https://www.pokemon-zone.com/champions/pokemon/ (페이지네이션)
 * 2. https://web-view.app.pokemonchampions.jp/battle/pages/events/rs177501629259kmzbny/ko/pokemon.html
 */

import * as cheerio from 'cheerio'
import fetch from 'node-fetch'
import mongoose from 'mongoose'
import 'dotenv/config'

// ─── 스키마 (models.js와 동일) ──────────────────────────────────────────────
const pokemonSchema = new mongoose.Schema({
  nationalId: { type: Number, required: true, unique: true },
  name: { ko: String, en: String },
  types: [String],
  imageUrl: String,
  spriteUrl: String,
  baseStats: {
    hp: Number, attack: Number, defense: Number,
    spAtk: Number, spDef: Number, speed: Number
  },
  availableInChampions: { type: Boolean, default: true }
}, { timestamps: true })

const Pokemon = mongoose.models.Pokemon || mongoose.model('Pokemon', pokemonSchema)

// ─── 타입 이름 정규화 ────────────────────────────────────────────────────────
const TYPE_MAP = {
  // 영어
  normal: 'normal', fire: 'fire', water: 'water', electric: 'electric',
  grass: 'grass', ice: 'ice', fighting: 'fighting', poison: 'poison',
  ground: 'ground', flying: 'flying', psychic: 'psychic', bug: 'bug',
  rock: 'rock', ghost: 'ghost', dragon: 'dragon', dark: 'dark',
  steel: 'steel', fairy: 'fairy',
  // 한국어
  노말: 'normal', 불꽃: 'fire', 물: 'water', 전기: 'electric',
  풀: 'grass', 얼음: 'ice', 격투: 'fighting', 독: 'poison',
  땅: 'ground', 비행: 'flying', 에스퍼: 'psychic', 벌레: 'bug',
  바위: 'rock', 고스트: 'ghost', 드래곤: 'dragon', 악: 'dark',
  강철: 'steel', 페어리: 'fairy'
}

function normalizeType(raw) {
  return TYPE_MAP[raw?.trim()?.toLowerCase()] || raw?.trim()?.toLowerCase()
}

// ─── PokemonDB 스프라이트 URL 생성 ──────────────────────────────────────────
function getSpriteUrl(nationalId) {
  const padded = String(nationalId).padStart(3, '0')
  return `https://img.pokemondb.net/sprites/home/normal/${padded}.png`
}

// ─── pokemon-zone.com 크롤링 ─────────────────────────────────────────────────
async function scrapePokemonZone() {
  const results = []
  let page = 1
  let hasMore = true

  console.log('📡 pokemon-zone.com 크롤링 시작...')

  while (hasMore) {
    try {
      const url = `https://www.pokemon-zone.com/champions/pokemon/?page=${page}`
      console.log(`  페이지 ${page}: ${url}`)
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PokemonAssistant/1.0)' }
      })

      if (!res.ok) { hasMore = false; break }

      const html = await res.text()
      const $ = cheerio.load(html)

      const cards = $('.pokemon-card, .pokemon-item, [class*="pokemon"]')

      if (!cards.length) {
        // 셀렉터가 맞지 않을 경우 직접 파싱 시도
        const rows = $('table tr, .list-item').filter((_, el) => $(el).find('img').length)
        if (!rows.length) { hasMore = false; break }

        rows.each((_, row) => {
          const img = $(row).find('img').first()
          const nameEl = $(row).find('[class*="name"], td:nth-child(2), .name').first()
          const typesEl = $(row).find('[class*="type"]')

          const name = nameEl.text().trim()
          if (!name) return

          const types = []
          typesEl.each((_, el) => {
            const t = normalizeType($(el).text())
            if (t) types.push(t)
          })

          results.push({ name, types, imageUrl: img.attr('src') || img.attr('data-src') })
        })
      } else {
        cards.each((_, card) => {
          const img = $(card).find('img').first()
          const name = $(card).find('[class*="name"]').first().text().trim()
          const types = []
          $(card).find('[class*="type"]').each((_, el) => {
            const t = normalizeType($(el).text())
            if (t) types.push(t)
          })
          if (name) results.push({ name, types, imageUrl: img.attr('src') || img.attr('data-src') })
        })
      }

      // 다음 페이지 존재 확인
      const nextLink = $('a[rel="next"], .pagination .next, [class*="next-page"]')
      hasMore = nextLink.length > 0
      page++

      // 과도한 요청 방지
      await new Promise(r => setTimeout(r, 1000))
    } catch (err) {
      console.error(`  페이지 ${page} 오류:`, err.message)
      hasMore = false
    }
  }

  console.log(`  pokemon-zone.com: ${results.length}마리 수집`)
  return results
}

// ─── 공식 챔피언스 페이지 크롤링 ────────────────────────────────────────────
async function scrapeOfficialChampions() {
  const results = []
  const url = 'https://web-view.app.pokemonchampions.jp/battle/pages/events/rs177501629259kmzbny/ko/pokemon.html'

  console.log('📡 공식 챔피언스 페이지 크롤링...')

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PokemonAssistant/1.0)' }
    })
    if (!res.ok) { console.log('  접근 불가'); return results }

    const html = await res.text()
    const $ = cheerio.load(html)

    // 포켓몬 항목 파싱 (실제 HTML 구조에 따라 조정 필요)
    $('[class*="pokemon"], li, .card').each((_, el) => {
      const nameEl = $(el).find('[class*="name"], [class*="title"]').first()
      const imgEl = $(el).find('img').first()
      const typeEls = $(el).find('[class*="type"]')

      const name = nameEl.text().trim()
      if (!name || name.length > 20) return

      const types = []
      typeEls.each((_, t) => {
        const type = normalizeType($(t).text())
        if (type) types.push(type)
      })

      results.push({
        name,
        types,
        imageUrl: imgEl.attr('src') || imgEl.attr('data-src') || ''
      })
    })

    console.log(`  공식 페이지: ${results.length}마리 수집`)
  } catch (err) {
    console.error('  공식 페이지 오류:', err.message)
  }

  return results
}

// ─── PokéAPI로 전국도감 번호 + 영어 이름 보완 ────────────────────────────────
async function enrichWithPokeAPI(nameKo) {
  try {
    // 한국어 이름으로 PokeAPI 검색 (species endpoint)
    const searchRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/?limit=1000`)
    if (!searchRes.ok) return null
    const { results } = await searchRes.json()

    // 이름 매칭 (영어 이름 기준으로 찾은 후 한국어 확인)
    for (const spec of results) {
      const specRes = await fetch(spec.url)
      if (!specRes.ok) continue
      const specData = await specRes.json()

      const koName = specData.names.find(n => n.language.name === 'ko')?.name
      if (koName === nameKo) {
        const pokemonRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${specData.id}`)
        const pokemonData = await pokemonRes.json()

        return {
          nationalId: specData.id,
          nameEn: specData.name,
          types: pokemonData.types.map(t => t.type.name),
          baseStats: {
            hp:      pokemonData.stats[0].base_stat,
            attack:  pokemonData.stats[1].base_stat,
            defense: pokemonData.stats[2].base_stat,
            spAtk:   pokemonData.stats[3].base_stat,
            spDef:   pokemonData.stats[4].base_stat,
            speed:   pokemonData.stats[5].base_stat
          }
        }
      }
    }
  } catch {
    return null
  }
  return null
}

// ─── MongoDB에 저장 ──────────────────────────────────────────────────────────
async function saveToMongoDB(pokemons) {
  let saved = 0
  let skipped = 0

  for (const p of pokemons) {
    try {
      const filter = p.nationalId
        ? { nationalId: p.nationalId }
        : { 'name.ko': p.name.ko }

      await Pokemon.findOneAndUpdate(
        filter,
        {
          $set: {
            ...(p.nationalId && { nationalId: p.nationalId }),
            name: { ko: p.nameKo || p.name, en: p.nameEn || '' },
            types: p.types || [],
            imageUrl: p.imageUrl || '',
            spriteUrl: p.nationalId ? getSpriteUrl(p.nationalId) : '',
            baseStats: p.baseStats || {},
            availableInChampions: true
          }
        },
        { upsert: true, new: true }
      )
      saved++
    } catch (err) {
      console.error(`  저장 실패 (${p.name || p.nameKo}):`, err.message)
      skipped++
    }
  }

  return { saved, skipped }
}

// ─── 메인 ────────────────────────────────────────────────────────────────────
async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('❌ MONGODB_URI 환경변수를 설정해주세요 (.env.local)')
    process.exit(1)
  }

  console.log('🔗 MongoDB 연결 중...')
  await mongoose.connect(uri)
  console.log('✅ MongoDB 연결 완료\n')

  // 크롤링
  const [zoneData, officialData] = await Promise.all([
    scrapePokemonZone(),
    scrapeOfficialChampions()
  ])

  // 중복 제거 (이름 기준)
  const nameSet = new Set()
  const merged = []
  for (const p of [...zoneData, ...officialData]) {
    const name = p.name || p.nameKo
    if (name && !nameSet.has(name)) {
      nameSet.add(name)
      merged.push(p)
    }
  }

  console.log(`\n📊 총 ${merged.length}마리 수집 완료`)
  console.log('💾 MongoDB에 저장 중...\n')

  const { saved, skipped } = await saveToMongoDB(merged)

  console.log(`\n✅ 저장 완료: ${saved}마리 / 실패: ${skipped}마리`)
  await mongoose.disconnect()
}

main().catch(err => {
  console.error('❌ 오류:', err)
  process.exit(1)
})
