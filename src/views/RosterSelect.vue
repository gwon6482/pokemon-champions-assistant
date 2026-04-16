<template>
  <div class="max-w-5xl mx-auto px-4 py-6 space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-white">로스터 선택</h1>
      <p class="text-sm text-gray-400 mt-1">상대 파티를 입력하고 최적 조합을 추천받으세요</p>
    </div>

    <!-- 비회원 안내 -->
    <div v-if="!authStore.isLoggedIn" class="flex items-center gap-2 bg-yellow-900/20 border border-yellow-700/40 rounded-lg px-4 py-2.5 text-xs text-yellow-300">
      <span>💾</span>
      <span>비회원 모드입니다.
        <RouterLink to="/login" class="underline font-semibold ml-1">로그인</RouterLink>하면 파티와 전적이 저장됩니다.
      </span>
    </div>

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
      <div v-if="battleStore.opponentParty.length < 6" class="card p-4 space-y-4">
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
      <div v-else class="text-center text-xs text-gray-500 py-2">
        상대 파티가 모두 선택되었습니다.
        <button class="text-blue-400 hover:underline ml-1" @click="battleStore.clearOpponents()">초기화</button>
      </div>
    </section>

    <!-- 파티 부족 안내 -->
    <div
      v-if="!rosterStore.isEmpty && rosterStore.filledSlots.length < battleStore.comboSize"
      class="text-center text-yellow-400 text-sm"
    >
      조합 추천을 받으려면 파티에 포켓몬이 {{ battleStore.comboSize }}마리 이상 필요합니다.
      (현재 {{ rosterStore.filledSlots.length }}마리)
    </div>

    <!-- 추천 버튼 / 내 조합 직접 선택 -->
    <div
      v-if="rosterStore.filledSlots.length >= battleStore.comboSize"
      class="sticky bottom-20 md:bottom-6 space-y-2"
    >
      <button
        v-if="battleStore.opponentParty.length >= 1"
        class="w-full btn-primary py-3 text-base font-semibold shadow-lg"
        @click="getRecommendations"
      >
        조합 추천 받기 ({{ battleStore.comboSize }}마리)
      </button>
      <button
        class="w-full py-3 text-base font-semibold rounded-xl bg-surface-700 hover:bg-surface-600 text-gray-200 shadow-lg transition-colors"
        @click="openMyComboModal"
      >
        내 조합 사용하기
      </button>
    </div>

    <!-- 내 조합 선택 모달 -->
    <div v-if="showMyComboModal" class="modal-overlay" @click.self="showMyComboModal = false">
      <div class="modal-content p-5">
        <div class="flex items-center justify-between mb-1">
          <h3 class="font-bold text-white">내 조합 선택</h3>
          <span class="text-xs text-gray-400">
            {{ myComboSelection.length }}/{{ battleStore.comboSize }} 선택
          </span>
        </div>
        <p class="text-xs text-gray-500 mb-4">배틀에 출전할 {{ battleStore.comboSize }}마리를 선택하세요</p>

        <div class="grid grid-cols-3 gap-2 mb-5">
          <button
            v-for="slot in rosterStore.filledSlots"
            :key="slot._id"
            class="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all"
            :class="isMyComboSelected(slot)
              ? 'border-yellow-400 bg-yellow-900/20'
              : myComboSelection.length >= battleStore.comboSize
                ? 'border-surface-600 bg-surface-800 opacity-40 cursor-not-allowed'
                : 'border-surface-600 bg-surface-700 hover:border-blue-500'"
            @click="toggleMyComboSlot(slot)"
          >
            <img
              v-if="slot.pokemonId?.imageUrl"
              :src="slot.pokemonId.imageUrl"
              class="w-12 h-12 object-contain"
            />
            <span v-else class="w-12 h-12 flex items-center justify-center text-2xl text-gray-600">?</span>
            <p class="text-xs text-center text-gray-300 leading-tight w-full truncate">
              {{ slot.nickname || slot.pokemonId?.name?.ko }}
            </p>
            <div class="flex gap-0.5 flex-wrap justify-center">
              <TypeBadge v-for="t in slot.pokemonId?.types" :key="t" :type="t" />
            </div>
          </button>
        </div>

        <div class="flex gap-2">
          <button class="btn-secondary flex-1" @click="showMyComboModal = false">취소</button>
          <button
            class="btn-primary flex-1"
            :class="myComboSelection.length < battleStore.comboSize ? 'opacity-40 cursor-not-allowed' : ''"
            :disabled="myComboSelection.length < battleStore.comboSize"
            @click="confirmMyCombo"
          >
            배틀 시작
          </button>
        </div>
      </div>
    </div>

    <!-- 에러 메시지 -->
    <div v-if="recommendError" class="card p-4 text-red-400 text-sm text-center">
      {{ recommendError }}
    </div>

    <!-- 추천 결과 -->
    <section v-if="recommendations.length">
      <h2 class="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">추천 조합</h2>
      <div class="space-y-4">
        <div
          v-for="(rec, i) in recommendations"
          :key="i"
          class="card p-4 animate-fade-in"
        >
          <!-- 헤더 -->
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-white">조합 {{ i + 1 }}</span>
              <span
                class="text-xs px-2 py-0.5 rounded-full font-semibold"
                :class="rec.score >= 75 ? 'bg-green-600/20 text-green-400'
                  : rec.score >= 50 ? 'bg-yellow-600/20 text-yellow-400'
                  : 'bg-red-600/20 text-red-400'"
              >
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

          <!-- 포켓몬 -->
          <div class="flex gap-2 mb-4 flex-wrap">
            <div
              v-for="slot in rec.combo"
              :key="slot._id"
              class="flex flex-col items-center gap-1 p-2 bg-surface-700 rounded-lg"
            >
              <img
                v-if="slot.pokemonId?.imageUrl"
                :src="slot.pokemonId.imageUrl"
                class="w-10 h-10 object-contain"
              />
              <p class="text-xs font-medium text-white text-center">
                {{ slot.nickname || slot.pokemonId?.name?.ko }}
              </p>
              <div class="flex gap-0.5 flex-wrap justify-center">
                <TypeBadge v-for="t in slot.pokemonId?.types" :key="t" :type="t" />
              </div>
            </div>
          </div>

          <!-- 분석 -->
          <div class="space-y-2 text-sm border-t border-surface-700 pt-3">
            <!-- 강한 상대 속성 -->
            <div v-if="rec.analysis.strengths?.length" class="flex flex-wrap gap-1 items-baseline">
              <span class="text-green-400 font-semibold text-xs shrink-0">강한 상대 속성</span>
              <span class="text-gray-300 text-xs">{{ rec.analysis.strengths.join(' · ') }}</span>
            </div>

            <!-- 약한 상대 속성 -->
            <div class="flex flex-wrap gap-1 items-baseline">
              <span class="text-red-400 font-semibold text-xs shrink-0">약한 상대 속성</span>
              <span v-if="rec.analysis.weaknesses?.length" class="text-gray-300 text-xs">
                {{ rec.analysis.weaknesses.join(' · ') }}
              </span>
              <span v-else class="text-gray-500 text-xs">공통 약점 없음</span>
            </div>

            <!-- 역할 분담 -->
            <div v-if="rec.analysis.roles?.length">
              <p class="text-blue-400 font-semibold text-xs mb-1">역할 분담</p>
              <ul class="space-y-0.5">
                <li
                  v-for="r in rec.analysis.roles"
                  :key="r.name"
                  class="text-gray-400 text-xs flex justify-between"
                >
                  <span>{{ r.name }} — {{ r.role }}</span>
                  <span class="text-gray-500">스피드 {{ r.speed }}</span>
                </li>
              </ul>
            </div>

            <!-- 상대 파티 대응 -->
            <div v-if="rec.analysis.opponentAnalysis?.length">
              <p class="text-yellow-400 font-semibold text-xs mb-1">상대 파티 대응</p>
              <ul class="space-y-0.5">
                <li
                  v-for="o in rec.analysis.opponentAnalysis"
                  :key="o.name"
                  class="text-gray-400 text-xs flex justify-between"
                >
                  <span>{{ o.name }} → {{ o.counter }}</span>
                  <span
                    :class="o.mult >= 4 ? 'text-green-400 font-semibold'
                      : o.mult >= 2 ? 'text-green-500'
                      : o.mult < 1 ? 'text-red-400'
                      : 'text-gray-500'"
                  >
                    ×{{ o.mult }}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePokemonStore } from '@/stores/pokemon.js'
import { useRosterStore } from '@/stores/roster.js'
import { useBattleStore } from '@/stores/battle.js'
import { useAuthStore } from '@/stores/auth.js'
import { recommendCombos } from '@/utils/recommend.js'
import PokemonSearch from '@/components/pokemon/PokemonSearch.vue'
import PokemonGrid from '@/components/pokemon/PokemonGrid.vue'
import TypeBadge from '@/components/pokemon/TypeBadge.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const router = useRouter()
const pokemonStore = usePokemonStore()
const rosterStore = useRosterStore()
const battleStore = useBattleStore()
const authStore = useAuthStore()

const showMyComboModal = ref(false)
const myComboSelection = ref([])

const openMyComboModal = () => {
  myComboSelection.value = []
  showMyComboModal.value = true
}

const isMyComboSelected = (slot) => {
  const id = slot.pokemonId?._id || slot._id
  return myComboSelection.value.some(s => (s.pokemonId?._id || s._id) === id)
}

const toggleMyComboSlot = (slot) => {
  if (isMyComboSelected(slot)) {
    const id = slot.pokemonId?._id || slot._id
    myComboSelection.value = myComboSelection.value.filter(
      s => (s.pokemonId?._id || s._id) !== id
    )
  } else {
    if (myComboSelection.value.length >= battleStore.comboSize) return
    myComboSelection.value.push(slot)
  }
}

const confirmMyCombo = () => {
  if (myComboSelection.value.length < battleStore.comboSize) return
  battleStore.myCombo = myComboSelection.value.map(s => s.pokemonId || s)
  showMyComboModal.value = false
  router.push('/battle')
}

const recommendations = ref([])
const recommendError = ref('')
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
    pokemonStore.searchQuery = ''
    pokemonStore.selectedTypes = []
  }
}

const getRecommendations = () => {
  recommendError.value = ''
  try {
    const slots = [...rosterStore.filledSlots]
    const opponents = [...battleStore.opponentParty]
    console.log('[추천] 내 파티:', slots.length, '/ 상대:', opponents.length, '/ 모드:', battleStore.mode)
    const result = recommendCombos(slots, opponents, battleStore.mode, 5)
    console.log('[추천] 결과:', result.length, '개')
    recommendations.value = result
    if (!result.length) {
      recommendError.value = '조합을 생성할 수 없습니다. 파티 슬롯을 확인해주세요.'
    }
  } catch (e) {
    console.error('[추천 오류]', e)
    recommendError.value = `오류가 발생했습니다: ${e.message}`
  }
}

const selectCombo = (rec) => {
  battleStore.myCombo = rec.combo.map(s => s.pokemonId || s)
}
</script>
