<template>
  <div
    class="card p-3 cursor-pointer transition-all duration-200"
    :class="highlighted ? 'ring-2 ring-blue-500 bg-blue-900/20' : 'hover:bg-surface-700'"
    @click="$emit('click', pokemon)"
  >
    <div class="flex items-center gap-3">
      <!-- 이미지 -->
      <div class="w-12 h-12 bg-surface-700 rounded-lg flex items-center justify-center flex-shrink-0">
        <img
          v-if="pokemon.imageUrl"
          :src="pokemon.imageUrl"
          :alt="pokemon.name?.ko"
          class="w-10 h-10 object-contain"
        />
        <span v-else class="text-xl">&#x2753;</span>
      </div>

      <!-- 정보 -->
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-white text-sm truncate">{{ pokemon.name?.ko }}</p>
        <div class="flex gap-1 mt-0.5 flex-wrap">
          <TypeBadge v-for="t in pokemon.types" :key="t" :type="t" />
        </div>
      </div>

      <!-- 상성 배수 -->
      <div v-if="matchup !== null" class="flex-shrink-0 text-right">
        <span class="text-sm font-bold" :class="matchupClass">
          {{ matchupLabel }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import TypeBadge from '@/components/pokemon/TypeBadge.vue'

const props = defineProps({
  pokemon: { type: Object, required: true },
  matchup: { type: Number, default: null },
  highlighted: { type: Boolean, default: false }
})

defineEmits(['click'])

const matchupClass = computed(() => {
  if (props.matchup >= 2) return 'text-green-400'
  if (props.matchup >= 1) return 'text-gray-400'
  if (props.matchup > 0) return 'text-red-400'
  return 'text-gray-600'
})

const matchupLabel = computed(() => {
  if (props.matchup === null) return ''
  if (props.matchup === 0) return '무효'
  if (props.matchup === 4) return '4배'
  if (props.matchup === 2) return '2배'
  if (props.matchup === 0.5) return '1/2'
  if (props.matchup === 0.25) return '1/4'
  return '보통'
})
</script>
