import { createRouter, createWebHashHistory } from 'vue-router'
import CutPic from '../views/CutPic.vue'
import Inpaint from '../views/Inpaint.vue'
import Home from '../views/Home.vue'
import BadgeLayout from '../views/BadgeLayout.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/cutpic',
    name: 'CutPic',
    component: CutPic
  },
  {
    path: '/inpaint',
    name: 'Inpaint',
    component: Inpaint
  },
  {
    path: '/badge',
    name: 'BadgeLayout',
    component: BadgeLayout
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router