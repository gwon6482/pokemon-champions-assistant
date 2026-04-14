<template>
  <nav class="bg-surface-800 border-b border-surface-700 sticky top-0 z-40">
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
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { to: '/',       label: '파티 구성', icon: '📋' },
  { to: '/roster', label: '로스터',    icon: '📊' },
  { to: '/battle', label: '배틀',      icon: '⚔️' }
]

const isActive = (path) => route.path === path
</script>
