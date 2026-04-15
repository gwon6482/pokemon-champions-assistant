// 포켓몬 18개 타입 (영어 키)
export const ALL_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
]

export const TYPE_KO = {
  normal:   '노말',
  fire:     '불꽃',
  water:    '물',
  electric: '전기',
  grass:    '풀',
  ice:      '얼음',
  fighting: '격투',
  poison:   '독',
  ground:   '땅',
  flying:   '비행',
  psychic:  '에스퍼',
  bug:      '벌레',
  rock:     '바위',
  ghost:    '고스트',
  dragon:   '드래곤',
  dark:     '악',
  steel:    '강철',
  fairy:    '페어리'
}

export const TYPE_COLORS = {
  normal:   '#A8A878',
  fire:     '#F08030',
  water:    '#6890F0',
  electric: '#F8D030',
  grass:    '#78C850',
  ice:      '#98D8D8',
  fighting: '#C03028',
  poison:   '#A040A0',
  ground:   '#E0C068',
  flying:   '#A890F0',
  psychic:  '#F85888',
  bug:      '#A8B820',
  rock:     '#B8A038',
  ghost:    '#705898',
  dragon:   '#7038F8',
  dark:     '#705848',
  steel:    '#B8B8D0',
  fairy:    '#EE99AC'
}

// 공격 타입 → 방어 타입 상성표
// 값: 0 = 무효, 0.5 = 비효과적, 1 = 보통, 2 = 효과적
const CHART = {
  normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
  fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice:      { water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison:   { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug:      { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost:    { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
  dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy:    { fighting: 2, dragon: 2, dark: 2, fire: 0.5, poison: 0.5, steel: 0.5 }
}

/**
 * 공격 타입 → 방어 타입 상성 배수 반환
 */
export function getTypeEffectiveness(attackType, defenseType) {
  return CHART[attackType]?.[defenseType] ?? 1
}

/**
 * 공격자 타입 배열 vs 방어자 타입 배열의 최종 배수
 * - 방어: 타입별 배수를 모두 곱함 (dual type 방어 공식)
 * - 공격: 사용할 기술 타입을 선택할 수 있으므로 최댓값 반환
 */
export function getMatchup(attackerTypes, defenderTypes) {
  let best = 0
  for (const atk of attackerTypes) {
    let multiplier = 1
    for (const def of defenderTypes) {
      multiplier *= getTypeEffectiveness(atk, def)
    }
    if (multiplier > best) best = multiplier
  }
  return best
}

/**
 * 내 로스터에서 상대 포켓몬에 대해 상성 좋은 순으로 정렬
 */
export function getBestCounters(myRoster, opponentPokemon) {
  return myRoster
    .map(slot => {
      const pokemon = slot.pokemonId || slot
      const matchup = getMatchup(pokemon.types, opponentPokemon.types)
      return { ...slot, matchup }
    })
    .sort((a, b) => b.matchup - a.matchup)
}

/**
 * 포켓몬이 상대 전체에 대해 2배 이상 공격 가능한 수
 */
export function countEffectiveAgainst(attackerTypes, opponentParty) {
  return opponentParty.filter(opp =>
    getMatchup(attackerTypes, opp.types) >= 2
  ).length
}

/**
 * 포켓몬이 상대 전체로부터 받는 피해 평균
 */
export function avgDamageTaken(defenderTypes, opponentParty) {
  if (!opponentParty.length) return 1
  const total = opponentParty.reduce((sum, opp) =>
    sum + getMatchup(opp.types, defenderTypes), 0)
  return total / opponentParty.length
}
