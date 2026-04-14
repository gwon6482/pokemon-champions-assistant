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
        <!-- 스탯 바 (실질 스탯: 노력치+성격 반영) -->
        <div class="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5">
          <div v-for="s in statList" :key="s.key" class="flex items-center gap-1">
            <span class="text-gray-500 w-6 text-right shrink-0" style="font-size:10px">{{ s.label }}</span>
            <div class="flex-1 bg-surface-800 rounded-full overflow-hidden" style="height:4px">
              <div class="h-full rounded-full" :class="s.color" :style="{ width: statBarWidth(effectiveStats[s.key]) }"></div>
            </div>
            <span class="text-gray-400 w-6 shrink-0" style="font-size:10px">{{ effectiveStats[s.key] }}</span>
          </div>
        </div>
      </div>

      <div class="text-2xl">
        {{ isActive ? '&#x26A1;' : '&#x1F4A4;' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import TypeBadge from '@/components/pokemon/TypeBadge.vue'

const props = defineProps({
  pokemon: { type: Object, required: true },
  isActive: { type: Boolean, default: false }
})

defineEmits(['toggle'])

const NATURE_MAP = {
  '겁쟁이':     { up: 'speed',   down: 'attack'  },
  '성급':       { up: 'speed',   down: 'spAtk'   },
  '천진난만':   { up: 'speed',   down: 'spDef'   },
  '덜렁이':     { up: 'speed',   down: 'defense' },
  '용감':       { up: 'attack',  down: 'speed'   },
  '고집':       { up: 'attack',  down: 'spAtk'   },
  '장난꾸러기': { up: 'attack',  down: 'spDef'   },
  '건방':       { up: 'attack',  down: 'defense' },
  '명랑':       { up: 'spAtk',   down: 'attack'  },
  '얌전':       { up: 'spAtk',   down: 'speed'   },
  '변덕':       { up: 'spAtk',   down: 'defense' },
  '촐랑':       { up: 'spAtk',   down: 'spDef'   },
  '냉정':       { up: 'defense', down: 'attack'  },
  '개구쟁이':   { up: 'defense', down: 'spAtk'   },
  '온순':       { up: 'defense', down: 'speed'   },
  '홀가분':     { up: 'defense', down: 'spDef'   },
  '조심':       { up: 'spDef',   down: 'attack'  },
  '신중':       { up: 'spDef',   down: 'spAtk'   },
}

const statList = [
  { key: 'hp',      label: 'HP',  color: 'bg-green-500' },
  { key: 'attack',  label: '공',  color: 'bg-orange-500' },
  { key: 'defense', label: '방',  color: 'bg-blue-500' },
  { key: 'spAtk',   label: '특공', color: 'bg-purple-500' },
  { key: 'spDef',   label: '특방', color: 'bg-teal-500' },
  { key: 'speed',   label: '속',  color: 'bg-yellow-500' },
]

const effectiveStats = computed(() => {
  const slot = props.pokemon
  const base = slot.pokemonId?.baseStats || slot.baseStats || {}
  const ev   = slot.evTraining || {}
  const nat  = NATURE_MAP[slot.nature] || null
  const keys = ['hp', 'attack', 'defense', 'spAtk', 'spDef', 'speed']
  const stats = {}
  for (const k of keys) {
    let v = (base[k] || 0) + Math.round((ev[k] || 0) * 2)
    if (nat?.up   === k) v = Math.floor(v * 1.1)
    if (nat?.down === k) v = Math.floor(v * 0.9)
    stats[k] = v
  }
  return stats
})

const statBarWidth = (val) => `${Math.min(100, Math.round((val / 255) * 100))}%`
</script>
