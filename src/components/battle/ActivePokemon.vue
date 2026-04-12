<template>
  <div
    class="card p-4 cursor-pointer transition-all duration-200"
    :class="isActive ? 'ring-2 border-blue-500 bg-blue-900/20' : 'hover:bg-surface-700'"
    @click="$emit('toggle', pokemon)"
  >
    <div class="flex items-center gap-3">
      <div class="w-14 h-14 bg-surface-700 rounded-lg flex items-center justify-center">
        <img
          v-if="pokemon.pokemonId?.imageUrl || pokemon.imageUrl"
          :src="pokemon.pokemonId?.imageUrl || pokemon.imageUrl"
          class="w-12 h-12 object-contain"
          :class="isActive ? '' : 'opacity-70'"
        />
        <span v-else class="text-2xl">&#x2753;</span>
      </div>

      <div class="flex-1">
        <div class="flex items-center gap-2">
          <p class="font-semibold text-white">
            {{ pokemon.pokemonId?.name?.ko || pokemon.name?.ko }}
          </p>
          <span v-if="isActive" class="text-xs px-2 py-0.5 bg-blue-600 rounded-full text-white">
            출전 중
          </span>
        </div>
        <div class="flex gap-1 mt-1 flex-wrap">
          <TypeBadge
            v-for="t in (pokemon.pokemonId?.types || pokemon.types)"
            :key="t"
            :type="t"
          />
        </div>
        <div v-if="pokemon.heldItem" class="text-xs text-gray-500 mt-0.5">
          도구: {{ pokemon.heldItem }}
        </div>
      </div>

      <div class="text-2xl">
        {{ isActive ? '&#x26A1;' : '&#x1F4A4;' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import TypeBadge from '@/components/pokemon/TypeBadge.vue'

defineProps({
  pokemon: { type: Object, required: true },
  isActive: { type: Boolean, default: false }
})

defineEmits(['toggle'])
</script>
