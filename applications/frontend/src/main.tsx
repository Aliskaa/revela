import { RouterProvider, createRouter } from '@tanstack/react-router';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import './lib/i18n';
import { routeTree } from './routeTree.gen';

const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
});

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('Élément racine introuvable : `<div id="root">` est attendu dans index.html.');
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
);
