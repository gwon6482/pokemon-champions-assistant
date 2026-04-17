<template>
  <div class="min-h-screen overflow-y-auto px-4 pb-10 bg-surface-900">
    <div class="w-full max-w-sm mx-auto pt-12 sm:pt-[25vh]">
      <!-- 로고 -->
      <div class="text-center mb-8">
        <span class="text-5xl">⚔️</span>
        <h1 class="text-2xl font-bold text-white mt-3">챔피언스 어시스턴트</h1>
      </div>

      <!-- 탭 -->
      <div class="flex bg-surface-800 rounded-xl p-1 mb-6">
        <button
          class="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
          :class="mode === 'login' ? 'bg-blue-600 text-white' : 'text-gray-400'"
          @click="switchMode('login')"
        >로그인</button>
        <button
          class="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
          :class="mode === 'register' ? 'bg-blue-600 text-white' : 'text-gray-400'"
          @click="switchMode('register')"
        >회원가입</button>
      </div>

      <!-- 로그인 폼 -->
      <form v-if="mode === 'login'" @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-xs text-gray-400 mb-1">아이디</label>
          <input
            v-model="username"
            type="text"
            placeholder="영문/숫자 최대 8자"
            maxlength="8"
            autocomplete="username"
            class="input w-full"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">비밀번호</label>
          <input
            v-model="password"
            type="password"
            inputmode="numeric"
            placeholder="숫자만 입력"
            autocomplete="current-password"
            class="input w-full"
          />
        </div>

        <p v-if="errorMsg" class="text-red-400 text-xs text-center">{{ errorMsg }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors disabled:opacity-50"
        >
          {{ loading ? '로그인 중...' : '로그인' }}
        </button>
      </form>

      <!-- 회원가입 폼 -->
      <form v-else @submit.prevent="handleRegister" class="space-y-4">
        <!-- 비밀번호 찾기 경고 -->
        <div class="bg-yellow-900/30 border border-yellow-700/50 rounded-lg px-4 py-3">
          <p class="text-yellow-400 text-xs leading-relaxed">
            ⚠️ 비밀번호 찾기 기능이 없습니다.<br>
            잊어버리면 계정을 복구할 수 없으니 꼭 기억해 두세요.
          </p>
        </div>

        <div>
          <label class="block text-xs text-gray-400 mb-1">아이디</label>
          <input
            v-model="username"
            type="text"
            placeholder="영문/숫자 최대 8자"
            maxlength="8"
            autocomplete="username"
            class="input w-full"
          />
          <p class="text-xs text-gray-500 mt-1">영문자와 숫자만 사용 가능, 최대 8자</p>
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">비밀번호</label>
          <input
            v-model="password"
            type="password"
            inputmode="numeric"
            placeholder="숫자만, 4자리 이상"
            autocomplete="new-password"
            class="input w-full"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">비밀번호 확인</label>
          <input
            v-model="confirmPassword"
            type="password"
            inputmode="numeric"
            placeholder="비밀번호 재입력"
            autocomplete="new-password"
            class="input w-full"
          />
        </div>

        <p v-if="errorMsg" class="text-red-400 text-xs text-center">{{ errorMsg }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors disabled:opacity-50"
        >
          {{ loading ? '가입 중...' : '회원가입' }}
        </button>
      </form>
      <!-- Google AdSense -->
      <div class="mt-6">
        <ins class="adsbygoogle"
          style="display:block"
          data-ad-client="ca-pub-3610745423535391"
          data-ad-slot="auto"
          data-ad-format="rectangle"
          data-full-width-responsive="false"></ins>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useRosterStore } from '@/stores/roster.js'

const router = useRouter()
const authStore = useAuthStore()
const rosterStore = useRosterStore()

onMounted(async () => {
  await nextTick()
  try {
    ;(window.adsbygoogle = window.adsbygoogle || []).push({})
  } catch {}
})

const mode = ref('login')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMsg = ref('')

function switchMode(m) {
  mode.value = m
  errorMsg.value = ''
  username.value = ''
  password.value = ''
  confirmPassword.value = ''
}

async function handleLogin() {
  errorMsg.value = ''
  if (!username.value || !password.value) {
    errorMsg.value = '아이디와 비밀번호를 입력해주세요.'
    return
  }
  loading.value = true
  try {
    await authStore.login(username.value, password.value)
    await rosterStore.migrateFromLocal()
    router.push('/')
  } catch (e) {
    errorMsg.value = e.response?.data?.error || '로그인에 실패했습니다.'
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  errorMsg.value = ''
  if (!username.value || !password.value || !confirmPassword.value) {
    errorMsg.value = '모든 항목을 입력해주세요.'
    return
  }
  loading.value = true
  try {
    await authStore.register(username.value, password.value, confirmPassword.value)
    await rosterStore.migrateFromLocal()
    router.push('/')
  } catch (e) {
    errorMsg.value = e.response?.data?.error || '회원가입에 실패했습니다.'
  } finally {
    loading.value = false
  }
}
</script>
