<template>
  <div
    class="relative bg-surface-800 rounded-xl border border-surface-700 p-3 cursor-pointer
           hover:border-blue-500 hover:bg-surface-700 transition-all duration-200
           flex flex-col items-center gap-2 select-none"
    :class="{
      'ring-2 ring-blue-500 border-blue-500': selected,
      'opacity-50 cursor-not-allowed': disabled
    }"
    @click="!disabled && $emit('click', pokemon)"
  >
    <!-- 선택 뱃지 -->
    <div v-if="selected" class="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
      <span class="text-white text-xs font-bold">&#x2713;</span>
    </div>

    <!-- 슬롯 번호 (선택된 경우) -->
    <div v-if="slotNumber !== undefined" class="absolute top-1.5 left-1.5 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
      <span class="text-white text-xs font-bold">{{ slotNumber }}</span>
    </div>

    <!-- 포켓몬 이미지 -->
    <div class="w-16 h-16 flex items-center justify-center">
      <img
        v-if="pokemon.imageUrl || pokemon.spriteUrl"
        :src="pokemon.imageUrl || pokemon.spriteUrl"
        :alt="pokemon.name.ko"
        class="w-full h-full object-contain"
        loading="lazy"
        @error="imgError = true"
      />
      <div v-else class="w-16 h-16 rounded-full bg-surface-700 flex items-center justify-center text-2xl">
        &#x2753;
      </div>
    </div>

    <!-- 이름 -->
    <div class="text-center">
      <p class="text-sm font-semibold text-white leading-tight">{{ pokemon.name.ko }}</p>
      <p class="text-xs text-gray-500">No.{{ String(pokemon.nationalId).padStart(3, '0') }}</p>
    </div>

    <!-- 타입 뱃지 -->
    <div class="flex gap-1 flex-wrap justify-center">
      <TypeBadge v-for="t in pokemon.types" :key="t" :type="t" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TypeBadge from './TypeBadge.vue'

defineProps({
  pokemon: { type: Object, required: true },
  selected: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  slotNumber: { type: Number, default: undefined }
})

defineEmits(['click'])

const imgError = ref(false)
</script>
