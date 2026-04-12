import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const API = import.meta.env.VITE_API_BASE || '/api'

export const usePokemonStore = defineStore('pokemon', () => {
  const list = ref([])
  const loading = ref(false)
  const error = ref(null)
  const pagination = ref({ total: 0, page: 1, limit: 50, totalPages: 1 })

  // 검색/필터 상태
  const searchQuery = ref('')
  const selectedTypes = ref([])

  const fetchPokemons = async (params = {}) => {
    loading.value = true
    error.value = null
    try {
      const query = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 200,
        championsOnly: params.championsOnly !== false,
        ...(params.q && { q: params.q }),
        ...(params.types?.length && { types: params.types.join(',') })
      })
      const res = await axios.get(`${API}/pokemon?${query}`)
      list.value = res.data.data
      pagination.value = res.data.pagination
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  const fetchPokemon = async (id) => {
    const res = await axios.get(`${API}/pokemon/${id}`)
    return res.data
  }

  const filteredList = computed(() => {
    let result = list.value
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      result = result.filter(p =>
        p.name.ko.includes(q) || p.name.en.toLowerCase().includes(q)
      )
    }
    if (selectedTypes.value.length > 0) {
      result = result.filter(p =>
        selectedTypes.value.every(t => p.types.includes(t))
      )
    }
    return result
  })

  return {
    list, loading, error, pagination,
    searchQuery, selectedTypes,
    fetchPokemons, fetchPokemon,
    filteredList
  }
})
