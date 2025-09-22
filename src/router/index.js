import { createRouter, createWebHashHistory } from 'vue-router'
import CutPic from '../views/CutPic.vue'
import Inpaint from '../views/Inpaint.vue'
import Home from '../views/Home.vue'
import BadgeLayout from '../views/BadgeLayout.vue'
import PdfComposer from '../views/PdfComposer.vue'
import BackgroundRemoval from '../views/BackgroundRemoval.vue';

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
  },
  {
    path: '/pdf-composer',
    name: 'PdfComposer',
    component: PdfComposer
  },
  {
    path: '/remove-background',
    name: 'BackgroundRemoval',
    component: BackgroundRemoval
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
