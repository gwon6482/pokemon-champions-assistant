<template>
  <div>
    <!-- 결과 수 -->
    <p class="text-xs text-gray-500 mb-3">
      {{ pokemons.length }}마리
      <span v-if="selectedIds.length"> · {{ selectedIds.length }}마리 선택됨</span>
    </p>

    <!-- 그리드 -->
    <div
      v-if="pokemons.length"
      class="grid gap-2"
      :class="gridClass"
    >
      <PokemonCard
        v-for="pokemon in pokemons"
        :key="pokemon._id"
        :pokemon="pokemon"
        :selected="selectedIds.includes(pokemon._id)"
        :disabled="isDisabled(pokemon)"
        @click="$emit('select', pokemon)"
      />
    </div>

    <div v-else class="text-center text-gray-500 py-12">
      <p class="text-4xl mb-3">&#x1F614;</p>
      <p>검색 결과가 없습니다</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import PokemonCard from './PokemonCard.vue'

const props = defineProps({
  pokemons: { type: Array, required: true },
  selectedIds: { type: Array, default: () => [] },
  maxSelect: { type: Number, default: 6 },
  columns: { type: Number, default: 4 }
})

defineEmits(['select'])

const gridClass = computed(() => ({
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
  5: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5',
  6: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6'
}[props.columns]))

const isDisabled = (pokemon) => {
  return !props.selectedIds.includes(pokemon._id) && props.selectedIds.length >= props.maxSelect
}
</script>
