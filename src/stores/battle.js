import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { useAuthStore } from './auth.js'
import { useRosterStore } from './roster.js'

const API = import.meta.env.VITE_API_BASE || '/api'

function authHeaders() {
  const auth = useAuthStore()
  return auth.token ? { Authorization: `Bearer ${auth.token}` } : {}
}

export const useBattleStore = defineStore('battle', () => {
  const mode = ref('single') // 'single' | 'double'
  const opponentParty = ref([]) // 상대 포켓몬 (최대 6마리)
  const myCombo = ref([])       // 선택된 내 조합 (3~4마리)
  const opponentCombo = ref([]) // 상대 선택 조합
  const recommendations = ref([])
  const loading = ref(false)
  const error = ref(null)

  // 배틀 중 활성 포켓몬
  const activeMine = ref(null)
  const activeOpponent = ref(null)

  const comboSize = computed(() => mode.value === 'double' ? 4 : 3)

  const addOpponent = (pokemon) => {
    if (opponentParty.value.length >= 6) return false
    if (opponentParty.value.find(p => p._id === pokemon._id)) return false
    opponentParty.value.push(pokemon)
    return true
  }

  const removeOpponent = (pokemonId) => {
    opponentParty.value = opponentParty.value.filter(p => p._id !== pokemonId)
  }

  const clearOpponents = () => {
    opponentParty.value = []
    recommendations.value = []
  }

  const fetchRecommendations = async (myPartyIds) => {
    if (!myPartyIds.length || !opponentParty.value.length) return
    loading.value = true
    error.value = null
    try {
      const res = await axios.post(`${API}/battle/recommend`, {
        myParty: myPartyIds,
        opponentParty: opponentParty.value.map(p => p._id),
        mode: mode.value
      })
      recommendations.value = res.data.recommendations
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  const saveRecord = async (result, note = '') => {
    const rosterStore = useRosterStore()
    const myPartyIds = rosterStore.filledSlots.map(s => s.pokemonId?._id || s.pokemonId)
    const res = await axios.post(`${API}/battle/record`, {
      mode: mode.value,
      myParty: myPartyIds,
      myCombo: myCombo.value.map(p => p.pokemonId?._id || p._id),
      opponentParty: opponentParty.value.map(p => p._id),
      opponentCombo: opponentCombo.value.map(p => p._id),
      result,
      note
    }, { headers: authHeaders() })
    return res.data
  }

  const reset = () => {
    opponentParty.value = []
    myCombo.value = []
    opponentCombo.value = []
    recommendations.value = []
    activeMine.value = null
    activeOpponent.value = null
    error.value = null
  }

  return {
    mode, opponentParty, myCombo, opponentCombo,
    recommendations, loading, error,
    activeMine, activeOpponent, comboSize,
    addOpponent, removeOpponent, clearOpponents,
    fetchRecommendations, saveRecord, reset
  }
})
