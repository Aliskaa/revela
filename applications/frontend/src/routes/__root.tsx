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
import { theme } from "@/lib/theme";

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
