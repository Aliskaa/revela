import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Building2, Mail, Plus, Users } from "lucide-react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import { AdminParticipantDrawerForm } from "@/components/admin/AdminParticipantDrawerForm";
import { ADMIN_COLORS as COLORS } from "@/components/common/colors";
import { SectionTitle } from "@/components/common/SectionTitle";
import { StatCard } from "@/components/common/StatCard";
import { MiniStat } from "@/components/common/MiniStat";
import { useAdminDashboard, useCompanies, useParticipants } from "@/hooks/admin";
import type { Participant } from "@aor/types";

export const Route = createFileRoute("/admin/participants/")({
    component: AdminParticipantsRoute,
});

const QUESTIONNAIRE_LABELS: Record<string, string> = {
    B: "B",
    F: "F",
    S: "S",
};

function getStatus(p: Participant): "active" | "invited" | "new" {
    if (p.response_count > 0) return "active";
    if (Object.keys(p.invite_status).length > 0) return "invited";
    return "new";
}

function StatusChip({ participant }: { participant: Participant }) {
    const status = getStatus(participant);
    if (status === "active")
        return <Chip label="Actif" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(16,185,129,0.12)", color: "rgb(4,120,87)" }} />;
    if (status === "invited")
        return <Chip label="Invité" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(255,204,0,0.16)", color: "rgb(180,120,0)" }} />;
    return <Chip label="Nouveau" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(148,163,184,0.16)", color: "rgb(100,116,139)" }} />;
}

function InviteBadges({ inviteStatus }: { inviteStatus: Record<string, string> }) {
    const keys = Object.keys(inviteStatus);
    if (keys.length === 0)
        return <Typography variant="caption" color="text.secondary">—</Typography>;
    return (
        <Stack direction="row" spacing={0.5} flexWrap="wrap">
            {keys.map((k) => (
                <Chip
                    key={k}
                    label={QUESTIONNAIRE_LABELS[k] ?? k}
                    size="small"
                    sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, fontSize: 11 }}
                />
            ))}
        </Stack>
    );
}

function AdminParticipantsRoute() {
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const [page, setPage] = React.useState(1);
    const [search, setSearch] = React.useState("");
    const [companyFilter, setCompanyFilter] = React.useState<number | "">("");

    const { data, isLoading } = useParticipants(page, companyFilter || undefined);
    const { data: companies = [] } = useCompanies();
    const { data: dashboard } = useAdminDashboard();

    const participants = data?.items ?? [];
    const totalPages = data?.pages ?? 1;

    const activeCount = participants.filter((p) => p.response_count > 0).length;
    const invitedCount = participants.filter(
        (p) => Object.keys(p.invite_status).length > 0 && p.response_count === 0
    ).length;

    const filtered = search.trim()
        ? participants.filter(
              (p) =>
                  p.full_name.toLowerCase().includes(search.toLowerCase()) ||
                  p.email.toLowerCase().includes(search.toLowerCase()) ||
                  (p.company?.name ?? "").toLowerCase().includes(search.toLowerCase())
          )
        : participants;

    return (
        <Stack spacing={3}>
            <AdminParticipantDrawerForm
                open={drawerOpen}
                mode="create"
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
                            <Chip label="Participants" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, mb: 1.5 }} />
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                Participants
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}>
                                Gestion des participants, de leurs invitations et de leur statut de collecte.
                            </Typography>
                        </Box>
                        <Button
                            onClick={() => setDrawerOpen(true)}
                            variant="contained"
                            disableElevation
                            startIcon={<Plus size={16} />}
                            sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}
                        >
                            Ajouter un participant
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
                <StatCard label="Participants" value={data?.total ?? "–"} helper="dans le système" icon={Users} loading={isLoading} />
                <StatCard label="Avec réponses" value={activeCount} helper="sur cette page" icon={BadgeCheck} loading={isLoading} />
                <StatCard label="En attente" value={invitedCount} helper="invitation envoyée" icon={Mail} loading={isLoading} />
                <StatCard label="Entreprises" value={dashboard?.total_companies ?? "–"} helper="référencées" icon={Building2} />
            </Box>

            <Card variant="outlined">
                <CardContent sx={{ p: 2.5 }}>
                    <SectionTitle
                        title="Liste des participants"
                        subtitle="Rechercher et consulter les participants et leurs invitations."
                        action={
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                                <FormControl size="small" sx={{ minWidth: 180 }}>
                                    <InputLabel>Entreprise</InputLabel>
                                    <Select
                                        label="Entreprise"
                                        value={companyFilter}
                                        onChange={(e) => {
                                            setCompanyFilter(e.target.value as number | "");
                                            setPage(1);
                                        }}
                                    >
                                        <MenuItem value="">Toutes</MenuItem>
                                        {companies.map((c) => (
                                            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <TextField
                                    size="small"
                                    placeholder="Rechercher…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    sx={{ minWidth: 220 }}
                                />
                            </Stack>
                        }
                    />

                    {/* Desktop table */}
                    <Box sx={{ display: { xs: "none", lg: "block" }, overflowX: "auto" }}>
                        <Table sx={{ minWidth: 800 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Participant</TableCell>
                                    <TableCell>Entreprise</TableCell>
                                    <TableCell>Questionnaires</TableCell>
                                    <TableCell>Réponses</TableCell>
                                    <TableCell>Statut</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading
                                    ? Array.from({ length: 5 }).map((_, i) => (
                                          <TableRow key={i}>
                                              {Array.from({ length: 5 }).map((__, j) => (
                                                  <TableCell key={j}><Skeleton variant="text" /></TableCell>
                                              ))}
                                          </TableRow>
                                      ))
                                    : filtered.map((participant) => (
                                          <TableRow hover key={participant.id}>
                                              <TableCell>
                                                  <Typography fontWeight={700} color="text.primary">
                                                      {participant.full_name}
                                                  </Typography>
                                                  <Typography variant="caption" color="text.secondary">
                                                      {participant.email}
                                                  </Typography>
                                              </TableCell>
                                              <TableCell>{participant.company?.name ?? "–"}</TableCell>
                                              <TableCell>
                                                  <InviteBadges inviteStatus={participant.invite_status} />
                                              </TableCell>
                                              <TableCell>{participant.response_count}</TableCell>
                                              <TableCell>
                                                  <StatusChip participant={participant} />
                                              </TableCell>
                                          </TableRow>
                                      ))}
                                {!isLoading && filtered.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {search
                                                    ? "Aucun participant ne correspond à la recherche."
                                                    : "Aucun participant pour le moment."}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Box>

                    {/* Mobile cards */}
                    <Stack spacing={2} sx={{ display: { xs: "flex", lg: "none" }, mt: 2 }}>
                        {isLoading
                            ? Array.from({ length: 3 }).map((_, i) => (
                                  <Skeleton key={i} variant="rounded" height={160} />
                              ))
                            : filtered.map((participant) => (
                                  <Card variant="outlined" key={participant.id}>
                                      <CardContent sx={{ p: 2.5 }}>
                                          <Stack spacing={1.8}>
                                              <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={2}>
                                                  <Box>
                                                      <Typography variant="h6" fontWeight={800} color="text.primary">
                                                          {participant.full_name}
                                                      </Typography>
                                                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                                                          {participant.email}
                                                      </Typography>
                                                  </Box>
                                                  <StatusChip participant={participant} />
                                              </Stack>
                                              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.2 }}>
                                                  <MiniStat label="Entreprise" value={participant.company?.name ?? "–"} />
                                                  <MiniStat label="Réponses" value={String(participant.response_count)} />
                                              </Box>
                                          </Stack>
                                      </CardContent>
                                  </Card>
                              ))}
                    </Stack>

                    {totalPages > 1 && (
                        <Stack direction="row" justifyContent="center" alignItems="center" spacing={1.5} sx={{ mt: 2.5 }}>
                            <Button
                                variant="outlined"
                                size="small"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                                sx={{ borderRadius: 3, textTransform: "none" }}
                            >
                                Précédent
                            </Button>
                            <Typography variant="body2" color="text.secondary">
                                Page {page} / {totalPages}
                            </Typography>
                            <Button
                                variant="outlined"
                                size="small"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                sx={{ borderRadius: 3, textTransform: "none" }}
                            >
                                Suivant
                            </Button>
                        </Stack>
                    )}
                </CardContent>
            </Card>
        </Stack>
    );
}
