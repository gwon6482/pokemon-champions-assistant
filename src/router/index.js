import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import PartyBuilder from '@/views/PartyBuilder.vue'
import RosterSelect from '@/views/RosterSelect.vue'
import Battle from '@/views/Battle.vue'
import Login from '@/views/Login.vue'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: { title: '로그인' }
  },
  {
    path: '/',
    name: 'party-builder',
    component: PartyBuilder,
    meta: { title: '파티 구성', requiresAuth: true }
  },
  {
    path: '/roster',
    name: 'roster-select',
    component: RosterSelect,
    meta: { title: '로스터 선택', requiresAuth: true }
  },
  {
    path: '/battle',
    name: 'battle',
    component: Battle,
    meta: { title: '배틀', requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login' }
  }
  if (to.name === 'login' && auth.isLoggedIn) {
    return { name: 'party-builder' }
  }
})

router.afterEach(to => {
  document.title = `${to.meta.title || ''} | 포켓몬 챔피언스 어시스턴트`
})

export default router
