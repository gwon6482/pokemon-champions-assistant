import { createRouter, createWebHistory } from 'vue-router'
import PartyBuilder from '@/views/PartyBuilder.vue'
import RosterSelect from '@/views/RosterSelect.vue'
import Battle from '@/views/Battle.vue'

const routes = [
  {
    path: '/',
    name: 'party-builder',
    component: PartyBuilder,
    meta: { title: '파티 구성' }
  },
  {
    path: '/roster',
    name: 'roster-select',
    component: RosterSelect,
    meta: { title: '로스터 선택' }
  },
  {
    path: '/battle',
    name: 'battle',
    component: Battle,
    meta: { title: '배틀' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.afterEach(to => {
  document.title = `${to.meta.title || ''} | 포켓몬 챔피언스 어시스턴트`
})

export default router
