import { getTypeEffectiveness, ALL_TYPES, TYPE_KO } from './typeChart.js'

// ─── 조합 생성 ────────────────────────────────────────────────
function getCombinations(arr, k) {
  if (k === 0) return [[]]
  if (arr.length < k) return []
  const [first, ...rest] = arr
  const withFirst = getCombinations(rest, k - 1).map(c => [first, ...c])
  const withoutFirst = getCombinations(rest, k)
  return [...withFirst, ...withoutFirst]
}

// ─── 단일 공격 타입 vs 방어 타입 배열의 배수 ──────────────────
// 공격은 한 번에 한 타입이므로 곱셈(방어측 복수 타입은 누적)
function atkVsDef(atkType, defTypes) {
  return defTypes.reduce((m, d) => m * getTypeEffectiveness(atkType, d), 1)
}

// ─── 성격 → 스탯 증감 테이블 (한국어 성격명) ──────────────────
const NATURE_MAP = {
  '겁쟁이':     { up: 'speed',   down: 'attack'  }, // Timid
  '성급':       { up: 'speed',   down: 'spAtk'   }, // Jolly
  '천진난만':   { up: 'speed',   down: 'spDef'   }, // Naive
  '덜렁이':     { up: 'speed',   down: 'defense' }, // Hasty
  '용감':       { up: 'attack',  down: 'speed'   }, // Brave
  '고집':       { up: 'attack',  down: 'spAtk'   }, // Adamant
  '장난꾸러기': { up: 'attack',  down: 'spDef'   }, // Naughty
  '건방':       { up: 'attack',  down: 'defense' }, // Lonely
  '명랑':       { up: 'spAtk',   down: 'attack'  }, // Modest
  '얌전':       { up: 'spAtk',   down: 'speed'   }, // Quiet
  '변덕':       { up: 'spAtk',   down: 'defense' }, // Mild
  '촐랑':       { up: 'spAtk',   down: 'spDef'   }, // Rash
  '냉정':       { up: 'defense', down: 'attack'  }, // Bold
  '개구쟁이':   { up: 'defense', down: 'spAtk'   }, // Impish
  '온순':       { up: 'defense', down: 'speed'   }, // Relaxed
  '홀가분':     { up: 'defense', down: 'spDef'   }, // Lax
  '조심':       { up: 'spDef',   down: 'attack'  }, // Calm
  '신중':       { up: 'spDef',   down: 'spAtk'   }, // Careful
  // 귀여운척(Bashful), 무사태평(Quirky) 등 중립 성격은 보정 없음
}

// ─── 특성 → 타입 방어 보정 테이블 (한국어 특성명) ─────────────
// 0 = 무효(면역), 0.5 = 절반 피해, 1.25 = 추가 피해
const ABILITY_DEFENSE = {
  '부유':        { ground: 0 },                   // Levitate
  '타오르는불꽃': { fire: 0 },                    // Flash Fire
  '축전':        { electric: 0 },                 // Volt Absorb
  '저수':        { water: 0 },                    // Water Absorb
  '피뢰침':      { electric: 0 },                 // Lightning Rod
  '마중물':      { water: 0 },                    // Storm Drain
  '초식':        { grass: 0 },                    // Sap Sipper
  '전동기':      { electric: 0 },                 // Motor Drive
  '땅먹기':      { ground: 0 },                   // Earth Eater
  '두꺼운지방':  { fire: 0.5, ice: 0.5 },         // Thick Fat
  '내열':        { fire: 0.5 },                   // Heatproof
  '건조피부':    { water: 0, fire: 1.25 },        // Dry Skin
}

// ─── 실질 스탯 계산 (노력치 + 성격 반영) ──────────────────────
// 포켓몬 챔피언스 EV 시스템: max 32/스탯, total 66
// 1 EV ≈ 2스탯 증가 (근사치)
export function effectiveStats(slot) {
  const base = slot.pokemonId?.baseStats || slot.baseStats || {}
  const ev   = slot.evTraining || {}
  const nat  = NATURE_MAP[slot.nature] || null
  const keys = ['hp', 'attack', 'defense', 'spAtk', 'spDef', 'speed']
  const stats = {}
  for (const k of keys) {
    let v = (base[k] || 0) + Math.round((ev[k] || 0) * 2)
    if (nat?.up   === k) v = Math.floor(v * 1.1)
    if (nat?.down === k) v = Math.floor(v * 0.9)
    stats[k] = v
  }
  return stats
}

// ─── 슬롯의 실질 공격 기술 타입 목록 ─────────────────────────
// 선택된 기술이 있으면 그 타입 사용, 없으면 포켓몬 자체 타입 fallback
function attackMoveTypes(slot) {
  const selected = (slot.moves || []).filter(Boolean)
  const pool     = slot.pokemonId?.moves || []
  if (selected.length && pool.length) {
    const types = selected
      .map(name => pool.find(m => m.nameKo === name))
      .filter(m => m && (m.damageClass === 'physical' || m.damageClass === 'special'))
      .map(m => m.type)
    if (types.length) return [...new Set(types)]
  }
  return slot.pokemonId?.types || slot.types || []
}

// ─── 내 슬롯이 상대 포켓몬에게 낼 수 있는 최대 공격 배수 ──────
function myBestAtkMult(mySlot, oppPokemon) {
  const moveTypes = attackMoveTypes(mySlot)
  const defTypes  = oppPokemon.types || []
  return moveTypes.reduce((best, mt) => Math.max(best, atkVsDef(mt, defTypes)), 0)
}

// ─── 상대 포켓몬이 내 슬롯에 줄 수 있는 최대 피해 배수 (특성 포함) ─
function oppBestAtkMult(oppPokemon, mySlot) {
  const abilityMod = ABILITY_DEFENSE[mySlot.ability] || {}
  const defTypes   = mySlot.pokemonId?.types || mySlot.types || []
  const oppTypes   = oppPokemon.types || []
  return oppTypes.reduce((best, atkType) => {
    let mult = atkVsDef(atkType, defTypes)
    if (abilityMod[atkType] !== undefined) {
      mult = abilityMod[atkType] === 0 ? 0 : mult * abilityMod[atkType]
    }
    return Math.max(best, mult)
  }, 0)
}

// ─── 조합 점수 계산 (0~100) ───────────────────────────────────
function scoreCombo(combo, opponentParty) {
  let score = 0

  if (opponentParty.length > 0) {
    // 1. 상대 타입 커버리지 (35점): 실제 기술 타입 기준
    const covered = opponentParty.filter(opp =>
      combo.some(slot => myBestAtkMult(slot, opp) >= 2)
    ).length
    score += (covered / opponentParty.length) * 35

    // 2. 타입 내성 (25점): 특성 반영한 피해 내성
    const avgVuln = combo.reduce((sum, slot) => {
      const avg = opponentParty.reduce((s, opp) => s + oppBestAtkMult(opp, slot), 0)
      return sum + avg / opponentParty.length
    }, 0) / combo.length
    score += Math.max(0, 25 - avgVuln * 10)

    // 3. 속도 우위 (20점): 노력치 + 성격 반영 실질 스피드
    const fastCount = combo.reduce((sum, slot) => {
      const mySpeed = effectiveStats(slot).speed
      return sum + opponentParty.filter(opp => mySpeed > (opp.baseStats?.speed || 0)).length
    }, 0)
    const maxFast = combo.length * opponentParty.length
    score += maxFast ? (fastCount / maxFast) * 20 : 0
  } else {
    // 상대 없음: 18타입 기준 실제 기술 커버리지 (80점)
    const coveredTypes = ALL_TYPES.filter(defType =>
      combo.some(slot =>
        attackMoveTypes(slot).some(mt => getTypeEffectiveness(mt, defType) >= 2)
      )
    ).length
    score += (coveredTypes / ALL_TYPES.length) * 80
  }

  // 4. 역할 다양성 (20점): 실질 스탯 + 기술 구성 반영
  const roles = combo.map(slot => {
    const stats    = effectiveStats(slot)
    const moveData = (slot.moves || []).filter(Boolean)
      .map(n => (slot.pokemonId?.moves || []).find(m => m.nameKo === n))
      .filter(Boolean)
    return {
      stats,
      hasPhys: moveData.some(m => m.damageClass === 'physical'),
      hasSpec: moveData.some(m => m.damageClass === 'special'),
    }
  })

  const hasPhysical = roles.some(({ stats, hasPhys, hasSpec }) =>
    stats.attack > 110 || (hasPhys && !hasSpec))
  const hasSpecial  = roles.some(({ stats, hasPhys, hasSpec }) =>
    stats.spAtk > 110 || (!hasPhys && hasSpec))
  const hasTank     = roles.some(({ stats }) =>
    stats.hp + stats.defense + stats.spDef > 310)

  score += (hasPhysical ? 7 : 0) + (hasSpecial ? 7 : 0) + (hasTank ? 6 : 0)

  return Math.min(100, Math.round(score))
}

// ─── 조합 분석 데이터 생성 ────────────────────────────────────
function generateAnalysis(combo, opponentParty) {
  // 강한 타입: 실제 기술로 2배 이상 공격 가능
  const strengths = ALL_TYPES.filter(defType =>
    combo.some(slot =>
      attackMoveTypes(slot).some(mt => getTypeEffectiveness(mt, defType) >= 2)
    )
  ).map(t => TYPE_KO[t])

  // 약한 타입: 조합의 절반 이상이 2배 이상 피해받는 공통 약점 (특성 면역 반영)
  const threshold = Math.ceil(combo.length / 2)
  const weaknesses = ALL_TYPES.filter(atkType =>
    combo.filter(slot => {
      const abilityMod = ABILITY_DEFENSE[slot.ability] || {}
      if (abilityMod[atkType] === 0) return false
      const defTypes  = slot.pokemonId?.types || []
      const baseMult  = atkVsDef(atkType, defTypes)
      const finalMult = abilityMod[atkType] !== undefined ? baseMult * abilityMod[atkType] : baseMult
      return finalMult >= 2
    }).length >= threshold
  ).map(t => TYPE_KO[t])

  // 역할 분담 (실질 스탯 + 기술 구성 + 특성 표시)
  const roleList = combo.map(slot => {
    const stats    = effectiveStats(slot)
    const name     = slot.pokemonId?.name?.ko || slot.name?.ko || '?'
    const ability  = slot.ability || ''
    const moveData = (slot.moves || []).filter(Boolean)
      .map(n => (slot.pokemonId?.moves || []).find(m => m.nameKo === n))
      .filter(Boolean)
    const hasPhys = moveData.some(m => m.damageClass === 'physical')
    const hasSpec = moveData.some(m => m.damageClass === 'special')

    let role
    if (stats.hp + stats.defense + stats.spDef > 310 && stats.attack < 100 && stats.spAtk < 100) {
      role = '탱커'
    } else if (hasPhys && !hasSpec) {
      role = `물리공격 (공격: ${stats.attack})`
    } else if (!hasPhys && hasSpec) {
      role = `특수공격 (특공: ${stats.spAtk})`
    } else if (stats.attack > stats.spAtk + 25) {
      role = `물리공격 (공격: ${stats.attack})`
    } else if (stats.spAtk > stats.attack + 25) {
      role = `특수공격 (특공: ${stats.spAtk})`
    } else {
      role = `균형형 (공/특공: ${stats.attack}/${stats.spAtk})`
    }

    const abilityNote = ability && ABILITY_DEFENSE[ability] ? ` [${ability}]` : ''
    return { name, role: role + abilityNote, speed: stats.speed }
  })

  // 상대별 최적 카운터 (실제 기술 타입 기준)
  const opponentAnalysis = opponentParty.map(opp => {
    const matchups = combo.map(slot => ({
      name: slot.pokemonId?.name?.ko || '?',
      mult: myBestAtkMult(slot, opp),
    }))
    const best = matchups.reduce((a, b) => b.mult > a.mult ? b : a, matchups[0])
    return {
      name: opp.name?.ko || opp.name,
      counter: best?.name,
      mult: best?.mult ?? 1,
    }
  })

  return { strengths, weaknesses, roles: roleList, opponentAnalysis }
}

// ─── 메인 추천 함수 ───────────────────────────────────────────
/**
 * @param {Array} myParty - 내 파티 슬롯 배열 (evTraining, ability, moves, nature 포함)
 * @param {Array} opponentParty - 상대 포켓몬 배열
 * @param {String} mode - 'single' | 'double'
 * @param {Number} topN - 상위 N개 추천
 */
export function recommendCombos(myParty, opponentParty, mode = 'single', topN = 3) {
  const comboSize  = mode === 'double' ? 4 : 3
  const filledSlots = myParty.filter(Boolean)
  if (filledSlots.length < comboSize) return []

  const isMega = slot => {
    const nameEn = slot.pokemonId?.name?.en || slot.name?.en || ''
    return nameEn.startsWith('Mega ')
  }

  const combos = getCombinations(filledSlots, comboSize)
    .filter(combo => combo.filter(isMega).length <= 1)
  const scored = combos
    .map(combo => ({ combo, score: scoreCombo(combo, opponentParty) }))
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, topN).map(({ combo, score }) => ({
    combo,
    score,
    analysis: generateAnalysis(combo, opponentParty),
  }))
}
