import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router/router.js'
import 'element-plus/dist/index.css'

const app = createApp(App)
app.use(router)
app.mount('#app')