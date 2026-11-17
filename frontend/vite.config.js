import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'ERP Koperasi Tani',
                short_name: 'ERP Tani',
                lang: 'id',
                display: 'standalone',
                theme_color: '#1F4E79',
                background_color: '#EEF2F5',
                icons: [
                    { src: '/icons/192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/icons/512.png', sizes: '512x512', type: 'image/png' },
                ],
            },
            workbox: {
                navigateFallbackDenylist: [/^\/api\//],
                runtimeCaching: [
                    {
                        urlPattern: /\/api\/v1\/master\/lookups/,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'lookups',
                            expiration: { maxAgeSeconds: 60 * 60 * 24 },
                        },
                    },
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
        },
    },
    build: {
        target: 'es2022',
        sourcemap: true,
    },
});
