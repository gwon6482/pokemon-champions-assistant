<template>
  <div class="flex items-center justify-center" :class="fullscreen ? 'min-h-64' : ''">
    <div
      class="rounded-full border-2 border-surface-600 border-t-blue-500 animate-spin"
      :class="sizeClass"
    />
    <span v-if="text" class="ml-3 text-gray-400 text-sm">{{ text }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: { type: String, default: 'md' },
  text: { type: String, default: '' },
  fullscreen: { type: Boolean, default: false }
})

const sizeClass = computed(() => ({
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12'
}[props.size]))
</script>
