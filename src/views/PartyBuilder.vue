<template>
  <div class="max-w-5xl mx-auto px-4 py-6 space-y-6">
    <!-- 업데이트 공지 -->
    <div class="flex items-center gap-2 bg-blue-900/30 border border-blue-700/40 rounded-lg px-4 py-2.5 text-xs text-blue-300">
      <span>📢</span>
      <span><b>[업데이트]</b> 전적에서 내 파티 전체 표시 기능이 추가되었습니다. 기존 전적은 데이터 호환 문제로 초기화되었습니다.</span>
    </div>

    <!-- 타이틀 -->
    <div>
      <h1 class="text-2xl font-bold text-white">파티 구성</h1>
      <p class="text-sm text-gray-400 mt-1">챔피언스에서 사용할 6마리를 선택하세요</p>
    </div>

    <!-- 내 파티 슬롯 -->
    <section>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-semibold text-gray-300 uppercase tracking-wide">내 파티</h2>
        <button v-if="!rosterStore.isEmpty" class="text-xs text-red-400 hover:text-red-300" @click="clearParty">
          파티 초기화
        </button>
      </div>
      <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <RosterSlot
          v-for="(slot, i) in rosterStore.slots"
          :key="i"
          :slot="slot"
          :index="i"
          @select="onSlotClick"
          @remove="removeSlot"
        />
      </div>
    </section>

    <!-- 조합 분석 -->
    <section v-if="rosterStore.filledSlots.length >= 3">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          가능한 조합 분석
          <span class="ml-2 text-gray-500 font-normal normal-case">
            ({{ combos.length }}가지)
          </span>
        </h2>
        <div class="flex gap-2">
          <button
            v-for="m in ['single', 'double']"
            :key="m"
            class="text-xs px-3 py-1 rounded-full transition-colors"
            :class="battleMode === m ? 'bg-blue-600 text-white' : 'bg-surface-700 text-gray-400'"
            @click="battleMode = m"
          >
            {{ m === 'single' ? '싱글' : '더블' }}
          </button>
        </div>
      </div>
      <div class="space-y-3">
        <ComboSuggestion
          v-for="(combo, i) in topCombos"
          :key="i"
          :combo="combo"
          :index="i"
        />
      </div>
    </section>

    <!-- 포켓몬 선택 패널 -->
    <section>
      <h2 class="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">포켓몬 선택</h2>
      <div class="card p-4 space-y-4">
        <PokemonSearch />

        <LoadingSpinner v-if="pokemonStore.loading" text="포켓몬 불러오는 중..." />

        <PokemonGrid
          v-else
          :pokemons="pokemonStore.filteredList"
          :selected-ids="selectedIds"
          :max-select="6"
          @select="onPokemonSelect"
        />
      </div>
    </section>

    <!-- 슬롯 선택 모달 -->
    <div v-if="showSlotPicker" class="modal-overlay" @click.self="showSlotPicker = false">
      <div class="modal-content p-5">
        <h3 class="font-bold text-white mb-4">슬롯 선택</h3>
        <div class="grid grid-cols-3 gap-2 mb-4">
          <button
            v-for="i in 6"
            :key="i"
            class="py-3 rounded-lg text-sm font-medium transition-colors"
            :class="rosterStore.slots[i - 1]
              ? 'bg-surface-700 text-yellow-400 hover:bg-yellow-900/30'
              : 'bg-surface-700 text-white hover:bg-blue-600'"
            @click="assignToSlot(i - 1)"
          >
            {{ rosterStore.slots[i - 1]
              ? `슬롯 ${i} (교체)`
              : `슬롯 ${i}` }}
          </button>
        </div>
        <button class="btn-secondary w-full" @click="showSlotPicker = false">취소</button>
      </div>
    </div>

    <!-- 포켓몬 편집 모달 -->
    <PokemonEditor
      v-if="editingSlot"
      :slot="editingSlot"
      @close="editingSlot = null"
      @save="saveSlotEdit"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePokemonStore } from '@/stores/pokemon.js'
import { useRosterStore } from '@/stores/roster.js'
import { recommendCombos } from '@/utils/recommend.js'
import RosterSlot from '@/components/roster/RosterSlot.vue'
import PokemonEditor from '@/components/roster/PokemonEditor.vue'
import ComboSuggestion from '@/components/roster/ComboSuggestion.vue'
import PokemonSearch from '@/components/pokemon/PokemonSearch.vue'
import PokemonGrid from '@/components/pokemon/PokemonGrid.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const pokemonStore = usePokemonStore()
const rosterStore = useRosterStore()

const battleMode = ref('single')
const showSlotPicker = ref(false)
const editingSlot = ref(null)
const pendingPokemon = ref(null)

const selectedIds = computed(() =>
  rosterStore.slots.filter(Boolean).map(s => s.pokemonId?._id || s.pokemonId)
)

const combos = computed(() =>
  recommendCombos(rosterStore.slots, [], battleMode.value, 20)
)
const topCombos = computed(() => combos.value.slice(0, 5))

onMounted(() => {
  pokemonStore.fetchPokemons()
  rosterStore.fetchRoster()
})

const onPokemonSelect = (pokemon) => {
  pendingPokemon.value = pokemon
  showSlotPicker.value = true
}

const onSlotClick = async (index) => {
  if (rosterStore.slots[index]) {
    // 최신 데이터(moves/abilities 포함) 보장을 위해 fetch 후 열기
    await rosterStore.fetchRoster()
    editingSlot.value = rosterStore.slots[index]
  }
}

const assignToSlot = async (index) => {
  showSlotPicker.value = false
  if (!pendingPokemon.value) return
  await rosterStore.addToSlot(index, pendingPokemon.value._id)
  pendingPokemon.value = null
}

const removeSlot = async (id) => {
  await rosterStore.removeSlot(id)
}

const clearParty = async () => {
  if (confirm('파티를 초기화하시겠습니까?')) {
    await rosterStore.clearRoster()
  }
}

const saveSlotEdit = async (updates) => {
  if (!editingSlot.value) return
  await rosterStore.updateSlot(editingSlot.value._id, updates)
  editingSlot.value = null
}
</script>
