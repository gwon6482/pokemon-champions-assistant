<template>
  <nav v-if="authStore.isLoggedIn" class="bg-surface-800 border-b border-surface-700 sticky top-0 z-40">
    <div class="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
      <RouterLink to="/" class="flex items-center gap-2 font-bold text-lg text-white">
        <span class="text-2xl">&#x26BE;</span>
        <span class="hidden sm:inline">챔피언스 어시스턴트</span>
      </RouterLink>

      <!-- 데스크탑 메뉴 -->
      <div class="hidden md:flex items-center gap-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
          :class="isActive(item.to)
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:text-white hover:bg-surface-700'"
        >
          {{ item.label }}
        </RouterLink>

        <!-- 유저 정보 + 로그아웃 -->
        <div class="flex items-center gap-2 ml-2 pl-2 border-l border-surface-600">
          <span class="text-sm text-gray-300 font-medium">{{ authStore.username }}</span>
          <button
            @click="handleLogout"
            class="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-surface-700 transition-colors"
          >로그아웃</button>
        </div>
      </div>

      <!-- 모바일 유저 + 로그아웃 -->
      <div class="md:hidden flex items-center gap-2">
        <span class="text-xs text-gray-400">{{ authStore.username }}</span>
        <button
          @click="handleLogout"
          class="text-xs text-gray-500 hover:text-white transition-colors px-2 py-1"
        >로그아웃</button>
      </div>
    </div>

    <!-- 모바일 하단 탭 -->
    <div class="md:hidden fixed bottom-0 inset-x-0 bg-surface-800 border-t border-surface-700 flex z-50">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors duration-200"
        :class="isActive(item.to) ? 'text-blue-400' : 'text-gray-500'"
      >
        <span class="text-xl mb-0.5">{{ item.icon }}</span>
        {{ item.label }}
      </RouterLink>
    </div>
  </nav>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useRosterStore } from '@/stores/roster.js'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const rosterStore = useRosterStore()

const navItems = [
  { to: '/',       label: '파티 구성', icon: '📋' },
  { to: '/roster', label: '로스터',    icon: '📊' },
  { to: '/battle', label: '배틀',      icon: '⚔️' }
]

const isActive = (path) => route.path === path

function handleLogout() {
  authStore.logout()
  rosterStore.reset()
  router.push('/login')
}
</script>
