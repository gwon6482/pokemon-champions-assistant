<template>
  <div class="space-y-3">
    <!-- 텍스트 검색 -->
    <div class="relative">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">&#x1F50D;</span>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="포켓몬 이름 검색 (한글/영어)"
        class="w-full bg-surface-700 border border-surface-600 rounded-lg pl-9 pr-4 py-2.5
               text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        style="font-size: 16px"
      />
      <button
        v-if="searchQuery"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
        @click="searchQuery = ''"
      >
        &#x2715;
      </button>
    </div>

    <!-- 타입 필터 -->
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="type in ALL_TYPES"
        :key="type"
        class="px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-150"
        :style="isTypeSelected(type)
          ? { backgroundColor: TYPE_COLORS[type], borderColor: TYPE_COLORS[type], color: 'white' }
          : { backgroundColor: 'transparent', borderColor: TYPE_COLORS[type] + '66', color: TYPE_COLORS[type] }"
        @click="toggleType(type)"
      >
        {{ TYPE_KO[type] }}
      </button>
    </div>

    <!-- 필터 초기화 -->
    <div v-if="selectedTypes.length > 0 || searchQuery" class="flex justify-end">
      <button class="text-xs text-gray-400 hover:text-white" @click="clearFilters">
        필터 초기화
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { usePokemonStore } from '@/stores/pokemon.js'
import { TYPE_COLORS, TYPE_KO, ALL_TYPES } from '@/utils/typeChart.js'
import { storeToRefs } from 'pinia'

const pokemonStore = usePokemonStore()
const { searchQuery, selectedTypes } = storeToRefs(pokemonStore)

const isTypeSelected = (type) => selectedTypes.value.includes(type)

const toggleType = (type) => {
  const idx = selectedTypes.value.indexOf(type)
  if (idx === -1) {
    // 최대 2개 선택
    if (selectedTypes.value.length < 2) {
      selectedTypes.value.push(type)
    }
  } else {
    selectedTypes.value.splice(idx, 1)
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedTypes.value = []
}
</script>
