<template>
  <div class="min-h-screen flex flex-col">
    <Analytics />
    <NavBar />
    <main class="flex-1" :class="isLoginPage ? '' : 'pb-20 md:pb-6'">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Analytics } from '@vercel/analytics/vue'
import NavBar from '@/components/common/NavBar.vue'

const route = useRoute()
const isLoginPage = computed(() => route.name === 'login')
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
