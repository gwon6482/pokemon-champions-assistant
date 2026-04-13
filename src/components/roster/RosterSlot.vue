<template>
  <div
    class="relative rounded-xl border-2 transition-all duration-200 cursor-pointer aspect-square flex flex-col items-center justify-center gap-1.5 p-2"
    :class="slot
      ? 'bg-surface-800 border-surface-600 hover:border-blue-400'
      : 'bg-surface-800/50 border-dashed border-surface-600 hover:border-surface-500'"
    @click="$emit('select', index)"
  >
    <template v-if="slot">
      <!-- 슬롯 번호 -->
      <span class="absolute top-1 left-2 text-xs text-gray-500 font-mono">{{ index + 1 }}</span>

      <!-- 삭제 버튼 -->
      <button
        class="absolute top-1 right-1 w-5 h-5 text-gray-500 hover:text-red-400 flex items-center justify-center"
        @click.stop="$emit('remove', slot._id)"
      >
        &#x2715;
      </button>

      <!-- 포켓몬 이미지 -->
      <img
        v-if="slot.pokemonId?.imageUrl"
        :src="slot.pokemonId.imageUrl"
        :alt="slot.pokemonId?.name?.ko"
        class="w-12 h-12 object-contain"
      />
      <div v-else class="w-12 h-12 rounded-full bg-surface-700 flex items-center justify-center text-xl">
        &#x2753;
      </div>

      <!-- 이름 -->
      <p class="text-xs font-semibold text-center text-white leading-tight line-clamp-1">
        {{ slot.nickname || slot.pokemonId?.name?.ko }}
      </p>

      <!-- 타입 -->
      <div class="flex gap-0.5 flex-wrap justify-center">
        <TypeBadge v-for="t in slot.pokemonId?.types" :key="t" :type="t" />
      </div>
    </template>

    <!-- 빈 슬롯 -->
    <template v-else>
      <span class="text-3xl text-surface-600">+</span>
      <span class="text-xs text-gray-600">슬롯 {{ index + 1 }}</span>
    </template>
  </div>
</template>

<script setup>
import TypeBadge from '@/components/pokemon/TypeBadge.vue'

defineProps({
  slot: { type: Object, default: null },
  index: { type: Number, required: true }
})

defineEmits(['select', 'remove'])
</script>
