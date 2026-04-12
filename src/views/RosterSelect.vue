<template>
  <div class="max-w-5xl mx-auto px-4 py-6 space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-white">로스터 선택</h1>
      <p class="text-sm text-gray-400 mt-1">상대 파티를 입력하고 최적 조합을 추천받으세요</p>
    </div>

    <!-- 내 파티 미리보기 -->
    <section>
      <h2 class="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">내 파티</h2>
      <div v-if="rosterStore.isEmpty" class="card p-4 text-center text-gray-500 text-sm">
        파티가 비어있습니다.
        <RouterLink to="/" class="text-blue-400 hover:underline ml-1">파티 구성</RouterLink>
        에서 먼저 포켓몬을 추가해주세요.
      </div>
      <div v-else class="flex gap-2 flex-wrap">
        <div
          v-for="slot in rosterStore.filledSlots"
          :key="slot._id"
          class="flex flex-col items-center gap-1 p-2 bg-surface-800 rounded-lg border border-surface-700"
        >
          <img
            v-if="slot.pokemonId?.imageUrl"
            :src="slot.pokemonId.imageUrl"
            class="w-12 h-12 object-contain"
          />
          <p class="text-xs text-center text-gray-300">{{ slot.pokemonId?.name?.ko }}</p>
          <div class="flex gap-0.5">
            <TypeBadge v-for="t in slot.pokemonId?.types" :key="t" :type="t" />
          </div>
        </div>
      </div>
    </section>

    <!-- 배틀 모드 선택 -->
    <section class="flex gap-2">
      <button
        v-for="m in ['single', 'double']"
        :key="m"
        class="px-5 py-2 rounded-full font-medium text-sm transition-colors"
        :class="battleStore.mode === m ? 'bg-blue-600 text-white' : 'bg-surface-700 text-gray-400'"
        @click="battleStore.mode = m"
      >
        {{ m === 'single' ? '싱글 (3마리)' : '더블 (4마리)' }}
      </button>
    </section>

    <!-- 상대 파티 입력 -->
    <section>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          상대 파티
          <span class="ml-2 text-gray-500 font-normal normal-case">
            ({{ battleStore.opponentParty.length }}/6)
          </span>
        </h2>
        <button
          v-if="battleStore.opponentParty.length"
          class="text-xs text-red-400 hover:text-red-300"
          @click="battleStore.clearOpponents()"
        >
          초기화
        </button>
      </div>

      <!-- 선택된 상대 포켓몬 -->
      <div class="flex gap-2 flex-wrap min-h-16 mb-4">
        <div
          v-for="pokemon in battleStore.opponentParty"
          :key="pokemon._id"
          class="relative flex flex-col items-center gap-1 p-2 bg-red-900/20 rounded-lg border border-red-800/40"
        >
          <button
            class="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-white text-xs flex items-center justify-center"
            @click="battleStore.removeOpponent(pokemon._id)"
          >
            &#x2715;
          </button>
          <img v-if="pokemon.imageUrl" :src="pokemon.imageUrl" class="w-10 h-10 object-contain" />
          <p class="text-xs text-gray-300 text-center">{{ pokemon.name?.ko }}</p>
        </div>
        <div v-if="!battleStore.opponentParty.length" class="text-gray-600 text-sm self-center">
          아래에서 상대 포켓몬을 선택하세요
        </div>
      </div>

      <!-- 포켓몬 선택 패널 -->
      <div class="card p-4 space-y-4">
        <PokemonSearch />
        <LoadingSpinner v-if="pokemonStore.loading" />
        <PokemonGrid
          v-else
          :pokemons="pokemonStore.filteredList"
          :selected-ids="opponentIds"
          :max-select="6"
          @select="onOpponentSelect"
        />
      </div>
    </section>

    <!-- 추천 버튼 -->
    <div
      v-if="battleStore.opponentParty.length >= 1 && !rosterStore.isEmpty"
      class="sticky bottom-20 md:bottom-6"
    >
      <button
        class="w-full btn-primary py-3 text-base font-semibold shadow-lg"
        :disabled="battleStore.loading"
        @click="getRecommendations"
      >
        <span v-if="battleStore.loading">분석 중...</span>
        <span v-else>AI 조합 추천 받기 ({{ battleStore.comboSize }}마리)</span>
      </button>
    </div>

    <!-- 추천 결과 -->
    <section v-if="battleStore.recommendations.length">
      <h2 class="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">추천 조합</h2>
      <div class="space-y-3">
        <div
          v-for="(rec, i) in battleStore.recommendations"
          :key="i"
          class="card p-4 animate-fade-in"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-white">조합 {{ i + 1 }}</span>
              <span class="text-xs px-2 py-0.5 rounded-full font-semibold"
                :class="rec.score >= 75 ? 'bg-green-600/20 text-green-400'
                  : rec.score >= 50 ? 'bg-yellow-600/20 text-yellow-400'
                  : 'bg-red-600/20 text-red-400'">
                {{ rec.score }}점
              </span>
            </div>
            <RouterLink
              to="/battle"
              class="btn-primary text-xs px-3 py-1.5"
              @click="selectCombo(rec)"
            >
              배틀 시작
            </RouterLink>
          </div>

          <div class="flex gap-2 mb-3 flex-wrap">
            <div
              v-for="name in rec.combo"
              :key="name"
              class="text-center"
            >
              <p class="text-sm font-medium text-white">{{ name }}</p>
            </div>
          </div>

          <p class="text-sm text-gray-400">{{ rec.reason }}</p>
          <p v-if="rec.strategy" class="text-sm text-blue-400 mt-1">{{ rec.strategy }}</p>

          <div v-if="rec.warnings?.length" class="mt-2 space-y-1">
            <p v-for="w in rec.warnings" :key="w" class="text-xs text-yellow-400">
              &#x26A0;&#xFE0F; {{ w }}
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { usePokemonStore } from '@/stores/pokemon.js'
import { useRosterStore } from '@/stores/roster.js'
import { useBattleStore } from '@/stores/battle.js'
import PokemonSearch from '@/components/pokemon/PokemonSearch.vue'
import PokemonGrid from '@/components/pokemon/PokemonGrid.vue'
import TypeBadge from '@/components/pokemon/TypeBadge.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const pokemonStore = usePokemonStore()
const rosterStore = useRosterStore()
const battleStore = useBattleStore()

const opponentIds = computed(() => battleStore.opponentParty.map(p => p._id))

onMounted(() => {
  if (!pokemonStore.list.length) pokemonStore.fetchPokemons()
  if (rosterStore.isEmpty) rosterStore.fetchRoster()
})

const onOpponentSelect = (pokemon) => {
  if (opponentIds.value.includes(pokemon._id)) {
    battleStore.removeOpponent(pokemon._id)
  } else {
    battleStore.addOpponent(pokemon)
  }
}

const getRecommendations = async () => {
  const myPartyIds = rosterStore.filledSlots
    .map(s => s.pokemonId?._id || s.pokemonId)
    .filter(Boolean)
  await battleStore.fetchRecommendations(myPartyIds)
}

const selectCombo = (rec) => {
  // 추천 조합 이름으로 내 파티에서 매칭
  const matched = rosterStore.filledSlots.filter(slot =>
    rec.combo.includes(slot.pokemonId?.name?.ko)
  )
  battleStore.myCombo = matched.map(s => s.pokemonId)
}
</script>
