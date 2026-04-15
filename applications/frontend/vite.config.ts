import path from 'path';
import tanstackRouter from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        server: {
            port: 5173,
            proxy: {
                '/api': {
                    target: env.VITE_API_URL || 'http://localhost:3000',
                    changeOrigin: true,
                },
            },
        },
    };
});
