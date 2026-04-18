import {
  AppBar,
  Avatar,
  Box,
  Button,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  ChevronRight,
  ClipboardList,
  Gauge,
  LogOut,
  MessageSquareQuote,
  Radar,
  Sparkles,
  UserRound,
} from "lucide-react";
import * as React from "react";
import { userParticipant } from "@/lib/auth";

export const Route = createFileRoute("/participant")({
  component: ParticipantRouteLayout,
});

const COLORS = {
  blue: "rgb(15,24,152)",
  yellow: "rgb(255,204,0)",
  border: "rgba(15,23,42,0.10)",
  surface: "#ffffff",
  background: "#f8fafc",
};

type NavItem = {
  label: string;
  to: string;
  icon: React.ElementType;
  exact?: boolean;
};

const participantNav: NavItem[] = [
  { label: "Dashboard", to: "/participant", icon: Gauge, exact: true },
  { label: "Mes campagnes", to: "/participant/campaigns", icon: ClipboardList },
  { label: "Mon parcours", to: "/participant/journey", icon: BookOpen },
  { label: "Mes résultats", to: "/participant/results", icon: Radar },
  { label: "Mon coach", to: "/participant/coach", icon: MessageSquareQuote },
  { label: "Mon profil", to: "/participant/profile", icon: UserRound },
];

function isActive(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.to || pathname === item.to + "/";
  return pathname.startsWith(item.to);
}

function BrandMark() {
  return (
    <Stack direction="row" spacing={1.4} alignItems="center" sx={{ px: 0.5 }}>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 3,
          bgcolor: COLORS.blue,
          color: "#fff",
          display: "grid",
          placeItems: "center",
          boxShadow: "0 10px 25px rgba(15,24,152,0.18)",
        }}
      >
        <Sparkles size={18} />
      </Box>
      <Box>
        <Typography fontWeight={800} color="text.primary" lineHeight={1.1}>
          Revéla
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Espace participant
        </Typography>
      </Box>
    </Stack>
  );
}

function ParticipantSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const handleLogout = () => {
    userParticipant.removeToken();
    navigate({ to: "/login" });
  };

  return (
    <Box
      component="aside"
      sx={{
        width: 280,
        display: { xs: "none", lg: "flex" },
        flexDirection: "column",
        bgcolor: COLORS.surface,
        borderRight: `1px solid ${COLORS.border}`,
        px: 2.5,
        py: 3,
      }}
    >
      <BrandMark />

      <Stack spacing={1} sx={{ mt: 4 }}>
        {participantNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item, pathname);
          return (
            <Button
              key={item.label}
              component={Link}
              to={item.to}
              preload="intent"
              fullWidth
              variant={active ? "contained" : "text"}
              startIcon={<Icon size={16} />}
              endIcon={active ? <ChevronRight size={16} /> : undefined}
              sx={{
                justifyContent: "flex-start",
                borderRadius: 4,
                py: 1.35,
                px: 2,
                textTransform: "none",
                bgcolor: active ? COLORS.blue : "transparent",
                color: active ? "#fff" : "text.secondary",
                boxShadow: active ? "0 10px 25px rgba(15,24,152,0.16)" : "none",
                "&:hover": {
                  bgcolor: active ? "rgb(10,18,130)" : "rgba(15,23,42,0.04)",
                },
              }}
            >
              {item.label}
            </Button>
          );
        })}
      </Stack>

      <Box sx={{ mt: "auto" }}>
        <Button
          onClick={handleLogout}
          fullWidth
          variant="text"
          startIcon={<LogOut size={16} />}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 4,
            py: 1.35,
            px: 2,
            textTransform: "none",
            color: "text.secondary",
            "&:hover": {
              bgcolor: "rgba(239,68,68,0.08)",
              color: "rgb(220,38,38)",
            },
          }}
        >
          Déconnexion
        </Button>
      </Box>
    </Box>
  );
}

function MobileTopBar() {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        display: { xs: "block", lg: "none" },
        bgcolor: "rgba(248,250,252,0.92)",
        backdropFilter: "blur(10px)",
        color: "text.primary",
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      <Toolbar sx={{ minHeight: 68, px: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.2} sx={{ flex: 1 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 3,
              bgcolor: COLORS.blue,
              color: "#fff",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Sparkles size={16} />
          </Box>
          <Box>
            <Typography fontWeight={800} lineHeight={1.1}>
              Revéla
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Participant
            </Typography>
          </Box>
        </Stack>

        <Avatar sx={{ width: 34, height: 34, bgcolor: COLORS.blue }}>P</Avatar>
      </Toolbar>
    </AppBar>
  );
}

function TopBar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    userParticipant.removeToken();
    navigate({ to: "/login" });
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{
        display: { xs: "none", lg: "flex" },
        px: 0,
        mb: 3,
      }}
    >
      <Box>
        <Typography variant="h5" fontWeight={800} color="text.primary">
          Espace participant
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Suivi de campagne, progression et restitution
        </Typography>
      </Box>

      <Stack direction="row" spacing={1.5} alignItems="center">
        <Button
          onClick={handleLogout}
          variant="outlined"
          startIcon={<LogOut size={16} />}
          sx={{
            borderRadius: 3,
            textTransform: "none",
          }}
        >
          Déconnexion
        </Button>
      </Stack>
    </Stack>
  );
}

function ParticipantShell({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: COLORS.background }}>
      <MobileTopBar />
      <Box sx={{ display: "flex", minHeight: "100vh", maxWidth: 1600, mx: "auto" }}>
        <ParticipantSidebar />

        <Box
          component="main"
          sx={{ flex: 1, px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 2, sm: 3, lg: 4 } }}
        >
          <TopBar />
          {children}
        </Box>
      </Box>
    </Box>
  );
}

function ParticipantRouteLayout() {
  return (
    <ParticipantShell>
      <Outlet />
    </ParticipantShell>
  );
}
