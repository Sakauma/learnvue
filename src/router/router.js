import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../components/HomePage.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', redirect: '/home' },
        { path: '/home', name: 'HomePage', component: HomePage },
        {
            path: '/index',
            name: 'AppIndex',
            component: () => import('../components/utils/AppIndex.vue')
        },
        {
            path: '/infer',
            name: 'infer',
            component: () => import('../components/ImgProcess.vue')
        },
    ]
})
export default router