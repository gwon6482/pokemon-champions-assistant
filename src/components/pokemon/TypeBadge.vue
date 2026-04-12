<template>
  <span
    class="inline-block px-2 py-0.5 rounded-full text-white text-xs font-semibold"
    :style="{ backgroundColor: typeColor }"
  >
    {{ TYPE_KO[type] || type }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { TYPE_COLORS, TYPE_KO } from '@/utils/typeChart.js'

const props = defineProps({
  type: { type: String, required: true }
})

const typeColor = computed(() => TYPE_COLORS[props.type] || '#888')
</script>
