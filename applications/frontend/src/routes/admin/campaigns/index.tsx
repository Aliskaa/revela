import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
    ArrowRight,
    CalendarDays,
    ChevronRight,
    ClipboardList,
    Plus,
    Search,
    Sparkles,
    Target,
    Users,
    UserRound,
} from "lucide-react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    LinearProgress,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import { AdminCampaignDrawerForm, CampaignFormValues } from "@/components/admin/AdminCampaignDrawerForm";

export const Route = createFileRoute("/admin/campaigns/")({
    component: AdminCampaignsRoute,
});

const COLORS = {
    blue: "rgb(15,24,152)",
    yellow: "rgb(255,204,0)",
    border: "rgba(15,23,42,0.10)",
};

type CampaignStatus = "active" | "draft" | "closed";

type CampaignRow = {
    name: string;
    company: string;
    coach: string;
    questionnaire: string;
    status: CampaignStatus;
    progress: number;
    updatedAt: string;
    participants: number;
};

const campaigns: CampaignRow[] = [
    {
        name: "Leadership DSJ 2026",
        company: "Ville de Lyon",
        coach: "Claire Martin",
        questionnaire: "B — Comportement",
        status: "active",
        progress: 58,
        updatedAt: "Mise à jour il y a 2 jours",
        participants: 1,
    },
    {
        name: "Pilotage relationnel 2025",
        company: "Ville de Lyon",
        coach: "Claire Martin",
        questionnaire: "F — Ressentis",
        status: "closed",
        progress: 100,
        updatedAt: "Clôturée le 14/12/2025",
        participants: 1,
    },
    {
        name: "Transformation managériale",
        company: "Métropole du Nord",
        coach: "Julien Morel",
        questionnaire: "S — Soi",
        status: "draft",
        progress: 0,
        updatedAt: "Brouillon enregistré hier",
        participants: 0,
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

function StatusChip({ status }: { status: CampaignStatus }) {
    if (status === "active") return <Chip label="Active" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(16,185,129,0.12)", color: "rgb(4,120,87)" }} />;
    if (status === "closed") return <Chip label="Archivée" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(148,163,184,0.16)", color: "rgb(100,116,139)" }} />;
    return <Chip label="Brouillon" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(255,204,0,0.16)", color: "rgb(180,120,0)" }} />;
}

function CampaignRowView({ campaign }: { campaign: CampaignRow }) {
    return (
        <TableRow hover>
            <TableCell>
                <Typography fontWeight={700} color="text.primary">
                    {campaign.name}
                </Typography>
            </TableCell>
            <TableCell>{campaign.company}</TableCell>
            <TableCell>{campaign.coach}</TableCell>
            <TableCell>{campaign.questionnaire}</TableCell>
            <TableCell>{campaign.participants}</TableCell>
            <TableCell>
                <StatusChip status={campaign.status} />
            </TableCell>
            <TableCell>
                <Box sx={{ minWidth: 140 }}>
                    <Typography variant="body2" fontWeight={700} color="text.primary">
                        {campaign.progress}%
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={campaign.progress}
                        sx={{ mt: 1, height: 8, borderRadius: 99, bgcolor: "rgba(15,23,42,0.06)", "& .MuiLinearProgress-bar": { bgcolor: COLORS.blue } }}
                    />
                </Box>
            </TableCell>
            <TableCell>{campaign.updatedAt}</TableCell>
            <TableCell align="right">
                <Button component={Link} to="/admin/campaigns" variant="text" endIcon={<ChevronRight size={16} />} sx={{ textTransform: "none" }}>
                    Détail
                </Button>
            </TableCell>
        </TableRow>
    );
}

function CampaignCard({ campaign }: { campaign: CampaignRow }) {
    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={2}>
                        <Box>
                            <Typography variant="h6" fontWeight={800} color="text.primary">
                                {campaign.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.7 }}>
                                {campaign.company} · Coach {campaign.coach}
                            </Typography>
                        </Box>
                        <StatusChip status={campaign.status} />
                    </Stack>

                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 1.2 }}>
                        <MiniStat label="Questionnaire" value={campaign.questionnaire} />
                        <MiniStat label="Participants" value={String(campaign.participants)} />
                        <MiniStat label="Mis à jour" value={campaign.updatedAt} />
                    </Box>

                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Progression
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={campaign.progress}
                            sx={{ mt: 1, height: 9, borderRadius: 99, bgcolor: "rgba(15,23,42,0.06)", "& .MuiLinearProgress-bar": { bgcolor: COLORS.blue } }}
                        />
                    </Box>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                        <Button variant="contained" disableElevation component={Link} to="/admin/campaigns" startIcon={<ArrowRight size={16} />} sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}>
                            Ouvrir
                        </Button>
                        <Button variant="outlined" sx={{ borderRadius: 3, textTransform: "none" }}>
                            Archiver
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

function AdminCampaignsRoute() {
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const [editingCampaign, setEditingCampaign] = React.useState<CampaignRow | null>(null);

    const handleCreate = () => {
        setEditingCampaign(null);
        setDrawerOpen(true);
    };

    const handleEdit = (campaign: CampaignRow) => {
        setEditingCampaign(campaign);
        setDrawerOpen(true);
    };

    const initialValues: Partial<CampaignFormValues> | undefined = editingCampaign
        ? {
            name: editingCampaign.name,
            company: editingCampaign.company,
            coach: editingCampaign.coach,
            questionnaire: editingCampaign.questionnaire.split(" ")[0],
            startDate: "2026-02-12",
            endDate: "2026-05-12",
            status: editingCampaign.status,
            description: `${editingCampaign.name} · ${editingCampaign.company}`,
        }
        : undefined;
    return (
        <Stack spacing={3}>
            <AdminCampaignDrawerForm
                open={drawerOpen}
                mode={editingCampaign ? "edit" : "create"}
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
                            <Chip label="Campagnes" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, mb: 1.5 }} />
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                Campagnes
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}>
                                Visualisez les campagnes existantes, leur statut et leur progression.
                            </Typography>
                        </Box>

                        <Button onClick={handleCreate} variant="contained" disableElevation startIcon={<Plus size={16} />} sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}>
                            Nouvelle campagne
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
                <StatCard label="Campagnes" value="3" helper="dans le système" icon={ClipboardList} />
                <StatCard label="Actives" value="1" helper="en cours" icon={Target} />
                <StatCard label="Participants" value="2" helper="rattachés" icon={Users} />
                <StatCard label="Questionnaires" value="3" helper="B / F / S" icon={Sparkles} />
            </Box>

            <Card variant="outlined">
                <CardContent sx={{ p: 2.5 }}>
                    <SectionTitle
                        title="Liste des campagnes"
                        subtitle="La table permet de comparer rapidement les campagnes et d’ouvrir leur détail."
                        action={
                            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                <TextField size="small" placeholder="Rechercher une campagne…" sx={{ minWidth: 280 }} />
                            </Box>
                        }
                    />

                    <Box sx={{ display: { xs: "none", lg: "block" }, overflowX: "auto" }}>
                        <Table sx={{ minWidth: 1100 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Campagne</TableCell>
                                    <TableCell>Entreprise</TableCell>
                                    <TableCell>Coach</TableCell>
                                    <TableCell>Questionnaire</TableCell>
                                    <TableCell>Participants</TableCell>
                                    <TableCell>Statut</TableCell>
                                    <TableCell>Progression</TableCell>
                                    <TableCell>Mis à jour</TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {campaigns.map((campaign) => (
                                    <CampaignRowView key={campaign.name} campaign={campaign} />
                                ))}
                            </TableBody>
                        </Table>
                    </Box>

                    <Stack spacing={2} sx={{ display: { xs: "flex", lg: "none" }, mt: 2 }}>
                        {campaigns.map((campaign) => (
                            <CampaignCard key={campaign.name} campaign={campaign} />
                        ))}
                    </Stack>
                </CardContent>
            </Card>

            <Card variant="outlined">
                <CardContent sx={{ p: 2.5 }}>
                    <SectionTitle title="Lecture rapide" subtitle="Les campagnes doivent être pilotées par le questionnaire et l’état de collecte." />
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2, mt: 2 }}>
                        <Card variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                                À surveiller
                            </Typography>
                            <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.4 }}>
                                Les brouillons sans participant
                            </Typography>
                        </Card>
                        <Card variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                                Actif
                            </Typography>
                            <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.4 }}>
                                Les campagnes en collecte
                            </Typography>
                        </Card>
                        <Card variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                                Suivi
                            </Typography>
                            <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.4 }}>
                                Le questionnaire assigné à chaque campagne
                            </Typography>
                        </Card>
                    </Box>
                </CardContent>
            </Card>
        </Stack>
    );
}
