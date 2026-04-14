import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const API = import.meta.env.VITE_API_BASE || '/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const username = ref(localStorage.getItem('username') || null)

  const isLoggedIn = computed(() => !!token.value)

  function setAuth(data) {
    token.value = data.token
    username.value = data.username
    localStorage.setItem('token', data.token)
    localStorage.setItem('username', data.username)
  }

  function clearAuth() {
    token.value = null
    username.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('username')
  }

  async function login(usernameInput, password) {
    const res = await axios.post(`${API}/auth/login`, { username: usernameInput, password })
    setAuth(res.data)
  }

  async function register(usernameInput, password, confirmPassword) {
    const res = await axios.post(`${API}/auth/register`, {
      username: usernameInput,
      password,
      confirmPassword
    })
    setAuth(res.data)
  }

  function logout() {
    clearAuth()
  }

  return { token, username, isLoggedIn, login, register, logout }
})
