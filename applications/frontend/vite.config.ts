import path from 'node:path';
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
        // Workspace packages compilés en CJS (`@aor/types`) doivent être pré-bundlés par Vite
        // pour exposer correctement leurs exports nommés à l'ESM côté navigateur. Sans cela,
        // les imports runtime (constantes, helpers — ex. `TRANSPARENCY_F_TO_P_TABLE`) échouent
        // avec « does not provide an export named X ». Les imports `import type` n'étaient pas
        // affectés tant qu'aucune valeur runtime n'était partagée.
        optimizeDeps: {
            include: ['@aor/types'],
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
