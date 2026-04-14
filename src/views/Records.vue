<template>
  <div class="max-w-5xl mx-auto px-4 py-6 space-y-5">
    <h1 class="text-2xl font-bold text-white">전적</h1>

    <!-- 로딩 -->
    <div v-if="loading" class="text-center text-gray-500 py-10">불러오는 중...</div>

    <template v-else>
      <!-- 승/패/무 요약 -->
      <div class="grid grid-cols-3 gap-3">
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-green-400">{{ stats.win }}</p>
          <p class="text-xs text-gray-400 mt-1">승</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-red-400">{{ stats.lose }}</p>
          <p class="text-xs text-gray-400 mt-1">패</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-gray-400">{{ stats.draw }}</p>
          <p class="text-xs text-gray-400 mt-1">무</p>
        </div>
      </div>

      <!-- 승률 바 (최근 20전 기준) -->
      <div v-if="total > 0" class="card p-4">
        <div class="flex justify-between text-xs text-gray-400 mb-2">
          <span>승률 {{ winRate }}% <span class="text-gray-600">(최근 {{ recentTotal }}전)</span></span>
          <span>총 {{ total }}전</span>
        </div>
        <div class="flex rounded-full overflow-hidden h-2">
          <div class="bg-green-500 transition-all" :style="{ width: winRate + '%' }" />
          <div class="bg-red-500 transition-all" :style="{ width: loseRate + '%' }" />
          <div class="bg-gray-600 flex-1" />
        </div>
      </div>

      <!-- 기록 없음 -->
      <div v-if="records.length === 0" class="card p-8 text-center text-gray-500 text-sm">
        아직 저장된 전적이 없습니다.
      </div>

      <!-- 기록 목록 -->
      <div v-else class="space-y-3">
        <div
          v-for="rec in records"
          :key="rec._id"
          class="card p-4"
        >
          <div class="flex items-center justify-between mb-3">
            <!-- 결과 배지 -->
            <span
              class="px-3 py-1 rounded-full text-sm font-bold"
              :class="resultClass(rec.result)"
            >{{ resultLabel(rec.result) }}</span>

            <div class="flex items-center gap-2 text-right">
              <span class="text-xs text-gray-500 px-2 py-0.5 bg-surface-700 rounded-full">
                {{ rec.mode === 'double' ? '더블' : '싱글' }}
              </span>
              <span class="text-xs text-gray-500">{{ formatDate(rec.createdAt) }}</span>
            </div>
          </div>

          <!-- 내 조합 vs 상대 -->
          <div class="flex items-center gap-3">
            <!-- 내 조합 -->
            <div class="flex gap-1 flex-wrap flex-1">
              <img
                v-for="p in rec.myCombo"
                :key="p._id"
                :src="p.imageUrl"
                :title="p.name?.ko"
                class="w-9 h-9 object-contain bg-surface-700 rounded-lg"
              />
            </div>

            <span class="text-gray-600 text-sm font-bold shrink-0">VS</span>

            <!-- 상대 파티 (출전 포켓몬 하이라이트) -->
            <div class="flex gap-1 flex-wrap flex-1 justify-end">
              <img
                v-for="p in rec.opponentParty"
                :key="p._id"
                :src="p.imageUrl"
                :title="p.name?.ko"
                class="w-9 h-9 object-contain rounded-lg transition-opacity"
                :class="isInCombo(p, rec)
                  ? 'bg-surface-600 ring-1 ring-blue-400'
                  : 'bg-surface-700 opacity-30'"
              />
            </div>
          </div>

          <!-- 메모 -->
          <p v-if="rec.note" class="text-xs text-gray-500 mt-2 pt-2 border-t border-surface-700">
            {{ rec.note }}
          </p>
        </div>
      </div>

      <!-- 더 불러오기 -->
      <button
        v-if="page < totalPages"
        class="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
        @click="loadMore"
      >더 보기</button>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth.js'

const API = import.meta.env.VITE_API_BASE || '/api'
const authStore = useAuthStore()

const records = ref([])
const stats = ref({ win: 0, lose: 0, draw: 0 })
const loading = ref(false)
const page = ref(1)
const totalPages = ref(1)
const total = ref(0)

// 승률은 현재 로드된 최근 20전 기준
const recentTotal = computed(() => records.value.length)
const winRate = computed(() => {
  if (recentTotal.value === 0) return 0
  const wins = records.value.filter(r => r.result === 'win').length
  return Math.round((wins / recentTotal.value) * 100)
})
const loseRate = computed(() => {
  if (recentTotal.value === 0) return 0
  const loses = records.value.filter(r => r.result === 'lose').length
  return Math.round((loses / recentTotal.value) * 100)
})

const fetchRecords = async (p = 1) => {
  loading.value = true
  try {
    const res = await axios.get(`${API}/records`, {
      params: { page: p, limit: 20 },
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    if (p === 1) {
      records.value = res.data.data
    } else {
      records.value.push(...res.data.data)
    }
    stats.value = res.data.stats
    totalPages.value = res.data.pagination.totalPages
    total.value = res.data.pagination.total
    page.value = p
  } finally {
    loading.value = false
  }
}

const loadMore = () => fetchRecords(page.value + 1)

onMounted(() => fetchRecords())

const isInCombo = (pokemon, rec) =>
  rec.opponentCombo?.some(c => c._id === pokemon._id) ?? false

const resultLabel = (r) => ({ win: '승', lose: '패', draw: '무' })[r] ?? r
const resultClass = (r) => ({
  win:  'bg-green-900/40 text-green-400',
  lose: 'bg-red-900/40 text-red-400',
  draw: 'bg-surface-700 text-gray-400'
})[r]

const formatDate = (iso) => {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>
