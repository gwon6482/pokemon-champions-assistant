<template>
  <div class="max-w-5xl mx-auto px-4 py-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white">배틀</h1>
        <p class="text-sm text-gray-400 mt-1">상대 포켓몬을 클릭하면 대처법을 보여줍니다</p>
      </div>
      <span class="text-xs px-3 py-1 bg-surface-700 rounded-full text-gray-400">
        {{ battleStore.mode === 'double' ? '더블' : '싱글' }}
      </span>
    </div>

    <!-- 파티 없음 안내 -->
    <div v-if="!battleStore.myCombo.length && !battleStore.opponentParty.length" class="card p-8 text-center">
      <p class="text-4xl mb-3">&#x2694;&#xFE0F;</p>
      <p class="text-gray-400">
        <RouterLink to="/roster" class="text-blue-400 hover:underline">로스터 선택</RouterLink>에서 조합을 선택하고 배틀을 시작하세요
      </p>
    </div>

    <div v-else class="grid md:grid-cols-2 gap-6">
      <!-- 왼쪽: 상대 파티 -->
      <section>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            상대 파티
          </h2>
          <span class="text-xs text-gray-400">
            출전 선택
            <span :class="opponentCombo.length === battleStore.comboSize ? 'text-green-400 font-semibold' : 'text-blue-400'">
              {{ opponentCombo.length }}/{{ battleStore.comboSize }}
            </span>
          </span>
        </div>
        <div class="space-y-2">
          <MatchupCard
            v-for="opp in battleStore.opponentParty"
            :key="opp._id"
            :pokemon="opp"
            :matchup="getMyBestMatchup(opp)"
            :highlighted="battleStore.activeOpponent?._id === opp._id"
            :selected="isOpponentSelected(opp)"
            :disabled="isOpponentDisabled(opp)"
            @click="toggleOpponent"
          />
        </div>
      </section>

      <!-- 오른쪽: 내 조합 -->
      <section>
        <h2 class="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
          내 조합
          <span class="text-gray-500 font-normal normal-case ml-1">(출전 포켓몬 선택)</span>
        </h2>
        <div class="space-y-2">
          <ActivePokemon
            v-for="pokemon in myComboDisplay"
            :key="pokemon._id || pokemon.pokemonId?._id"
            :pokemon="pokemon"
            :is-active="isMyActive(pokemon)"
            @toggle="toggleActive"
          />
        </div>

        <!-- 대처 추천 -->
        <div v-if="battleStore.activeOpponent" class="mt-4 card p-4 animate-fade-in">
          <p class="text-xs text-gray-400 mb-2">
            <span class="font-semibold text-white">{{ battleStore.activeOpponent.name?.ko }}</span>
            에 대한 내 조합 상성
          </p>
          <div class="space-y-2">
            <div
              v-for="item in counterList"
              :key="item.pokemon._id"
              class="flex items-center gap-3 p-2 rounded-lg"
              :class="item.matchup >= 2 ? 'bg-green-900/20' : item.matchup < 1 ? 'bg-red-900/20' : 'bg-surface-700'"
            >
              <img
                v-if="item.pokemon.imageUrl"
                :src="item.pokemon.imageUrl"
                class="w-8 h-8 object-contain"
              />
              <span class="text-sm font-medium text-white flex-1">{{ item.pokemon.name?.ko }}</span>
              <span class="text-sm font-bold"
                :class="item.matchup >= 2 ? 'text-green-400' : item.matchup < 1 ? 'text-red-400' : 'text-gray-400'">
                {{ item.matchup === 0 ? '무효' : item.matchup + '배' }}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 상대 조합 상성 분석표 -->
    <section v-if="opponentCombo.length === battleStore.comboSize" class="animate-fade-in">
      <h2 class="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">상성 분석</h2>
      <div class="card overflow-x-auto">
        <table class="w-full text-sm">
          <!-- 헤더: 상대 포켓몬 -->
          <thead>
            <tr class="border-b border-surface-700">
              <th class="p-3 text-left text-gray-500 font-normal w-24">내 포켓몬</th>
              <th
                v-for="opp in opponentCombo"
                :key="opp._id"
                class="p-2 text-center"
              >
                <div class="flex flex-col items-center gap-1">
                  <img
                    v-if="opp.imageUrl"
                    :src="opp.imageUrl"
                    class="w-9 h-9 object-contain mx-auto"
                  />
                  <span class="text-xs text-gray-300 leading-tight">{{ opp.name?.ko }}</span>
                  <div class="flex gap-0.5 justify-center flex-wrap">
                    <TypeBadge v-for="t in opp.types" :key="t" :type="t" />
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <!-- 행: 내 포켓몬 -->
          <tbody>
            <tr
              v-for="slot in myComboDisplay"
              :key="slot._id || slot.pokemonId?._id"
              class="border-b border-surface-800 last:border-0"
            >
              <td class="p-3">
                <div class="flex items-center gap-2">
                  <img
                    v-if="(slot.pokemonId || slot).imageUrl"
                    :src="(slot.pokemonId || slot).imageUrl"
                    class="w-7 h-7 object-contain flex-shrink-0"
                  />
                  <span class="text-xs text-gray-300 leading-tight">
                    {{ slot.nickname || (slot.pokemonId || slot).name?.ko }}
                  </span>
                </div>
              </td>
              <td
                v-for="opp in opponentCombo"
                :key="opp._id"
                class="p-2 text-center"
              >
                <span
                  class="inline-block px-2 py-0.5 rounded text-xs font-bold"
                  :class="matchupCellClass(getMatchup((slot.pokemonId || slot).types || [], opp.types || []))"
                >
                  {{ matchupCellLabel(getMatchup((slot.pokemonId || slot).types || [], opp.types || [])) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 배틀 종료 -->
    <section v-if="battleStore.myCombo.length || battleStore.opponentParty.length">
      <div class="card p-4">
        <h3 class="font-semibold text-white mb-3">배틀 결과 기록</h3>
        <div class="flex gap-3">
          <button
            v-for="r in results"
            :key="r.value"
            class="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors"
            :class="r.class"
            @click="saveResult(r.value)"
          >
            {{ r.label }}
          </button>
        </div>
        <textarea
          v-model="battleNote"
          placeholder="메모 (선택)"
          rows="2"
          class="mt-3 w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>
    </section>

    <!-- 저장 완료 토스트 -->
    <Transition name="fade">
      <div
        v-if="savedToast"
        class="fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 bg-green-700 text-white px-5 py-3 rounded-full text-sm font-medium shadow-lg"
      >
        전적이 저장되었습니다!
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useBattleStore } from '@/stores/battle.js'
import { useRosterStore } from '@/stores/roster.js'
import { getMatchup } from '@/utils/typeChart.js'
import MatchupCard from '@/components/battle/MatchupCard.vue'
import ActivePokemon from '@/components/battle/ActivePokemon.vue'
import TypeBadge from '@/components/pokemon/TypeBadge.vue'

const battleStore = useBattleStore()
const rosterStore = useRosterStore()

const battleNote = ref('')
const savedToast = ref(false)
const opponentCombo = ref([])

const results = [
  { value: 'win',  label: '승리', class: 'bg-green-700 hover:bg-green-600 text-white' },
  { value: 'lose', label: '패배', class: 'bg-red-700 hover:bg-red-600 text-white' },
  { value: 'draw', label: '무승부', class: 'bg-gray-600 hover:bg-gray-500 text-white' }
]

// 내 조합: store의 myCombo (Pokemon 객체) 또는 roster slot 포함
const myComboDisplay = computed(() => {
  if (battleStore.myCombo.length) return battleStore.myCombo
  return rosterStore.filledSlots
})

const getMyBestMatchup = (opp) => {
  const myPokemons = myComboDisplay.value.map(p => p.pokemonId || p)
  const matchups = myPokemons.map(p => getMatchup(p.types || [], opp.types || []))
  return matchups.length ? Math.max(...matchups) : 1
}

const isOpponentSelected = (opp) => opponentCombo.value.some(p => p._id === opp._id)

const isOpponentDisabled = (opp) =>
  opponentCombo.value.length >= battleStore.comboSize && !isOpponentSelected(opp)

const toggleOpponent = (opp) => {
  if (isOpponentSelected(opp)) {
    opponentCombo.value = opponentCombo.value.filter(p => p._id !== opp._id)
    if (battleStore.activeOpponent?._id === opp._id) battleStore.activeOpponent = null
  } else {
    if (opponentCombo.value.length >= battleStore.comboSize) return
    opponentCombo.value.push(opp)
    battleStore.activeOpponent = opp
  }
  battleStore.opponentCombo = opponentCombo.value
}

const isMyActive = (pokemon) => {
  const id = pokemon.pokemonId?._id || pokemon._id
  return battleStore.activeMine?._id === id || battleStore.activeMine?._id === pokemon._id
}

const toggleActive = (pokemon) => {
  const p = pokemon.pokemonId || pokemon
  battleStore.activeMine = isMyActive(pokemon) ? null : p
}

// 내 조합의 상대 포켓몬 대처 목록
const counterList = computed(() => {
  if (!battleStore.activeOpponent) return []
  return myComboDisplay.value
    .map(slot => {
      const p = slot.pokemonId || slot
      return {
        pokemon: p,
        matchup: getMatchup(p.types || [], battleStore.activeOpponent.types || [])
      }
    })
    .sort((a, b) => b.matchup - a.matchup)
})

const matchupCellClass = (mult) => {
  if (mult >= 4)   return 'bg-green-500/30 text-green-300'
  if (mult >= 2)   return 'bg-green-900/40 text-green-400'
  if (mult === 0)  return 'bg-surface-700 text-gray-600'
  if (mult < 1)    return 'bg-red-900/30 text-red-400'
  return 'text-gray-500'
}

const matchupCellLabel = (mult) => {
  if (mult === 0)    return '무효'
  if (mult === 0.25) return '¼배'
  if (mult === 0.5)  return '½배'
  if (mult === 1)    return '1배'
  if (mult === 2)    return '2배'
  if (mult === 4)    return '4배'
  return `${mult}배`
}

const saveResult = async (result) => {
  await battleStore.saveRecord(result, battleNote.value)
  savedToast.value = true
  setTimeout(() => { savedToast.value = false }, 2500)
  battleNote.value = ''
}
</script>
