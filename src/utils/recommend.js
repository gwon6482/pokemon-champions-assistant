import { getMatchup, countEffectiveAgainst, avgDamageTaken } from './typeChart.js'

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
 * @param {Array} combo - 내 포켓몬 조합 (slot 객체 배열, pokemonId populate 필요)
 * @param {Array} opponentParty - 상대 포켓몬 배열
 */
function scoreCombo(combo, opponentParty) {
  const myPokemons = combo.map(s => s.pokemonId || s)
  let score = 0

  // 1. 타입 커버리지 (30점)
  // 상대 6마리 중 2배 이상 공격 가능한 수
  const covered = opponentParty.filter(opp =>
    myPokemons.some(p => getMatchup(p.types, opp.types) >= 2)
  ).length
  score += (covered / opponentParty.length) * 30

  // 2. 타입 내성 (25점)
  // 상대의 공격을 평균적으로 적게 받을수록 높은 점수
  const avgVulnerability = myPokemons.reduce((sum, p) => {
    return sum + avgDamageTaken(p.types, opponentParty)
  }, 0) / myPokemons.length
  score += Math.max(0, (2 - avgVulnerability)) * 12.5

  // 3. 역할 다양성 (25점)
  // 물리 / 특수 / 서포트 커버
  const hasPhysical = myPokemons.some(p => p.baseStats?.attack > 90)
  const hasSpecial = myPokemons.some(p => p.baseStats?.spAtk > 90)
  const hasTank = myPokemons.some(p => p.baseStats?.hp > 90 || p.baseStats?.defense > 90)
  score += (hasPhysical ? 9 : 0) + (hasSpecial ? 8 : 0) + (hasTank ? 8 : 0)

  // 4. 스피드 서열 (20점)
  // 상대 6마리 중 내 조합이 선공 가능한 수
  const fastCount = myPokemons.reduce((sum, p) => {
    return sum + opponentParty.filter(opp =>
      (p.baseStats?.speed || 0) > (opp.baseStats?.speed || 0)
    ).length
  }, 0)
  const maxFast = myPokemons.length * opponentParty.length
  score += maxFast ? (fastCount / maxFast) * 20 : 0

  return Math.min(100, Math.round(score))
}

/**
 * 조합 추천 이유 생성 (클라이언트 사이드 간단 버전)
 */
function generateReason(combo, opponentParty, score) {
  const myPokemons = combo.map(s => s.pokemonId || s)
  const covered = opponentParty.filter(opp =>
    myPokemons.some(p => getMatchup(p.types, opp.types) >= 2)
  ).length

  const names = myPokemons.map(p => p.name?.ko || p.name).join(', ')

  if (score >= 75) {
    return `${names} 조합은 상대 파티의 ${covered}/${opponentParty.length}마리에 효과적으로 대처할 수 있는 강력한 조합입니다.`
  } else if (score >= 50) {
    return `${names} 조합은 균형 잡힌 구성으로 다양한 상황에 대응할 수 있습니다.`
  } else {
    return `${names} 조합은 일부 상황에서 불리할 수 있지만 활용 가능한 조합입니다.`
  }
}

/**
 * 최적 조합 추천 (클라이언트 사이드 알고리즘)
 * @param {Array} myParty - 내 파티 슬롯 배열
 * @param {Array} opponentParty - 상대 포켓몬 배열
 * @param {String} mode - 'single' | 'double'
 * @param {Number} topN - 상위 N개 추천
 */
export function recommendCombos(myParty, opponentParty, mode = 'single', topN = 3) {
  const comboSize = mode === 'double' ? 4 : 3
  const filledSlots = myParty.filter(Boolean)

  if (filledSlots.length < comboSize) {
    return []
  }

  const combos = getCombinations(filledSlots, comboSize)

  const scored = combos.map(combo => ({
    combo,
    score: scoreCombo(combo, opponentParty)
  }))

  scored.sort((a, b) => b.score - a.score)

  return scored.slice(0, topN).map(({ combo, score }) => ({
    combo,
    score,
    reason: generateReason(combo, opponentParty, score)
  }))
}
