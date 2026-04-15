import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
    ArrowRight,
    BadgeCheck,
    Building2,
    ClipboardList,
    Mail,
    Search,
    Sparkles,
    Users,
    UserRound,
    Plus,
} from "lucide-react";
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
import { AdminParticipantDrawerForm, ParticipantFormValues } from "@/components/admin/AdminParticipantDrawerForm";

export const Route = createFileRoute("/admin/participants/")({
    component: AdminParticipantsRoute,
});

const COLORS = {
    blue: "rgb(15,24,152)",
    yellow: "rgb(255,204,0)",
    border: "rgba(15,23,42,0.10)",
};

type ParticipantStatus = "active" | "pending" | "archived";

type ParticipantRow = {
    name: string;
    email: string;
    company: string;
    campaign: string;
    coach: string;
    status: ParticipantStatus;
    lastActivity: string;
};

const participants: ParticipantRow[] = [
    {
        name: "Thomas Dubois",
        email: "thomas.dubois@ville-lyon.fr",
        company: "Ville de Lyon",
        campaign: "Leadership DSJ 2026",
        coach: "Claire Martin",
        status: "active",
        lastActivity: "Auto terminée · pairs en cours",
    },
    {
        name: "Marie Dupont",
        email: "marie.dupont@ville-lyon.fr",
        company: "Ville de Lyon",
        campaign: "Pilotage relationnel 2025",
        coach: "Claire Martin",
        status: "archived",
        lastActivity: "Campagne terminée",
    },
    {
        name: "Paul Martin",
        email: "paul.martin@ville-lyon.fr",
        company: "Métropole du Nord",
        campaign: "Transformation managériale",
        coach: "Julien Morel",
        status: "pending",
        lastActivity: "Invitation envoyée hier",
    },
];

function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
    return (
        <Stack direction="row" alignItems="start" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
            <Box>
                <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.4 }}>
                    {title}
                </Typography>
                {subtitle ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.7, lineHeight: 1.7 }}>
                        {subtitle}
                    </Typography>
                ) : null}
            </Box>
            {action}
        </Stack>
    );
}

function StatCard({ label, value, helper, icon: Icon }: { label: string; value: string; helper: string; icon: React.ElementType }) {
    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="end">
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            {label}
                        </Typography>
                        <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ mt: 0.4, letterSpacing: -0.5 }}>
                            {value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {helper}
                        </Typography>
                    </Box>
                    <Box sx={{ width: 42, height: 42, borderRadius: 3, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, display: "grid", placeItems: "center" }}>
                        <Icon size={18} />
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}

function StatusChip({ status }: { status: ParticipantStatus }) {
    if (status === "active") return <Chip label="Actif" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(16,185,129,0.12)", color: "rgb(4,120,87)" }} />;
    if (status === "pending") return <Chip label="En attente" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(255,204,0,0.16)", color: "rgb(180,120,0)" }} />;
    return <Chip label="Archivé" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(148,163,184,0.16)", color: "rgb(100,116,139)" }} />;
}

function ParticipantRowView({ participant }: { participant: ParticipantRow }) {
    return (
        <TableRow hover>
            <TableCell>
                <Typography fontWeight={700} color="text.primary">
                    {participant.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {participant.email}
                </Typography>
            </TableCell>
            <TableCell>{participant.company}</TableCell>
            <TableCell>{participant.campaign}</TableCell>
            <TableCell>{participant.coach}</TableCell>
            <TableCell>
                <StatusChip status={participant.status} />
            </TableCell>
            <TableCell>{participant.lastActivity}</TableCell>
            <TableCell align="right">
                <Button component={Link} to="/admin/campaigns/camp-2026-lyon" variant="text" endIcon={<ArrowRight size={16} />} sx={{ textTransform: "none" }}>
                    Détail
                </Button>
            </TableCell>
        </TableRow>
    );
}

function ParticipantCard({ participant }: { participant: ParticipantRow }) {
    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={1.8}>
                    <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={2}>
                        <Box>
                            <Typography variant="h6" fontWeight={800} color="text.primary">
                                {participant.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                                {participant.email}
                            </Typography>
                        </Box>
                        <StatusChip status={participant.status} />
                    </Stack>

                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 1.2 }}>
                        <MiniStat label="Entreprise" value={participant.company} />
                        <MiniStat label="Coach" value={participant.coach} />
                        <MiniStat label="Campagne" value={participant.campaign} />
                        <MiniStat label="Activité" value={participant.lastActivity} />
                    </Box>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                        <Button variant="contained" disableElevation component={Link} to="/admin/campaigns/camp-2026-lyon" startIcon={<ArrowRight size={16} />} sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}>
                            Ouvrir
                        </Button>
                        <Button variant="outlined" startIcon={<Mail size={16} />} sx={{ borderRadius: 3, textTransform: "none" }}>
                            Relancer
                        </Button>
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
}

function MiniStat({ label, value }: { label: string; value: string }) {
    return (
        <Box sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 4, p: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
                {label}
            </Typography>
            <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.25, lineHeight: 1.6 }}>
                {value}
            </Typography>
        </Box>
    );
}

function AdminParticipantsRoute() {
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const [editingParticipant, setEditingParticipant] = React.useState<ParticipantRow | null>(null);

    const handleCreate = () => {
        setEditingParticipant(null);
        setDrawerOpen(true);
    };

    const handleEdit = (participant: ParticipantRow) => {
        setEditingParticipant(participant);
        setDrawerOpen(true);
    };

    const initialValues: Partial<ParticipantFormValues> | undefined = editingParticipant
        ? {
            firstName: editingParticipant.name.split(" ")[0] ?? "",
            lastName: editingParticipant.name.split(" ").slice(1).join(" ") ?? "",
            email: editingParticipant.email,
            company: editingParticipant.company,
            campaign: editingParticipant.campaign,
            coach: editingParticipant.coach,
            status: editingParticipant.status,
        }
        : undefined;
    return (
        <Stack spacing={3}>
            <AdminParticipantDrawerForm
                open={drawerOpen}
                mode={editingParticipant ? "edit" : "create"}
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
                            <Chip label="Participants" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, mb: 1.5 }} />
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                Participants
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}>
                                Gestion des participants, de leurs campagnes rattachées et de leur statut de collecte.
                            </Typography>
                        </Box>

                        <Button onClick={handleCreate} variant="contained" disableElevation startIcon={<Plus size={16} />} sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}>
                            Ajouter un participant
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
                <StatCard label="Participants" value="3" helper="dans le système" icon={Users} />
                <StatCard label="Actifs" value="1" helper="en campagne" icon={BadgeCheck} />
                <StatCard label="En attente" value="1" helper="invitation envoyée" icon={Mail} />
                <StatCard label="Campagnes" value="3" helper="rattachées" icon={ClipboardList} />
            </Box>

            <Card variant="outlined">
                <CardContent sx={{ p: 2.5 }}>
                    <SectionTitle
                        title="Liste des participants"
                        subtitle="Rechercher, relancer et ouvrir la campagne liée."
                        action={
                            <Box sx={{ minWidth: 300 }}>
                                <TextField fullWidth size="small" placeholder="Rechercher un participant…" />
                            </Box>
                        }
                    />

                    <Box sx={{ display: { xs: "none", lg: "block" }, overflowX: "auto" }}>
                        <Table sx={{ minWidth: 1100 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Participant</TableCell>
                                    <TableCell>Entreprise</TableCell>
                                    <TableCell>Campagne</TableCell>
                                    <TableCell>Coach</TableCell>
                                    <TableCell>Statut</TableCell>
                                    <TableCell>Dernière activité</TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {participants.map((participant) => (
                                    <ParticipantRowView key={participant.email} participant={participant} />
                                ))}
                            </TableBody>
                        </Table>
                    </Box>

                    <Stack spacing={2} sx={{ display: { xs: "flex", lg: "none" }, mt: 2 }}>
                        {participants.map((participant) => (
                            <ParticipantCard key={participant.email} participant={participant} />
                        ))}
                    </Stack>
                </CardContent>
            </Card>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.2fr 0.8fr" }, gap: 3, alignItems: "start" }}>
                <Card variant="outlined">
                    <CardContent sx={{ p: 2.5 }}>
                        <SectionTitle title="Raccourcis" subtitle="Accès rapide aux actions les plus fréquentes." />
                        <Stack spacing={1.2} sx={{ mt: 2 }}>
                            <Button variant="outlined" startIcon={<Mail size={16} />} sx={{ justifyContent: "space-between", borderRadius: 3, textTransform: "none" }}>
                                Relancer les invitations
                            </Button>
                            <Button variant="outlined" startIcon={<Building2 size={16} />} sx={{ justifyContent: "space-between", borderRadius: 3, textTransform: "none" }}>
                                Filtrer par entreprise
                            </Button>
                            <Button variant="outlined" startIcon={<Sparkles size={16} />} sx={{ justifyContent: "space-between", borderRadius: 3, textTransform: "none" }}>
                                Voir les participants actifs
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>

                <Card variant="outlined">
                    <CardContent sx={{ p: 2.5 }}>
                        <SectionTitle title="Lecture rapide" subtitle="Ce que cette page doit apporter à l’admin." />
                        <Box sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 4, p: 2, mt: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                                Un participant doit toujours être relié à une campagne claire, avec le statut de collecte visible, et un moyen simple de relance.
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Stack>
    );
}
