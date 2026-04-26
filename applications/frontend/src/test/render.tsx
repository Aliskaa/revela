import { ThemeProvider } from '@mui/material';
import { type RenderOptions, render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import { theme } from '@/lib/theme';

const Providers = ({ children }: { children: ReactNode }) => <ThemeProvider theme={theme}>{children}</ThemeProvider>;

/**
 * `render` de Testing Library wrappé avec le theme MUI applicatif. À utiliser pour tout test
 * de composant qui consomme `theme.palette.*` ou `theme.tint.*` via `sx`.
 */
export const renderWithTheme = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
    render(ui, { wrapper: Providers, ...options });
