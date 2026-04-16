<template>
  <div class="max-w-5xl mx-auto px-4 py-6 space-y-6">
    <!-- 업데이트 공지 -->
    <div class="flex items-center gap-2 bg-blue-900/30 border border-blue-700/40 rounded-lg px-4 py-2.5 text-xs text-blue-300">
      <span>📢</span>
      <span><b>[업데이트]</b> 에이스 선택 기능이 추가되었습니다. 내 파티에서 조합에 반드시 포함할 에이스 포켓몬을 지정할 수 있습니다.</span>
    </div>

    <!-- 비회원 안내 -->
    <div v-if="!authStore.isLoggedIn" class="flex items-center gap-2 bg-yellow-900/20 border border-yellow-700/40 rounded-lg px-4 py-2.5 text-xs text-yellow-300">
      <span>💾</span>
      <span>비회원 모드입니다. 파티는 브라우저에 임시 저장되며 다른 기기에서는 사용할 수 없습니다.
        <RouterLink to="/login" class="underline font-semibold ml-1">로그인</RouterLink>하면 자동으로 저장됩니다.
      </span>
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

    <!-- 에이스 선택 -->
    <section v-if="rosterStore.isFull">
      <div class="flex items-center justify-between mb-2">
        <div>
          <h2 class="text-sm font-semibold text-gray-300 uppercase tracking-wide">에이스</h2>
          <p class="text-xs text-gray-500 mt-0.5">조합에 반드시 포함할 포켓몬 1마리를 선택하세요</p>
        </div>
        <button v-if="rosterStore.aceSlotId" @click="rosterStore.aceSlotId = null" class="text-xs text-gray-500 hover:text-red-400 transition-colors">해제</button>
      </div>
      <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <button
          v-for="slot in rosterStore.filledSlots"
          :key="slot._id"
          class="relative flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all"
          :class="rosterStore.aceSlotId === slot._id
            ? 'border-yellow-400 bg-yellow-900/20'
            : 'border-surface-600 bg-surface-800 hover:border-yellow-600/50'"
          @click="toggleAce(slot._id)"
        >
          <span v-if="rosterStore.aceSlotId === slot._id" class="absolute -top-2 left-1/2 -translate-x-1/2 text-sm leading-none">⭐</span>
          <img v-if="slot.pokemonId?.imageUrl" :src="slot.pokemonId.imageUrl" class="w-10 h-10 object-contain" />
          <p class="text-xs text-center text-gray-300 truncate w-full leading-tight">
            {{ slot.nickname || slot.pokemonId?.name?.ko }}
          </p>
        </button>
      </div>
    </section>

    <!-- Google AdSense -->
    <div>
      <ins class="adsbygoogle"
        style="display:block"
        data-ad-client="ca-pub-3610745423535391"
        data-ad-slot="auto"
        data-ad-format="auto"
        data-full-width-responsive="true"></ins>
    </div>

    <!-- 조합 분석 -->
    <section v-if="rosterStore.isFull">
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
          :ace-slot-id="rosterStore.aceSlotId"
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
          :max-select="99"
          @select="onPokemonSelect"
        />
      </div>
    </section>

    <!-- 교체 슬롯 선택 모달 (6마리 꽉 찼을 때) -->
    <div v-if="showSlotPicker" class="modal-overlay" @click.self="showSlotPicker = false">
      <div class="modal-content p-5">
        <h3 class="font-bold text-white mb-1">교체할 포켓몬 선택</h3>
        <p class="text-xs text-gray-500 mb-4">파티에서 내보낼 포켓몬을 선택하세요</p>
        <div class="grid grid-cols-3 gap-2 mb-4">
          <button
            v-for="(slot, i) in rosterStore.slots"
            :key="i"
            class="flex flex-col items-center gap-1.5 p-3 bg-surface-700 rounded-xl border-2 border-transparent hover:border-red-500 hover:bg-red-900/20 transition-all"
            @click="assignToSlot(i)"
          >
            <img
              v-if="slot?.pokemonId?.imageUrl"
              :src="slot.pokemonId.imageUrl"
              class="w-10 h-10 object-contain"
            />
            <span class="text-xs text-white text-center leading-tight w-full truncate">
              {{ slot?.nickname || slot?.pokemonId?.name?.ko }}
            </span>
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { usePokemonStore } from '@/stores/pokemon.js'
import { useRosterStore } from '@/stores/roster.js'
import { useAuthStore } from '@/stores/auth.js'
import { recommendCombos } from '@/utils/recommend.js'
import RosterSlot from '@/components/roster/RosterSlot.vue'
import PokemonEditor from '@/components/roster/PokemonEditor.vue'
import ComboSuggestion from '@/components/roster/ComboSuggestion.vue'
import PokemonSearch from '@/components/pokemon/PokemonSearch.vue'
import PokemonGrid from '@/components/pokemon/PokemonGrid.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const pokemonStore = usePokemonStore()
const rosterStore = useRosterStore()
const authStore = useAuthStore()

const battleMode = ref('single')
const showSlotPicker = ref(false)
const editingSlot = ref(null)
const pendingPokemon = ref(null)

const selectedIds = computed(() =>
  rosterStore.slots.filter(Boolean).map(s => s.pokemonId?._id || s.pokemonId)
)

const combos = computed(() => {
  const all = recommendCombos(rosterStore.slots, [], battleMode.value, 20)
  if (!rosterStore.aceSlotId) return all
  return all.filter(r => r.combo.some(s => s._id === rosterStore.aceSlotId))
})
const topCombos = computed(() => combos.value.slice(0, 5))

const toggleAce = (slotId) => {
  rosterStore.aceSlotId = rosterStore.aceSlotId === slotId ? null : slotId
}

onMounted(async () => {
  pokemonStore.fetchPokemons()
  rosterStore.fetchRoster()
  await nextTick()
  try {
    ;(window.adsbygoogle = window.adsbygoogle || []).push({})
  } catch {}
})

const onPokemonSelect = (pokemon) => {
  // 이미 파티에 있으면 제거
  const existingSlot = rosterStore.slots.find(
    s => s && (s.pokemonId?._id === pokemon._id || s.pokemonId === pokemon._id)
  )
  if (existingSlot) {
    rosterStore.removeSlot(existingSlot._id)
    return
  }
  // 빈 슬롯 있으면 바로 추가, 꽉 찼으면 교체 모달
  pendingPokemon.value = pokemon
  const emptyIndex = rosterStore.slots.findIndex(s => s === null)
  if (emptyIndex !== -1) {
    assignToSlot(emptyIndex)
  } else {
    showSlotPicker.value = true
  }
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
  pokemonStore.searchQuery = ''
  pokemonStore.selectedTypes = []
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
