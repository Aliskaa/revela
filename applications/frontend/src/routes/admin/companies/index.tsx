import { AdminCompanyDrawerForm, CompanyFormValues } from "@/components/admin/AdminCompanyDrawerForm";
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
    Building2,
    CalendarDays,
    ClipboardList,
    Mail,
    Plus,
    Sparkles,
    Users
} from "lucide-react";
import * as React from "react";

export const Route = createFileRoute("/admin/companies/")({
    component: AdminCompaniesRoute,
});


type CompanyRow = {
    name: string;
    contact: string;
    email: string;
    campaigns: number;
    participants: number;
    status: "active" | "inactive";
    updatedAt: string;
};

const companies: CompanyRow[] = [
    {
        name: "Ville de Lyon",
        contact: "Sophie Bernard",
        email: "sophie.bernard@ville-lyon.fr",
        campaigns: 2,
        participants: 2,
        status: "active",
        updatedAt: "Mis à jour il y a 2 jours",
    },
    {
        name: "Métropole du Nord",
        contact: "Hugo Martin",
        email: "hugo.martin@metropole-nord.fr",
        campaigns: 1,
        participants: 1,
        status: "active",
        updatedAt: "Mis à jour hier",
    },
    {
        name: "Cabinet AOR Test",
        contact: "Laura Petit",
        email: "laura.petit@aor.fr",
        campaigns: 0,
        participants: 0,
        status: "inactive",
        updatedAt: "Créé la semaine dernière",
    },
];


function StatusChip({ status }: { status: CompanyRow["status"] }) {
    if (status === "active") return <Chip label="Active" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(16,185,129,0.12)", color: "rgb(4,120,87)" }} />;
    return <Chip label="Inactif" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(148,163,184,0.16)", color: "rgb(100,116,139)" }} />;
}

function CompanyRowView({ company }: { company: CompanyRow }) {
    return (
        <TableRow hover>
            <TableCell>
                <Typography fontWeight={700} color="text.primary">
                    {company.name}
                </Typography>
            </TableCell>
            <TableCell>
                <Typography fontWeight={600} color="text.primary">
                    {company.contact}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {company.email}
                </Typography>
            </TableCell>
            <TableCell>{company.campaigns}</TableCell>
            <TableCell>{company.participants}</TableCell>
            <TableCell>
                <StatusChip status={company.status} />
            </TableCell>
            <TableCell>{company.updatedAt}</TableCell>
            <TableCell align="right">
                <Button component={Link} to="/admin/campaigns/camp-2026-lyon" variant="text" endIcon={<ArrowRight size={16} />} sx={{ textTransform: "none" }}>
                    Ouvrir
                </Button>
            </TableCell>
        </TableRow>
    );
}

function CompanyCard({ company }: { company: CompanyRow }) {
    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={1.8}>
                    <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={2}>
                        <Box>
                            <Typography variant="h6" fontWeight={800} color="text.primary">
                                {company.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                                {company.contact}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {company.email}
                            </Typography>
                        </Box>
                        <StatusChip status={company.status} />
                    </Stack>

                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 1.2 }}>
                        <MiniStat label="Campagnes" value={String(company.campaigns)} />
                        <MiniStat label="Participants" value={String(company.participants)} />
                        <MiniStat label="Maj" value={company.updatedAt} />
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


function AdminCompaniesRoute() {
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const [editingCompany, setEditingCompany] = React.useState<CompanyRow | null>(null);

    const handleCreate = () => {
        setEditingCompany(null);
        setDrawerOpen(true);
    };

    const initialValues: Partial<CompanyFormValues> | undefined = editingCompany
        ? {
            name: editingCompany.name,
            contactName: editingCompany.contact,
            contactEmail: editingCompany.email,
            campaignCount: editingCompany.campaigns,
            participantCount: editingCompany.participants,
            status: editingCompany.status,
            notes: `${editingCompany.name} · ${editingCompany.updatedAt}`,
        }
        : undefined;
    return (
        <Stack spacing={3}>
            <AdminCompanyDrawerForm
                open={drawerOpen}
                mode={editingCompany ? "edit" : "create"}
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
                            <Chip label="Entreprises" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, mb: 1.5 }} />
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                Entreprises
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}>
                                Référentiel des entreprises clientes, avec leurs campagnes, leurs participants et leurs contacts.
                            </Typography>
                        </Box>

                        <Button onClick={handleCreate} variant="contained" disableElevation startIcon={<Plus size={16} />} sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}>
                            Ajouter une entreprise
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
                <StatCard label="Entreprises" value="3" helper="référencées" icon={Building2} />
                <StatCard label="Actives" value="2" helper="en campagne" icon={BadgeCheck} />
                <StatCard label="Campagnes" value="3" helper="rattachées" icon={ClipboardList} />
                <StatCard label="Participants" value="3" helper="connectés" icon={Users} />
            </Box>

            <Card variant="outlined">
                <CardContent sx={{ p: 2.5 }}>
                    <SectionTitle
                        title="Liste des entreprises"
                        subtitle="Recherche rapide et accès au détail des campagnes associées."
                        action={<TextField size="small" placeholder="Rechercher une entreprise…" sx={{ minWidth: 300 }} />}
                    />

                    <Box sx={{ display: { xs: "none", lg: "block" }, overflowX: "auto" }}>
                        <Table sx={{ minWidth: 1100 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Entreprise</TableCell>
                                    <TableCell>Contact</TableCell>
                                    <TableCell>Campagnes</TableCell>
                                    <TableCell>Participants</TableCell>
                                    <TableCell>Statut</TableCell>
                                    <TableCell>Mis à jour</TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {companies.map((company) => (
                                    <CompanyRowView key={company.name} company={company} />
                                ))}
                            </TableBody>
                        </Table>
                    </Box>

                    <Stack spacing={2} sx={{ display: { xs: "flex", lg: "none" }, mt: 2 }}>
                        {companies.map((company) => (
                            <CompanyCard key={company.name} company={company} />
                        ))}
                    </Stack>
                </CardContent>
            </Card>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.2fr 0.8fr" }, gap: 3, alignItems: "start" }}>
                <Card variant="outlined">
                    <CardContent sx={{ p: 2.5 }}>
                        <SectionTitle title="Lecture rapide" subtitle="Ce que cette page doit aider à piloter." />
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2, mt: 2 }}>
                            <Card variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Priorité
                                </Typography>
                                <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.4 }}>
                                    Les entreprises en campagne active
                                </Typography>
                            </Card>
                            <Card variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Suivi
                                </Typography>
                                <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.4 }}>
                                    Le nombre de participants rattachés
                                </Typography>
                            </Card>
                            <Card variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Action
                                </Typography>
                                <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.4 }}>
                                    Ouvrir la campagne liée
                                </Typography>
                            </Card>
                        </Box>
                    </CardContent>
                </Card>

                <Card variant="outlined">
                    <CardContent sx={{ p: 2.5 }}>
                        <SectionTitle title="Accès rapides" subtitle="Les actions les plus utiles." />
                        <Stack spacing={1.2} sx={{ mt: 2 }}>
                            <Button variant="outlined" startIcon={<CalendarDays size={16} />} sx={{ justifyContent: "space-between", borderRadius: 3, textTransform: "none" }}>
                                Voir les campagnes de l’entreprise
                            </Button>
                            <Button variant="outlined" startIcon={<Mail size={16} />} sx={{ justifyContent: "space-between", borderRadius: 3, textTransform: "none" }}>
                                Relancer un contact
                            </Button>
                            <Button variant="outlined" startIcon={<Sparkles size={16} />} sx={{ justifyContent: "space-between", borderRadius: 3, textTransform: "none" }}>
                                Voir les participants actifs
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Box>
        </Stack>
    );
}
