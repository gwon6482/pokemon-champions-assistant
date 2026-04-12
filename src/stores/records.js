import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const API = import.meta.env.VITE_API_BASE || '/api'

export const useRecordsStore = defineStore('records', () => {
  const list = ref([])
  const stats = ref({ win: 0, lose: 0, draw: 0 })
  const loading = ref(false)
  const pagination = ref({ total: 0, page: 1, limit: 20, totalPages: 1 })

  const winRate = computed(() => {
    const total = stats.value.win + stats.value.lose + stats.value.draw
    if (!total) return 0
    return Math.round((stats.value.win / total) * 100)
  })

  const fetchRecords = async (params = {}) => {
    loading.value = true
    try {
      const query = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 20,
        ...(params.mode && { mode: params.mode }),
        ...(params.result && { result: params.result })
      })
      const res = await axios.get(`${API}/records?${query}`)
      list.value = res.data.data
      stats.value = res.data.stats
      pagination.value = res.data.pagination
    } finally {
      loading.value = false
    }
  }

  return { list, stats, loading, pagination, winRate, fetchRecords }
})
