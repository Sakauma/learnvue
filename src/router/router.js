import { createRouter, createWebHistory } from 'vue-router'
import AppIndex from '../components/utils/appIndex.vue'
import ImgProcess from '../components/imgProcess.vue'
import HomePage from '../components/homePage.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', redirect: '/home' },
        { path: '/home', name: 'HomePage', component: HomePage },
        { path: '/index', name: 'AppIndex', component: AppIndex },
        { path: '/infer', name: 'infer', component: ImgProcess},
    ]
})
export default router