import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
    ArrowRight,
    Building2,
    Mail,
    Trash2,
    UserRound,
    Users,
} from "lucide-react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Skeleton,
    Snackbar,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { ADMIN_COLORS as COLORS } from "@/components/common/colors";
import { SectionTitle } from "@/components/common/SectionTitle";
import { StatCard } from "@/components/common/StatCard";
import { MiniStat } from "@/components/common/MiniStat";
import { useCompanies, useDeleteCompany, useParticipants, useDeleteParticipant } from "@/hooks/admin";
import type { Participant } from "@aor/types";

export const Route = createFileRoute("/admin/companies/$companyId")({
    component: AdminCompanyDetailRoute,
});

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

function AdminCompanyDetailRoute() {
    const { companyId } = Route.useParams();
    const numericId = Number(companyId);
    const navigate = useNavigate();

    const { data: companies = [], isLoading: companiesLoading } = useCompanies();
    const [page, setPage] = React.useState(1);
    const { data: participantsData, isLoading: participantsLoading } = useParticipants(page, numericId);

    const deleteCompany = useDeleteCompany();
    const deleteParticipant = useDeleteParticipant();

    const [deleteCompanyOpen, setDeleteCompanyOpen] = React.useState(false);
    const [deleteParticipantTarget, setDeleteParticipantTarget] = React.useState<Participant | null>(null);
    const [snack, setSnack] = React.useState<string | null>(null);

    const company = companies.find((c) => c.id === numericId);
    const participants = participantsData?.items ?? [];
    const totalPages = participantsData?.pages ?? 1;
    const isLoading = companiesLoading || participantsLoading;

    const handleDeleteCompany = async () => {
        await deleteCompany.mutateAsync({ companyId: numericId });
        setDeleteCompanyOpen(false);
        navigate({ to: "/admin/companies" });
    };

    const handleDeleteParticipant = async () => {
        if (!deleteParticipantTarget) return;
        const result = await deleteParticipant.mutateAsync({ participantId: deleteParticipantTarget.id });
        setSnack(`${deleteParticipantTarget.full_name} supprimé (${result.responses_removed} réponse${result.responses_removed !== 1 ? "s" : ""}, ${result.invite_tokens_removed} invitation${result.invite_tokens_removed !== 1 ? "s" : ""} retirées)`);
        setDeleteParticipantTarget(null);
    };

    if (isLoading && !company) {
        return (
            <Stack spacing={3}>
                <Skeleton variant="rounded" height={140} />
                <Skeleton variant="rounded" height={100} />
                <Skeleton variant="rounded" height={300} />
            </Stack>
        );
    }

    if (!company) {
        return (
            <Card variant="outlined">
                <CardContent sx={{ p: 4, textAlign: "center" }}>
                    <Typography variant="h6" color="text.secondary">Entreprise introuvable.</Typography>
                    <Button component={Link} to="/admin/companies" variant="outlined" sx={{ mt: 2, borderRadius: 3, textTransform: "none" }}>
                        Retour aux entreprises
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Stack spacing={3}>
            <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} message={snack} />

            {/* Delete company dialog */}
            <Dialog open={deleteCompanyOpen} onClose={() => setDeleteCompanyOpen(false)}>
                <DialogTitle>Supprimer l'entreprise</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Vous êtes sur le point de supprimer <strong>{company.name}</strong>.
                        Cette action est irréversible (RGPD). Les participants ne seront pas supprimés mais perdront leur rattachement.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteCompanyOpen(false)} sx={{ textTransform: "none" }}>Annuler</Button>
                    <Button
                        onClick={handleDeleteCompany}
                        color="error"
                        variant="contained"
                        disableElevation
                        disabled={deleteCompany.isPending}
                        sx={{ textTransform: "none" }}
                    >
                        {deleteCompany.isPending ? "Suppression…" : "Confirmer la suppression"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete participant dialog */}
            <Dialog open={!!deleteParticipantTarget} onClose={() => setDeleteParticipantTarget(null)}>
                <DialogTitle>Supprimer le participant</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Vous êtes sur le point de supprimer <strong>{deleteParticipantTarget?.full_name}</strong> ({deleteParticipantTarget?.email}).
                        Toutes ses réponses, scores et invitations seront définitivement effacés (RGPD).
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteParticipantTarget(null)} sx={{ textTransform: "none" }}>Annuler</Button>
                    <Button
                        onClick={handleDeleteParticipant}
                        color="error"
                        variant="contained"
                        disableElevation
                        disabled={deleteParticipant.isPending}
                        sx={{ textTransform: "none" }}
                    >
                        {deleteParticipant.isPending ? "Suppression…" : "Confirmer la suppression"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Header */}
            <Card variant="outlined">
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Stack spacing={2.5} direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ xs: "start", lg: "start" }}>
                        <Box>
                            <Chip label="Détail entreprise" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, mb: 1.5 }} />
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                {company.name}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}>
                                Fiche entreprise avec la liste des collaborateurs rattachés et les actions de gestion.
                            </Typography>
                        </Box>
                        <Button
                            variant="outlined"
                            component={Link}
                            to="/admin/companies"
                            sx={{ borderRadius: 3, textTransform: "none" }}
                        >
                            Retour aux entreprises
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            {/* Stat cards */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
                <StatCard label="Collaborateurs" value={company.participant_count} helper="dans cette entreprise" icon={Users} />
                <StatCard
                    label="Contact"
                    value={company.contact_name ?? "–"}
                    helper={company.contact_email ?? "non renseigné"}
                    icon={Mail}
                />
                <StatCard label="Entreprise" value={company.name} helper={`ID ${company.id}`} icon={Building2} />
            </Box>

            {/* Main content + sidebar */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.25fr 0.75fr" }, gap: 3, alignItems: "start" }}>
                {/* Participants table */}
                <Card variant="outlined">
                    <CardContent sx={{ p: 2.5 }}>
                        <SectionTitle
                            title="Collaborateurs"
                            subtitle={`Les participants rattachés à ${company.name}.`}
                        />

                        <Box sx={{ overflowX: "auto" }}>
                            <Table sx={{ minWidth: 600 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Participant</TableCell>
                                        <TableCell>Réponses</TableCell>
                                        <TableCell>Statut</TableCell>
                                        <TableCell />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {participantsLoading
                                        ? Array.from({ length: 4 }).map((_, i) => (
                                              <TableRow key={i}>
                                                  {Array.from({ length: 4 }).map((__, j) => (
                                                      <TableCell key={j}><Skeleton variant="text" /></TableCell>
                                                  ))}
                                              </TableRow>
                                          ))
                                        : participants.map((p) => (
                                              <TableRow hover key={p.id}>
                                                  <TableCell>
                                                      <Typography fontWeight={700} color="text.primary">{p.full_name}</Typography>
                                                      <Typography variant="caption" color="text.secondary">{p.email}</Typography>
                                                  </TableCell>
                                                  <TableCell>{p.response_count}</TableCell>
                                                  <TableCell>
                                                      <StatusChip participant={p} />
                                                  </TableCell>
                                                  <TableCell align="right">
                                                      <Button
                                                          size="small"
                                                          color="error"
                                                          startIcon={<Trash2 size={14} />}
                                                          onClick={() => setDeleteParticipantTarget(p)}
                                                          sx={{ textTransform: "none" }}
                                                      >
                                                          Supprimer
                                                      </Button>
                                                  </TableCell>
                                              </TableRow>
                                          ))}
                                    {!participantsLoading && participants.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Aucun collaborateur rattaché à cette entreprise.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Box>

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

                {/* Sidebar */}
                <Stack spacing={3}>
                    <Card variant="outlined">
                        <CardContent sx={{ p: 2.5 }}>
                            <SectionTitle title="Informations" subtitle="Détail de l'entreprise." />
                            <Stack spacing={1.2} sx={{ mt: 2 }}>
                                <MiniStat label="Nom" value={company.name} />
                                <MiniStat label="Contact" value={company.contact_name ?? "–"} />
                                <MiniStat label="Email contact" value={company.contact_email ?? "–"} />
                                <MiniStat label="Collaborateurs" value={String(company.participant_count)} />
                            </Stack>
                        </CardContent>
                    </Card>

                    <Card variant="outlined" sx={{ borderColor: "rgba(239,68,68,0.3)" }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <SectionTitle title="Zone dangereuse" subtitle="Actions irréversibles — RGPD." />
                            <Button
                                variant="outlined"
                                color="error"
                                fullWidth
                                startIcon={<Trash2 size={16} />}
                                disabled={deleteCompany.isPending}
                                onClick={() => setDeleteCompanyOpen(true)}
                                sx={{ borderRadius: 3, textTransform: "none", mt: 1 }}
                            >
                                Supprimer l'entreprise
                            </Button>
                            {deleteCompany.isError && (
                                <Alert severity="error" sx={{ mt: 1.5 }}>
                                    Erreur lors de la suppression.
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </Stack>
            </Box>
        </Stack>
    );
}
