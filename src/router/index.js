import { createRouter, createWebHashHistory } from 'vue-router'
import CutPic from '../views/CutPic.vue'
import Inpaint from '../views/Inpaint.vue'
import Home from '../views/Home.vue'
import PdfComposer from '../views/PdfComposer.vue'
// import BackgroundRemoval from '../views/BackgroundRemoval.vue';
import SpecGenerator from '../views/SpecGenerator.vue';
import SpecStatistics from '../views/SpecStatistics.vue';
import BadgePage from '../views/BadgePage.vue' // New import

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
    name: 'BadgePage',
    component: BadgePage
  },
  {
    path: '/pdf-composer',
    name: 'PdfComposer',
    component: PdfComposer
  },
  /*
  {
    path: '/remove-background',
    name: 'BackgroundRemoval',
    component: BackgroundRemoval
  },
  */
  {
    path: '/spec-generator',
    name: 'SpecGenerator',
    component: SpecGenerator
  },
  {
    path: '/spec-statistics',
    name: 'SpecStatistics',
    component: SpecStatistics
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
