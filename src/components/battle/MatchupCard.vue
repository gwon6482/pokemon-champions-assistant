<template>
  <div
    class="card p-3 transition-all duration-200"
    :class="[
      disabled
        ? 'opacity-35 cursor-not-allowed'
        : 'cursor-pointer',
      selected
        ? 'ring-2 ring-green-500 bg-green-900/20'
        : highlighted
          ? 'ring-2 ring-blue-500 bg-blue-900/20'
          : (!disabled ? 'hover:bg-surface-700' : '')
    ]"
    @click="!disabled && $emit('click', pokemon)"
  >
    <div class="flex items-center gap-3">
      <!-- 선택 표시 -->
      <div class="w-5 h-5 flex-shrink-0 flex items-center justify-center">
        <span
          v-if="selected"
          class="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold"
        >✓</span>
        <span
          v-else
          class="w-4 h-4 rounded-full border-2 border-surface-500 inline-block"
        />
      </div>

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
        <!-- 스탯 바 -->
        <div v-if="pokemon.baseStats" class="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5">
          <div v-for="s in statList" :key="s.key" class="flex items-center gap-1">
            <span class="text-gray-500 w-6 text-right shrink-0" style="font-size:10px">{{ s.label }}</span>
            <div class="flex-1 bg-surface-800 rounded-full overflow-hidden" style="height:4px">
              <div class="h-full rounded-full" :class="s.color" :style="{ width: statBarWidth(pokemon.baseStats[s.key]) }"></div>
            </div>
            <span class="text-gray-400 w-6 shrink-0" style="font-size:10px">{{ pokemon.baseStats[s.key] }}</span>
          </div>
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

const statList = [
  { key: 'hp',      label: 'HP',  color: 'bg-green-500' },
  { key: 'attack',  label: '공',  color: 'bg-orange-500' },
  { key: 'defense', label: '방',  color: 'bg-blue-500' },
  { key: 'spAtk',   label: '특공', color: 'bg-purple-500' },
  { key: 'spDef',   label: '특방', color: 'bg-teal-500' },
  { key: 'speed',   label: '속',  color: 'bg-yellow-500' },
]

const statBarWidth = (val) => `${Math.min(100, Math.round((val / 255) * 100))}%`

const props = defineProps({
  pokemon:     { type: Object,  required: true },
  matchup:     { type: Number,  default: null },
  highlighted: { type: Boolean, default: false },
  selected:    { type: Boolean, default: false },
  disabled:    { type: Boolean, default: false }
})

defineEmits(['click'])

const matchupClass = computed(() => {
  if (props.matchup >= 2) return 'text-green-400'
  if (props.matchup >= 1) return 'text-gray-400'
  if (props.matchup > 0)  return 'text-red-400'
  return 'text-gray-600'
})

const matchupLabel = computed(() => {
  if (props.matchup === null) return ''
  if (props.matchup === 0)    return '무효'
  if (props.matchup === 4)    return '4배'
  if (props.matchup === 2)    return '2배'
  if (props.matchup === 0.5)  return '1/2'
  if (props.matchup === 0.25) return '1/4'
  return '보통'
})
</script>
