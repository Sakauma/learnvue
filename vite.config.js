import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
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
                    target: env.VITE_API_BASE_URL,
                    ws: true,
                    changeOrigin: true,
                    secure: false,
                    //rewrite: (path) => path.replace(/^\/api/, '')
                },
                '/sse': {
                    target: env.VITE_API_BASE_URL,
                    changeOrigin: true,
                }
            }
        }
    }
})