<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <!-- 헤더 -->
      <div class="flex items-center justify-between p-5 border-b border-surface-700">
        <div class="flex items-center gap-3">
          <img
            v-if="slot.pokemonId?.imageUrl"
            :src="slot.pokemonId.imageUrl"
            :alt="slot.pokemonId?.name?.ko"
            class="w-12 h-12 object-contain"
          />
          <div>
            <h2 class="font-bold text-white">{{ slot.pokemonId?.name?.ko }}</h2>
            <div class="flex gap-1 mt-0.5">
              <TypeBadge v-for="t in slot.pokemonId?.types" :key="t" :type="t" />
            </div>
          </div>
        </div>
        <button class="text-gray-400 hover:text-white text-xl" @click="$emit('close')">&#x2715;</button>
      </div>

      <!-- 편집 폼 -->
      <div class="p-5 space-y-4">
        <!-- 닉네임 -->
        <div>
          <label class="block text-xs text-gray-400 mb-1">닉네임</label>
          <input v-model="form.nickname" type="text" placeholder="(옵션)"
            class="input-base" />
        </div>

        <!-- 성격 -->
        <div>
          <label class="block text-xs text-gray-400 mb-1">성격</label>
          <select v-model="form.nature" class="input-base">
            <option value="">선택 안 함</option>
            <option v-for="n in NATURES" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>

        <!-- 특성 -->
        <div>
          <label class="block text-xs text-gray-400 mb-1">특성</label>
          <select v-if="pokemonAbilities.length" v-model="form.ability" class="input-base">
            <option value="">선택 안 함</option>
            <option v-for="a in pokemonAbilities" :key="a.nameKo" :value="a.nameKo">
              {{ a.nameKo }}{{ a.isHidden ? ' (숨겨진 특성)' : '' }}
            </option>
          </select>
          <input
            v-else
            v-model="form.ability"
            type="text"
            placeholder="특성 이름 직접 입력"
            class="input-base"
          />
        </div>

        <!-- 도구 -->
        <div>
          <label class="block text-xs text-gray-400 mb-1">지닌 도구</label>
          <input v-model="form.heldItem" type="text" placeholder="도구 이름"
            class="input-base" />
        </div>

        <!-- 기술 4개 -->
        <div>
          <label class="block text-xs text-gray-400 mb-2">기술 (최대 4개)</label>
          <div class="grid grid-cols-2 gap-2">
            <div v-for="i in 4" :key="i" class="relative">
              <!-- 선택된 기술 표시 -->
              <div
                v-if="form.moves[i - 1]"
                class="flex items-center gap-2 bg-surface-700 border border-blue-500 rounded-lg px-3 py-2 text-sm"
              >
                <span
                  v-if="getMoveType(form.moves[i - 1])"
                  class="w-2 h-2 rounded-full flex-shrink-0"
                  :style="{ backgroundColor: TYPE_COLORS[getMoveType(form.moves[i - 1])] }"
                />
                <span class="text-white flex-1 truncate">{{ form.moves[i - 1] }}</span>
                <button
                  class="text-gray-400 hover:text-red-400 flex-shrink-0"
                  @click="form.moves[i - 1] = ''"
                >&#x2715;</button>
              </div>
              <!-- 빈 슬롯: 드롭다운 -->
              <div v-else class="relative">
                <select
                  class="input-base appearance-none"
                  @change="e => { selectMove(i - 1, e.target.value); e.target.value = '' }"
                >
                  <option value="">기술 {{ i }} 선택...</option>
                  <optgroup label="물리기술">
                    <option
                      v-for="m in physicalMoves"
                      :key="m.nameKo"
                      :value="m.nameKo"
                      :disabled="form.moves.includes(m.nameKo)"
                    >{{ m.nameKo }} ({{ TYPE_KO[m.type] ?? m.type }}, {{ m.power ?? '—' }})
                    </option>
                  </optgroup>
                  <optgroup label="특수기술">
                    <option
                      v-for="m in specialMoves"
                      :key="m.nameKo"
                      :value="m.nameKo"
                      :disabled="form.moves.includes(m.nameKo)"
                    >{{ m.nameKo }} ({{ TYPE_KO[m.type] ?? m.type }}, {{ m.power ?? '—' }})
                    </option>
                  </optgroup>
                  <optgroup label="변화기술">
                    <option
                      v-for="m in statusMoves"
                      :key="m.nameKo"
                      :value="m.nameKo"
                      :disabled="form.moves.includes(m.nameKo)"
                    >{{ m.nameKo }} ({{ TYPE_KO[m.type] ?? m.type }})
                    </option>
                  </optgroup>
                </select>
              </div>
            </div>
          </div>
          <!-- 기술 데이터 없을 때 안내 -->
          <p v-if="!pokemonMoves.length" class="text-xs text-gray-500 mt-1">
            기술 데이터를 불러오는 중이거나 아직 수집되지 않았습니다.
          </p>
        </div>

        <!-- EV 노력치 -->
        <div>
          <label class="block text-xs text-gray-400 mb-2">노력치 (합계 510 이하)</label>
          <div class="grid grid-cols-3 gap-2">
            <div v-for="stat in EV_STATS" :key="stat.key">
              <label class="block text-xs text-gray-500 mb-0.5">{{ stat.label }}</label>
              <input
                v-model.number="form.evTraining[stat.key]"
                type="number" min="0" max="252"
                class="w-full bg-surface-700 border border-surface-600 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <p class="text-xs text-right mt-1" :class="evTotal > 510 ? 'text-red-400' : 'text-gray-500'">
            합계: {{ evTotal }} / 510
          </p>
        </div>
      </div>

      <!-- 버튼 -->
      <div class="flex gap-3 p-5 border-t border-surface-700">
        <button class="btn-secondary flex-1" @click="$emit('close')">취소</button>
        <button class="btn-primary flex-1" :disabled="evTotal > 510" @click="save">저장</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import TypeBadge from '@/components/pokemon/TypeBadge.vue'
import { TYPE_COLORS, TYPE_KO } from '@/utils/typeChart.js'

const props = defineProps({
  slot: { type: Object, required: true }
})

const emit = defineEmits(['close', 'save'])

const NATURES = [
  '겁쟁이','천진난만','용감','덜렁이','성급','온순','무사태평','장난꾸러기','고집',
  '개구쟁이','귀여운척','냉정','신중','촐랑','얌전','조심','명랑','변덕','홀가분','건방'
]

const EV_STATS = [
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: '공격' },
  { key: 'defense', label: '방어' },
  { key: 'spAtk', label: '특공' },
  { key: 'spDef', label: '특방' },
  { key: 'speed', label: '스피드' }
]

// 포켓몬 DB 데이터에서 특성/기술 가져오기
const pokemonAbilities = computed(() => props.slot.pokemonId?.abilities ?? [])
const pokemonMoves     = computed(() => props.slot.pokemonId?.moves ?? [])

const physicalMoves = computed(() => pokemonMoves.value.filter(m => m.damageClass === 'physical'))
const specialMoves  = computed(() => pokemonMoves.value.filter(m => m.damageClass === 'special'))
const statusMoves   = computed(() => pokemonMoves.value.filter(m => m.damageClass === 'status'))

// 기술 이름으로 타입 조회
const moveTypeMap = computed(() => {
  const map = {}
  pokemonMoves.value.forEach(m => { map[m.nameKo] = m.type })
  return map
})
const getMoveType = (nameKo) => moveTypeMap.value[nameKo]

const form = reactive({
  nickname: props.slot.nickname || '',
  nature:   props.slot.nature || '',
  ability:  props.slot.ability || '',
  heldItem: props.slot.heldItem || '',
  moves: [...(props.slot.moves || []), '', '', '', ''].slice(0, 4),
  evTraining: {
    hp:      props.slot.evTraining?.hp || 0,
    attack:  props.slot.evTraining?.attack || 0,
    defense: props.slot.evTraining?.defense || 0,
    spAtk:   props.slot.evTraining?.spAtk || 0,
    spDef:   props.slot.evTraining?.spDef || 0,
    speed:   props.slot.evTraining?.speed || 0
  }
})

const evTotal = computed(() =>
  Object.values(form.evTraining).reduce((a, b) => a + (b || 0), 0)
)

const selectMove = (index, value) => {
  if (!value) return
  form.moves[index] = value
}

const save = () => {
  emit('save', {
    ...form,
    moves: form.moves.filter(Boolean)
  })
}
</script>

<style scoped>
.input-base {
  @apply w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500;
}
</style>
