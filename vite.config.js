import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    plugins: [
        vue() //  添加 Vue 插件
    ],

    base: process.env.NODE_ENV === 'production' ? '/public/' : './',

    build: {
        outDir: 'dist',
        assetsDir: "assets",
        sourcemap: false,
        cssCodeSplit: true,
        rollupOptions: {
            output: {
                entryFileNames: 'assets/js/[name]-[hash].js',
                chunkFileNames: 'assets/js/[name]-[hash].js',
                assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
                manualChunks: {
                }
            }
        }
    },

    server: {
        open: true,
        host: '0.0.0.0',
        port: 8080,
        https: false,
        proxy: {
            '/api': {
                target: 'http://localhost:8081',
                // target: 'https://5cb3e979-e14a-4944-af3f-18fd30643211.mock.pstmn.io',
                ws: true,
                changeOrigin: true,
                secure: false,
                //rewrite: (path) => path.replace(/^\/api/, '')
            },
            '/sse': { // 新增 SSE 代理规则
                target: 'http://localhost:8081',
                changeOrigin: true,
            }

        }
    }
})