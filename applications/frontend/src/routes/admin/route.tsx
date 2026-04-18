import {
    AppBar,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    IconButton,
    InputBase,
    Stack,
    Toolbar,
    Typography
} from "@mui/material";
import { Link, Outlet, createFileRoute, useLocation, useNavigate } from "@tanstack/react-router";
import {
    BarChart3,
    Building2,
    ChevronRight,
    ClipboardList,
    LayoutDashboard,
    LogOut,
    MessageSquareText,
    Search,
    Shield,
    Sparkles,
    UserRound,
    Users,
} from "lucide-react";
import * as React from "react";
import { userAdmin } from "@/lib/auth";

const COLORS = {
  blue: "rgb(15,24,152)",
  yellow: "rgb(255,204,0)",
  border: "rgba(15,23,42,0.10)",
  surface: "#ffffff",
  background: "#f8fafc",
};

type AdminNavItem = {
  label: string;
  to: string;
  icon: React.ElementType;
  exact?: boolean;
};

const navItems: AdminNavItem[] = [
  { label: "Tableau de bord", to: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Campagnes", to: "/admin/campaigns", icon: ClipboardList },
  { label: "Entreprises", to: "/admin/companies", icon: Building2 },
  { label: "Coachs", to: "/admin/coaches", icon: UserRound },
  { label: "Réponses", to: "/admin/responses", icon: MessageSquareText },
  { label: "Questionnaires", to: "/admin/questionnaires", icon: Sparkles },
];

function isActive(item: AdminNavItem, pathname: string): boolean {
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
        <Shield size={18} />
      </Box>
      <Box>
        <Typography fontWeight={800} color="text.primary" lineHeight={1.1}>
          AOR Conseil
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Administration
        </Typography>
      </Box>
    </Stack>
  );
}

function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const handleLogout = () => {
    userAdmin.removeToken();
    navigate({ to: "/admin/login" });
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
        {navItems.map((item) => {
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
            <Shield size={16} />
          </Box>
          <Box>
            <Typography fontWeight={800} lineHeight={1.1}>
              AOR Conseil
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Administration
            </Typography>
          </Box>
        </Stack>

        <IconButton size="small">
          <Search size={18} />
        </IconButton>
        <Box sx={{ width: 12 }} />
        <Avatar sx={{ width: 34, height: 34, bgcolor: COLORS.blue }}>A</Avatar>
      </Toolbar>
    </AppBar>
  );
}

function TopBar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    userAdmin.removeToken();
    navigate({ to: "/admin/login" });
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ display: { xs: "none", lg: "flex" }, mb: 3 }}
    >
      <Box>
        <Typography variant="h5" fontWeight={800} color="text.primary">
          Vue d'ensemble
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Pilotage global des campagnes, participants et coachs.
        </Typography>
      </Box>

      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 1,
            minWidth: 320,
            borderRadius: 999,
            border: `1px solid ${COLORS.border}`,
            bgcolor: COLORS.surface,
          }}
        >
          <Search size={16} color="rgb(100,116,139)" />
          <InputBase placeholder="Recherche globale…" sx={{ width: "100%", fontSize: 14 }} />
        </Box>

        <IconButton
          onClick={handleLogout}
          sx={{ border: `1px solid ${COLORS.border}`, bgcolor: COLORS.surface }}
        >
          <LogOut size={18} />
        </IconButton>
      </Stack>
    </Stack>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: COLORS.background }}>
      <MobileTopBar />
      <Box sx={{ display: "flex", minHeight: "100vh", maxWidth: 1600, mx: "auto" }}>
        <AdminSidebar />

        <Box component="main" sx={{ flex: 1, px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 2, sm: 3, lg: 4 } }}>
          <TopBar />
          {children}
        </Box>
      </Box>
    </Box>
  );
}

function AdminRoot() {
  const location = useLocation();
  const isLogin = location.pathname === "/admin/login";

  if (isLogin) return <Outlet />;

  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}

export const Route = createFileRoute("/admin")({
  component: AdminRoot,
});
