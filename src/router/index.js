import { createRouter, createWebHashHistory } from 'vue-router'
import CutPic from '../views/CutPic.vue'
import Inpaint from '../views/Inpaint.vue'
import Home from '../views/Home.vue'

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
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
