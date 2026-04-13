import { getMatchup, getTypeEffectiveness, avgDamageTaken, ALL_TYPES, TYPE_KO } from './typeChart.js'

/**
 * 내 파티에서 모든 가능한 조합 생성 (C(n, k))
 */
function getCombinations(arr, k) {
  if (k === 0) return [[]]
  if (arr.length < k) return []
  const [first, ...rest] = arr
  const withFirst = getCombinations(rest, k - 1).map(c => [first, ...c])
  const withoutFirst = getCombinations(rest, k)
  return [...withFirst, ...withoutFirst]
}

/**
 * 조합 점수 계산 (0~100)
 * @param {Array} combo - 슬롯 객체 배열 (pokemonId populate 필요)
 * @param {Array} opponentParty - 상대 포켓몬 배열 (없으면 18타입 기준)
 */
function scoreCombo(combo, opponentParty) {
  const myPokemons = combo.map(s => s.pokemonId || s)
  let score = 0

  if (opponentParty.length > 0) {
    // 1. 상대 타입 커버리지 (35점): 상대 중 2배 이상 공격 가능한 비율
    const covered = opponentParty.filter(opp =>
      myPokemons.some(p => getMatchup(p.types || [], opp.types || []) >= 2)
    ).length
    score += (covered / opponentParty.length) * 35

    // 2. 타입 내성 (25점): 상대 공격에 덜 취약할수록
    const avgVuln = myPokemons.reduce((sum, p) =>
      sum + avgDamageTaken(p.types || [], opponentParty), 0) / myPokemons.length
    score += Math.max(0, 25 - avgVuln * 10)

    // 3. 속도 우위 (20점): 상대보다 빠른 매칭 비율
    const fastCount = myPokemons.reduce((sum, p) =>
      sum + opponentParty.filter(opp =>
        (p.baseStats?.speed || 0) > (opp.baseStats?.speed || 0)
      ).length
    , 0)
    const maxFast = myPokemons.length * opponentParty.length
    score += maxFast ? (fastCount / maxFast) * 20 : 0
  } else {
    // 상대 없음: 18타입 기준 커버리지 (80점)
    const coveredTypes = ALL_TYPES.filter(defType =>
      myPokemons.some(p =>
        (p.types || []).some(atkType => getTypeEffectiveness(atkType, defType) >= 2)
      )
    ).length
    score += (coveredTypes / ALL_TYPES.length) * 80
  }

  // 역할 다양성 (20점)
  const hasPhysical = myPokemons.some(p => (p.baseStats?.attack || 0) > 90)
  const hasSpecial = myPokemons.some(p => (p.baseStats?.spAtk || 0) > 90)
  const hasTank = myPokemons.some(p =>
    (p.baseStats?.hp || 0) + (p.baseStats?.defense || 0) + (p.baseStats?.spDef || 0) > 250
  )
  score += (hasPhysical ? 7 : 0) + (hasSpecial ? 7 : 0) + (hasTank ? 6 : 0)

  return Math.min(100, Math.round(score))
}

/**
 * 조합 분석 데이터 생성
 */
function generateAnalysis(combo, opponentParty) {
  const myPokemons = combo.map(s => s.pokemonId || s)

  // 강한 상대 속성: 내 조합이 2배 이상 공격 가능한 타입
  const strengths = ALL_TYPES.filter(defType =>
    myPokemons.some(p =>
      (p.types || []).some(atkType => getTypeEffectiveness(atkType, defType) >= 2)
    )
  ).map(t => TYPE_KO[t])

  // 약한 상대 속성: 내 조합의 절반 이상이 2배 이상 피해받는 타입 (팀 공통 약점)
  const threshold = Math.ceil(myPokemons.length / 2)
  const weaknesses = ALL_TYPES.filter(atkType =>
    myPokemons.filter(p =>
      getMatchup([atkType], p.types || []) >= 2
    ).length >= threshold
  ).map(t => TYPE_KO[t])

  // 역할 분담
  const roles = myPokemons.map(p => {
    const atk = p.baseStats?.attack || 0
    const spAtk = p.baseStats?.spAtk || 0
    const def = p.baseStats?.defense || 0
    const spDef = p.baseStats?.spDef || 0
    const hp = p.baseStats?.hp || 0
    const speed = p.baseStats?.speed || 0
    const name = p.name?.ko || p.name || '?'

    let role
    if (hp + def + spDef > 260 && atk < 85 && spAtk < 85) {
      role = '탱커'
    } else if (atk > spAtk + 25) {
      role = `물리공격 (공격: ${atk})`
    } else if (spAtk > atk + 25) {
      role = `특수공격 (특공: ${spAtk})`
    } else {
      role = `균형형 (공/특공: ${atk}/${spAtk})`
    }
    return { name, role, speed }
  })

  // 상대 파티 개별 대응 분석
  const opponentAnalysis = opponentParty.map(opp => {
    const matchups = myPokemons.map(p => ({
      name: p.name?.ko || p.name || '?',
      mult: getMatchup(p.types || [], opp.types || [])
    }))
    const best = matchups.reduce((a, b) => b.mult > a.mult ? b : a, matchups[0])
    return {
      name: opp.name?.ko || opp.name,
      counter: best?.name,
      mult: best?.mult ?? 1
    }
  })

  return { strengths, weaknesses, roles, opponentAnalysis }
}

/**
 * 최적 조합 추천 (클라이언트 사이드 알고리즘)
 * @param {Array} myParty - 내 파티 슬롯 배열
 * @param {Array} opponentParty - 상대 포켓몬 배열 (비어있어도 됨)
 * @param {String} mode - 'single' | 'double'
 * @param {Number} topN - 상위 N개 추천
 */
export function recommendCombos(myParty, opponentParty, mode = 'single', topN = 3) {
  const comboSize = mode === 'double' ? 4 : 3
  const filledSlots = myParty.filter(Boolean)
  if (filledSlots.length < comboSize) return []

  const combos = getCombinations(filledSlots, comboSize)
  const scored = combos.map(combo => ({
    combo,
    score: scoreCombo(combo, opponentParty)
  }))
  scored.sort((a, b) => b.score - a.score)

  return scored.slice(0, topN).map(({ combo, score }) => ({
    combo,
    score,
    analysis: generateAnalysis(combo, opponentParty)
  }))
}
