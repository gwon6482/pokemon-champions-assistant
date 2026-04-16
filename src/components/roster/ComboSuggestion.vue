<template>
  <div class="card p-4 animate-fade-in">
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <h3 class="font-semibold text-white">조합 {{ index + 1 }}</h3>
        <span class="text-xs px-2 py-0.5 rounded-full font-semibold" :class="scoreClass">
          {{ combo.score }}점
        </span>
      </div>
      <button v-if="showSelect" class="btn-primary text-xs px-3 py-1.5" @click="$emit('select', combo)">
        이 조합 선택
      </button>
    </div>

    <!-- 포켓몬 목록 -->
    <div class="flex gap-2 mb-4 flex-wrap">
      <div
        v-for="slot in combo.combo"
        :key="slot._id"
        class="relative flex flex-col items-center gap-1"
      >
        <span v-if="aceSlotId && slot._id === aceSlotId" class="absolute -top-2 left-1/2 -translate-x-1/2 text-xs leading-none z-10">⭐</span>
        <div
          class="w-14 h-14 rounded-lg flex items-center justify-center"
          :class="aceSlotId && slot._id === aceSlotId
            ? 'bg-yellow-900/40 ring-2 ring-yellow-400'
            : 'bg-surface-700'"
        >
          <img
            v-if="slot.pokemonId?.imageUrl"
            :src="slot.pokemonId.imageUrl"
            :alt="slot.pokemonId?.name?.ko"
            class="w-12 h-12 object-contain"
          />
          <span v-else class="text-xl">&#x2753;</span>
        </div>
        <p class="text-xs text-center leading-tight" :class="aceSlotId && slot._id === aceSlotId ? 'text-yellow-300 font-semibold' : 'text-gray-300'">
          {{ slot.nickname || slot.pokemonId?.name?.ko || slot.name?.ko }}
        </p>
        <div class="flex gap-0.5 flex-wrap justify-center">
          <TypeBadge
            v-for="t in (slot.pokemonId?.types || slot.types)"
            :key="t"
            :type="t"
          />
        </div>
      </div>
    </div>

    <!-- 분석 -->
    <div v-if="combo.analysis" class="space-y-2 text-sm border-t border-surface-700 pt-3">
      <!-- 강한 상대 속성 -->
      <div v-if="combo.analysis.strengths?.length" class="flex flex-wrap gap-1 items-baseline">
        <span class="text-green-400 font-semibold text-xs shrink-0">강한 상대 속성</span>
        <span class="text-gray-300 text-xs">{{ combo.analysis.strengths.join(' · ') }}</span>
      </div>

      <!-- 약한 상대 속성 -->
      <div v-if="combo.analysis.weaknesses?.length" class="flex flex-wrap gap-1 items-baseline">
        <span class="text-red-400 font-semibold text-xs shrink-0">약한 상대 속성</span>
        <span class="text-gray-300 text-xs">{{ combo.analysis.weaknesses.join(' · ') }}</span>
      </div>
      <div v-else class="flex gap-1 items-baseline">
        <span class="text-red-400 font-semibold text-xs shrink-0">약한 상대 속성</span>
        <span class="text-gray-500 text-xs">공통 약점 없음</span>
      </div>

      <!-- 역할 분담 -->
      <div v-if="combo.analysis.roles?.length">
        <p class="text-blue-400 font-semibold text-xs mb-1">역할 분담</p>
        <ul class="space-y-0.5">
          <li
            v-for="r in combo.analysis.roles"
            :key="r.name"
            class="text-gray-400 text-xs flex justify-between"
          >
            <span>{{ r.name }} — {{ r.role }}</span>
            <span class="text-gray-500">스피드 {{ r.speed }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import TypeBadge from '@/components/pokemon/TypeBadge.vue'

const props = defineProps({
  combo: { type: Object, required: true },
  index: { type: Number, default: 0 },
  showSelect: { type: Boolean, default: false },
  aceSlotId: { type: String, default: null }
})

defineEmits(['select'])

const scoreClass = computed(() => {
  if (props.combo.score >= 75) return 'bg-green-600/20 text-green-400'
  if (props.combo.score >= 50) return 'bg-yellow-600/20 text-yellow-400'
  return 'bg-red-600/20 text-red-400'
})
</script>
