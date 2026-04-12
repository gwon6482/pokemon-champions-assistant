<template>
  <div class="card p-4 animate-fade-in">
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <h3 class="font-semibold text-white">조합 {{ index + 1 }}</h3>
        <span class="text-xs px-2 py-0.5 rounded-full font-semibold"
          :class="scoreClass">
          {{ combo.score }}점
        </span>
      </div>
      <button
        v-if="showSelect"
        class="btn-primary text-xs px-3 py-1.5"
        @click="$emit('select', combo)"
      >
        이 조합 선택
      </button>
    </div>

    <!-- 포켓몬 목록 -->
    <div class="flex gap-2 mb-3">
      <div
        v-for="slot in combo.combo"
        :key="slot._id"
        class="flex flex-col items-center gap-1"
      >
        <div class="w-14 h-14 bg-surface-700 rounded-lg flex items-center justify-center">
          <img
            v-if="slot.pokemonId?.imageUrl"
            :src="slot.pokemonId.imageUrl"
            :alt="slot.pokemonId?.name?.ko"
            class="w-12 h-12 object-contain"
          />
          <span v-else class="text-xl">&#x2753;</span>
        </div>
        <p class="text-xs text-center text-gray-300 leading-tight">
          {{ slot.pokemonId?.name?.ko || slot.name?.ko }}
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

    <!-- 추천 이유 -->
    <p class="text-sm text-gray-400 leading-relaxed">{{ combo.reason }}</p>

    <!-- 주의사항 -->
    <div v-if="combo.warnings?.length" class="mt-2 space-y-1">
      <p
        v-for="w in combo.warnings"
        :key="w"
        class="text-xs text-yellow-400 flex items-start gap-1"
      >
        <span>&#x26A0;&#xFE0F;</span> {{ w }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import TypeBadge from '@/components/pokemon/TypeBadge.vue'

const props = defineProps({
  combo: { type: Object, required: true },
  index: { type: Number, default: 0 },
  showSelect: { type: Boolean, default: false }
})

defineEmits(['select'])

const scoreClass = computed(() => {
  if (props.combo.score >= 75) return 'bg-green-600/20 text-green-400'
  if (props.combo.score >= 50) return 'bg-yellow-600/20 text-yellow-400'
  return 'bg-red-600/20 text-red-400'
})
</script>
