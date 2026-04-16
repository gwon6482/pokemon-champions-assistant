import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { useAuthStore } from './auth.js'
import { usePokemonStore } from './pokemon.js'

const API = import.meta.env.VITE_API_BASE || '/api'
const GUEST_KEY = 'roster_guest'

function authHeaders() {
  const auth = useAuthStore()
  return auth.token ? { Authorization: `Bearer ${auth.token}` } : {}
}

export const useRosterStore = defineStore('roster', () => {
  const slots = ref(Array(6).fill(null))
  const loading = ref(false)
  const error = ref(null)
  const aceSlotId = ref(null)

  const filledSlots = computed(() => slots.value.filter(Boolean))
  const isFull = computed(() => filledSlots.value.length >= 6)
  const isEmpty = computed(() => filledSlots.value.length === 0)

  // --- Guest mode helpers ---
  const saveToLocal = () => {
    localStorage.setItem(GUEST_KEY, JSON.stringify(slots.value))
  }

  const loadFromLocal = () => {
    try {
      const data = JSON.parse(localStorage.getItem(GUEST_KEY))
      if (Array.isArray(data)) slots.value = data
    } catch {}
  }

  // --- fetchRoster ---
  const fetchRoster = async () => {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) {
      loadFromLocal()
      return
    }
    loading.value = true
    try {
      const res = await axios.get(`${API}/roster`, { headers: authHeaders() })
      const fresh = Array(6).fill(null)
      res.data.forEach(slot => { fresh[slot.slotIndex] = slot })
      slots.value = fresh
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // --- addToSlot ---
  const addToSlot = async (slotIndex, pokemonId, details = {}) => {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) {
      const pokemonStore = usePokemonStore()
      const pokemon = pokemonStore.list.find(p => p._id === pokemonId || p._id === pokemonId?._id)
      const localSlot = {
        _id: `local_${slotIndex}`,
        slotIndex,
        pokemonId: pokemon,
        nickname: details.nickname || '',
        ability: details.ability || '',
        heldItem: details.heldItem || '',
        nature: details.nature || '',
        evTraining: details.evTraining || {},
        moves: details.moves || []
      }
      slots.value[slotIndex] = localSlot
      saveToLocal()
      return localSlot
    }
    const res = await axios.post(`${API}/roster`, { slotIndex, pokemonId, ...details }, { headers: authHeaders() })
    slots.value[slotIndex] = res.data
    return res.data
  }

  // --- updateSlot ---
  const updateSlot = async (id, updates) => {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) {
      const idx = slots.value.findIndex(s => s?._id === id)
      if (idx !== -1) {
        slots.value[idx] = { ...slots.value[idx], ...updates }
        saveToLocal()
      }
      return slots.value[idx]
    }
    const res = await axios.put(`${API}/roster/${id}`, updates, { headers: authHeaders() })
    const idx = slots.value.findIndex(s => s?._id === id)
    if (idx !== -1) slots.value[idx] = res.data
    return res.data
  }

  // --- removeSlot ---
  const removeSlot = async (id) => {
    if (aceSlotId.value === id) aceSlotId.value = null
    const auth = useAuthStore()
    if (!auth.isLoggedIn) {
      const idx = slots.value.findIndex(s => s?._id === id)
      if (idx !== -1) {
        slots.value[idx] = null
        saveToLocal()
      }
      return
    }
    await axios.delete(`${API}/roster/${id}`, { headers: authHeaders() })
    const idx = slots.value.findIndex(s => s?._id === id)
    if (idx !== -1) slots.value[idx] = null
  }

  // --- clearRoster ---
  const clearRoster = async () => {
    aceSlotId.value = null
    const auth = useAuthStore()
    if (!auth.isLoggedIn) {
      slots.value = Array(6).fill(null)
      localStorage.removeItem(GUEST_KEY)
      return
    }
    await axios.delete(`${API}/roster`, { headers: authHeaders() })
    slots.value = Array(6).fill(null)
  }

  // --- reset (로그아웃 시) ---
  const reset = () => {
    slots.value = Array(6).fill(null)
    aceSlotId.value = null
  }

  const getPokemonAtSlot = (index) => slots.value[index]

  // --- 로그인 시 localStorage → DB 마이그레이션 ---
  const migrateFromLocal = async () => {
    const raw = localStorage.getItem(GUEST_KEY)
    if (!raw) {
      await fetchRoster()
      return
    }

    let localSlots
    try {
      localSlots = JSON.parse(raw)
    } catch {
      localStorage.removeItem(GUEST_KEY)
      await fetchRoster()
      return
    }

    const hasData = Array.isArray(localSlots) && localSlots.some(Boolean)
    if (!hasData) {
      localStorage.removeItem(GUEST_KEY)
      await fetchRoster()
      return
    }

    loading.value = true
    try {
      await axios.delete(`${API}/roster`, { headers: authHeaders() })
      for (const slot of localSlots) {
        if (!slot) continue
        await axios.post(`${API}/roster`, {
          slotIndex: slot.slotIndex,
          pokemonId: slot.pokemonId?._id,
          nickname: slot.nickname,
          ability: slot.ability,
          heldItem: slot.heldItem,
          nature: slot.nature,
          evTraining: slot.evTraining,
          moves: slot.moves
        }, { headers: authHeaders() })
      }
      localStorage.removeItem(GUEST_KEY)
      await fetchRoster()
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return {
    slots, loading, error, aceSlotId,
    filledSlots, isFull, isEmpty,
    fetchRoster, addToSlot, updateSlot, removeSlot, clearRoster, reset,
    getPokemonAtSlot, migrateFromLocal
  }
})
