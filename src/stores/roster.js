import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const API = import.meta.env.VITE_API_BASE || '/api'

export const useRosterStore = defineStore('roster', () => {
  // 내 파티: 6개 슬롯 (null = 비어있음)
  const slots = ref(Array(6).fill(null))
  const loading = ref(false)
  const error = ref(null)

  const filledSlots = computed(() => slots.value.filter(Boolean))
  const isFull = computed(() => filledSlots.value.length >= 6)
  const isEmpty = computed(() => filledSlots.value.length === 0)

  const fetchRoster = async () => {
    loading.value = true
    try {
      const res = await axios.get(`${API}/roster`)
      const fresh = Array(6).fill(null)
      res.data.forEach(slot => { fresh[slot.slotIndex] = slot })
      slots.value = fresh
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  const addToSlot = async (slotIndex, pokemonId, details = {}) => {
    const res = await axios.post(`${API}/roster`, { slotIndex, pokemonId, ...details })
    slots.value[slotIndex] = res.data
    return res.data
  }

  const updateSlot = async (id, updates) => {
    const res = await axios.put(`${API}/roster/${id}`, updates)
    const idx = slots.value.findIndex(s => s?._id === id)
    if (idx !== -1) slots.value[idx] = res.data
    return res.data
  }

  const removeSlot = async (id) => {
    await axios.delete(`${API}/roster/${id}`)
    const idx = slots.value.findIndex(s => s?._id === id)
    if (idx !== -1) slots.value[idx] = null
  }

  const clearRoster = async () => {
    await axios.delete(`${API}/roster`)
    slots.value = Array(6).fill(null)
  }

  // 슬롯 인덱스로 포켓몬 찾기
  const getPokemonAtSlot = (index) => slots.value[index]

  return {
    slots, loading, error,
    filledSlots, isFull, isEmpty,
    fetchRoster, addToSlot, updateSlot, removeSlot, clearRoster,
    getPokemonAtSlot
  }
})
