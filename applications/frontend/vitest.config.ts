import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Config Vitest dédiée au frontend.
 *
 * Séparée de `vite.config.ts` pour éviter d'embarquer le plugin TanStack Router (génère
 * `routeTree.gen.ts` au démarrage) dans le runner de test, et pour garder l'environnement
 * `jsdom` confiné aux tests sans fuiter dans le build de prod.
 */
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.spec.{ts,tsx}'],
        exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
        css: true,
    },
});
