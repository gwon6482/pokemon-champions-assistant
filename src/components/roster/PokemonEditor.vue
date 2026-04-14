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
          <div class="flex items-center justify-between mb-3">
            <label class="text-xs text-gray-400">노력치</label>
            <div class="flex items-center gap-2">
              <div class="h-1.5 w-28 bg-surface-700 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="ppUsed >= PP_TOTAL ? 'bg-red-500' : 'bg-blue-500'"
                  :style="{ width: `${(ppUsed / PP_TOTAL) * 100}%` }"
                />
              </div>
              <span class="text-xs font-mono" :class="ppUsed >= PP_TOTAL ? 'text-red-400' : 'text-gray-400'">
                {{ ppUsed }}/{{ PP_TOTAL }}
              </span>
            </div>
          </div>

          <div class="space-y-2">
            <div v-for="stat in EV_STATS" :key="stat.key"
              class="flex items-center gap-2"
            >
              <!-- 스탯명 + 기본값 -->
              <div class="w-20 flex-shrink-0">
                <span class="text-xs text-gray-300">{{ stat.label }}</span>
                <span class="text-xs text-gray-600 ml-1.5">{{ baseStat(stat.key) }}</span>
              </div>

              <!-- 컨트롤 -->
              <button
                class="ev-btn text-gray-500 hover:text-white hover:bg-surface-600"
                @click="setMin(stat.key)"
              >MIN</button>

              <button
                class="ev-btn-icon text-gray-400 hover:text-white hover:bg-surface-600"
                :disabled="form.evTraining[stat.key] <= 0"
                @click="decrement(stat.key)"
              >−</button>

              <span class="w-7 text-center text-sm font-mono"
                :class="form.evTraining[stat.key] > 0 ? 'text-blue-300' : 'text-gray-600'"
              >{{ form.evTraining[stat.key] }}</span>

              <button
                class="ev-btn-icon text-gray-400 hover:text-white hover:bg-surface-600"
                :disabled="form.evTraining[stat.key] >= EV_MAX || ppUsed >= PP_TOTAL"
                @click="increment(stat.key)"
              >+</button>

              <button
                class="ev-btn text-gray-500 hover:text-white hover:bg-surface-600"
                :disabled="ppRemaining === 0 && form.evTraining[stat.key] >= EV_MAX"
                @click="setMax(stat.key)"
              >MAX</button>

              <!-- 미니 게이지 -->
              <div class="flex-1 h-1.5 bg-surface-700 rounded-full overflow-hidden">
                <div
                  class="h-full bg-blue-500 rounded-full transition-all"
                  :style="{ width: `${(form.evTraining[stat.key] / EV_MAX) * 100}%` }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 버튼 -->
      <div class="flex gap-3 p-5 border-t border-surface-700">
        <button class="btn-secondary flex-1" @click="$emit('close')">취소</button>
        <button class="btn-primary flex-1" @click="save">저장</button>
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

const PP_TOTAL = 66
const EV_MAX   = 32

const ppUsed = computed(() =>
  Object.values(form.evTraining).reduce((a, b) => a + (b || 0), 0)
)
const ppRemaining = computed(() => PP_TOTAL - ppUsed.value)

const baseStat = (key) => props.slot.pokemonId?.baseStats?.[key] ?? '—'

const increment = (key) => {
  if (form.evTraining[key] >= EV_MAX) return
  if (ppRemaining.value <= 0) return
  form.evTraining[key]++
}

const decrement = (key) => {
  if (form.evTraining[key] <= 0) return
  form.evTraining[key]--
}

const setMin = (key) => {
  form.evTraining[key] = 0
}

const setMax = (key) => {
  const canAdd = ppRemaining.value + form.evTraining[key] // 현재 값 돌려받고 나서 쓸 수 있는 pp
  form.evTraining[key] = Math.min(EV_MAX, canAdd)
}

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
.ev-btn {
  @apply px-1.5 py-0.5 text-xs rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed;
}
.ev-btn-icon {
  @apply w-6 h-6 flex items-center justify-center text-base rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed;
}
</style>
