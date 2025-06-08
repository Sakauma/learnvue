import { createRouter, createWebHistory } from 'vue-router'
import AppIndex from '../components/utils/AppIndex.vue'
import ImgProcess from '../components/ImgProcess.vue'
import HomePage from '../components/HomePage.vue'

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