import { AdminCoachDrawerForm, CoachFormValues } from "@/components/admin/AdminCoachDrawerForm";
import { ADMIN_COLORS as COLORS } from "@/components/common/colors";
import { SectionTitle } from "@/components/common/SectionTitle";
import { StatCard } from "@/components/common/StatCard";
import { MiniStat } from "@/components/common/MiniStat";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
    ArrowRight,
    BadgeCheck,
    ClipboardList,
    Mail,
    Plus,
    Sparkles,
    UserRound,
    Users
} from "lucide-react";
import * as React from "react";

export const Route = createFileRoute("/admin/coaches/")({
  component: AdminCoachesRoute,
});


type CoachStatus = "active" | "inactive";

type CoachRow = {
  name: string;
  company: string;
  email: string;
  campaigns: number;
  participants: number;
  status: CoachStatus;
  updatedAt: string;
};

const coaches: CoachRow[] = [
  {
    name: "Claire Martin",
    company: "AOR Conseil",
    email: "claire.martin@aor-conseil.fr",
    campaigns: 2,
    participants: 2,
    status: "active",
    updatedAt: "Mis à jour il y a 2 jours",
  },
  {
    name: "Julien Morel",
    company: "AOR Conseil",
    email: "julien.morel@aor-conseil.fr",
    campaigns: 1,
    participants: 1,
    status: "active",
    updatedAt: "Mis à jour hier",
  },
  {
    name: "Sophie Laurent",
    company: "AOR Conseil",
    email: "sophie.laurent@aor-conseil.fr",
    campaigns: 0,
    participants: 0,
    status: "inactive",
    updatedAt: "Créée la semaine dernière",
  },
];


function StatusChip({ status }: { status: CoachStatus }) {
  if (status === "active") return <Chip label="Actif" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(16,185,129,0.12)", color: "rgb(4,120,87)" }} />;
  return <Chip label="Inactif" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(148,163,184,0.16)", color: "rgb(100,116,139)" }} />;
}

function CoachRowView({ coach }: { coach: CoachRow }) {
  return (
    <TableRow hover>
      <TableCell>
        <Typography fontWeight={700} color="text.primary">
          {coach.name}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography fontWeight={600} color="text.primary">
          {coach.company}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {coach.email}
        </Typography>
      </TableCell>
      <TableCell>{coach.campaigns}</TableCell>
      <TableCell>{coach.participants}</TableCell>
      <TableCell>
        <StatusChip status={coach.status} />
      </TableCell>
      <TableCell>{coach.updatedAt}</TableCell>
      <TableCell align="right">
        <Button component={Link} to="/admin/campaigns/camp-2026-lyon" variant="text" endIcon={<ArrowRight size={16} />} sx={{ textTransform: "none" }}>
          Ouvrir
        </Button>
      </TableCell>
    </TableRow>
  );
}

function CoachCard({ coach }: { coach: CoachRow }) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={1.8}>
          <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={2}>
            <Box>
              <Typography variant="h6" fontWeight={800} color="text.primary">
                {coach.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                {coach.company}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {coach.email}
              </Typography>
            </Box>
            <StatusChip status={coach.status} />
          </Stack>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 1.2 }}>
            <MiniStat label="Campagnes" value={String(coach.campaigns)} />
            <MiniStat label="Participants" value={String(coach.participants)} />
            <MiniStat label="Maj" value={coach.updatedAt} />
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
            <Button variant="contained" disableElevation component={Link} to="/admin/campaigns/camp-2026-lyon" startIcon={<ArrowRight size={16} />} sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}>
              Ouvrir
            </Button>
            <Button variant="outlined" sx={{ borderRadius: 3, textTransform: "none" }}>
              Éditer
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}


function AdminCoachesRoute() {
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const [editingCoach, setEditingCoach] = React.useState<CoachRow | null>(null);
  
    const handleCreate = () => {
      setEditingCoach(null);
      setDrawerOpen(true);
    };
  
    const initialValues: Partial<CoachFormValues> | undefined = editingCoach
      ? {
          firstName: editingCoach.name.split(" ")[0] ?? "",
          lastName: editingCoach.name.split(" ").slice(1).join(" ") ?? "",
          email: editingCoach.email,
          company: editingCoach.company,
          campaigns: editingCoach.campaigns,
          participants: editingCoach.participants,
          status: editingCoach.status,
          notes: `${editingCoach.name} · ${editingCoach.updatedAt}`,
        }
      : undefined;
  return (
    <Stack spacing={3}>
      <AdminCoachDrawerForm
        open={drawerOpen}
        mode={editingCoach ? "edit" : "create"}
        initialValues={initialValues}
        onClose={() => setDrawerOpen(false)}
        onSubmit={(values) => {
          console.log(values);
          setDrawerOpen(false);
        }}
      />
      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack spacing={2.5} direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ xs: "start", lg: "start" }}>
            <Box>
              <Chip label="Coachs" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, mb: 1.5 }} />
              <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                Coachs
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}>
                Référentiel des coachs et des campagnes qui leur sont associées.
              </Typography>
            </Box>

            <Button onClick={handleCreate} variant="contained" disableElevation startIcon={<Plus size={16} />} sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}>
              Ajouter un coach
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
        <StatCard label="Coachs" value="3" helper="référencés" icon={UserRound} />
        <StatCard label="Actifs" value="2" helper="en campagne" icon={BadgeCheck} />
        <StatCard label="Campagnes" value="3" helper="attribuées" icon={ClipboardList} />
        <StatCard label="Participants" value="3" helper="suivis" icon={Users} />
      </Box>

      <Card variant="outlined">
        <CardContent sx={{ p: 2.5 }}>
          <SectionTitle
            title="Liste des coachs"
            subtitle="Recherche rapide et accès au détail des campagnes suivies."
            action={<TextField size="small" placeholder="Rechercher un coach…" sx={{ minWidth: 300 }} />}
          />

          <Box sx={{ display: { xs: "none", lg: "block" }, overflowX: "auto" }}>
            <Table sx={{ minWidth: 1100 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Coach</TableCell>
                  <TableCell>Organisation</TableCell>
                  <TableCell>Campagnes</TableCell>
                  <TableCell>Participants</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Mis à jour</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {coaches.map((coach) => (
                  <CoachRowView key={coach.email} coach={coach} />
                ))}
              </TableBody>
            </Table>
          </Box>

          <Stack spacing={2} sx={{ display: { xs: "flex", lg: "none" }, mt: 2 }}>
            {coaches.map((coach) => (
              <CoachCard key={coach.email} coach={coach} />
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.2fr 0.8fr" }, gap: 3, alignItems: "start" }}>
        <Card variant="outlined">
          <CardContent sx={{ p: 2.5 }}>
            <SectionTitle title="Raccourcis" subtitle="Les actions les plus fréquentes." />
            <Stack spacing={1.2} sx={{ mt: 2 }}>
              <Button variant="outlined" startIcon={<Mail size={16} />} sx={{ justifyContent: "space-between", borderRadius: 3, textTransform: "none" }}>
                Relancer un coach
              </Button>
              <Button variant="outlined" startIcon={<ClipboardList size={16} />} sx={{ justifyContent: "space-between", borderRadius: 3, textTransform: "none" }}>
                Voir les campagnes associées
              </Button>
              <Button variant="outlined" startIcon={<Sparkles size={16} />} sx={{ justifyContent: "space-between", borderRadius: 3, textTransform: "none" }}>
                Voir les participants suivis
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent sx={{ p: 2.5 }}>
            <SectionTitle title="Lecture rapide" subtitle="Ce que cette page doit aider à piloter." />
            <Box sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 4, p: 2, mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Un coach doit toujours être relié à ses campagnes, à ses participants et à son périmètre d’intervention.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Stack>
  );
}
