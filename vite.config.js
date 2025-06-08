import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
    plugins: [
        vue(),
        // AutoImport({
        //     resolvers: [ElementPlusResolver()],
        // }),
        // Components({
        //     resolvers: [ElementPlusResolver()],
        // })
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