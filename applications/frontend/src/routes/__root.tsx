import * as React from "react";
import {
  Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export type RouterContext = {
  // Extend this later with auth/session/user-role data if needed.
  // Example:
  // auth: { userId: string; role: "participant" | "admin" | "coach" } | null;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

const theme = createTheme({
  palette: {
    primary: {
      main: "rgb(15,24,152)",
    },
    secondary: {
      main: "rgb(255,204,0)",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: ["Outfit", "Tenorite", "Inter", "system-ui", "sans-serif"].join(","),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 14,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
        },
      },
    },
  },
});

function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function RootComponent() {
  return (
    <RootProviders>
      <Outlet />
    </RootProviders>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

/*
Architecture recommandée:

src/routes/__root.tsx
  -> Providers globaux + Outlet uniquement

src/routes/participant/__root.tsx
  -> Layout participant (sidebar + topbar + outlet)

src/routes/admin/__root.tsx
  -> Layout admin différent

Ça évite de mélanger les shells visuels entre rôles.
*/
