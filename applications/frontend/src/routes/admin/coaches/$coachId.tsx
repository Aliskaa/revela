import { AdminCoachDrawerForm } from '@/components/admin/AdminCoachDrawerForm';
import { SectionTitle } from '@/components/common/SectionTitle';
import { StatCard } from '@/components/common/cards';
import { ActiveStatusChip, CampaignStatusChip } from '@/components/common/chips';
import { useAdminCoach, useCompanies, useDeleteCoach, useUpdateCoach } from '@/hooks/admin';
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
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowRight, ClipboardList, Pencil, Trash2, UserRound } from 'lucide-react';
import * as React from 'react';

export const Route = createFileRoute('/admin/coaches/$coachId')({
    component: AdminCoachDetailRoute,
});

function AdminCoachDetailRoute() {
    const { coachId } = Route.useParams();
    const numericId = Number(coachId);
    const navigate = useNavigate();

    const { data, isLoading, isError } = useAdminCoach(numericId);
    const { data: companies = [] } = useCompanies();
    const updateCoach = useUpdateCoach();
    const deleteCoach = useDeleteCoach();

    const [editOpen, setEditOpen] = React.useState(false);
    const [deleteOpen, setDeleteOpen] = React.useState(false);

    const coach = data?.coach;
    const campaigns = data?.campaigns ?? [];

    const companyNameById = React.useMemo(() => {
        const m = new Map<number, string>();
        for (const c of companies) m.set(c.id, c.name);
        return m;
    }, [companies]);

    const handleDeleteCoach = async () => {
        try {
            await deleteCoach.mutateAsync({ coachId: numericId });
            setDeleteOpen(false);
            navigate({ to: '/admin/coaches' });
        } catch {
            // Toast émis par le hook ; on garde le dialog ouvert.
        }
    };

    if (isLoading && !coach) {
        return (
            <Stack spacing={3}>
                <Skeleton variant="rounded" height={140} />
                <Skeleton variant="rounded" height={100} />
                <Skeleton variant="rounded" height={300} />
            </Stack>
        );
    }

    if (isError || !coach) {
        return (
            <Card variant="outlined">
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                        Coach introuvable.
                    </Typography>
                    <Button component={Link} to="/admin/coaches" variant="outlined" sx={{ mt: 2, borderRadius: 3 }}>
                        Retour aux coachs
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const archivedCampaigns = campaigns.filter(c => c.status === 'archived').length;

    return (
        <Stack spacing={3}>
            <AdminCoachDrawerForm
                open={editOpen}
                mode="edit"
                isSubmitting={updateCoach.isPending}
                initialValues={{
                    displayName: coach.displayName,
                    username: coach.username,
                    isActive: coach.isActive,
                }}
                onClose={() => {
                    setEditOpen(false);
                    updateCoach.reset();
                }}
                onSubmit={async values => {
                    try {
                        await updateCoach.mutateAsync({
                            coachId: numericId,
                            displayName: values.displayName,
                            username: values.username,
                            password: values.password.length > 0 ? values.password : undefined,
                            isActive: values.isActive,
                        });
                        setEditOpen(false);
                    } catch {
                        // Toast émis par le hook ; on garde le drawer ouvert.
                    }
                }}
            />

            <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
                <DialogTitle>Supprimer le coach</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Vous êtes sur le point de supprimer <strong>{coach.displayName}</strong> ({coach.username}). Ses
                        campagnes ne seront pas supprimées mais devront être réaffectées à un autre coach. Cette action
                        est irréversible.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteOpen(false)}>Annuler</Button>
                    <Button
                        onClick={handleDeleteCoach}
                        color="error"
                        variant="contained"
                        disableElevation
                        disabled={deleteCoach.isPending}
                    >
                        {deleteCoach.isPending ? 'Suppression…' : 'Confirmer la suppression'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Header */}
            <Card variant="outlined">
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Stack
                        spacing={2.5}
                        direction={{ xs: 'column', lg: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'start', lg: 'start' }}
                    >
                        <Box>
                            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.5 }}>
                                <Chip
                                    label="Détail coach"
                                    sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main' }}
                                />
                                <ActiveStatusChip isActive={coach.isActive} />
                            </Stack>
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                {coach.displayName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>
                                @{coach.username}
                            </Typography>
                        </Box>
                        <Button variant="outlined" component={Link} to="/admin/coaches" sx={{ borderRadius: 3 }}>
                            Retour aux coachs
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            {/* Stat cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
                <StatCard
                    label="Campagnes"
                    value={campaigns.length}
                    helper="rattachées au coach"
                    icon={ClipboardList}
                />
                <StatCard label="Actives" value={activeCampaigns} helper="en cours" icon={ClipboardList} />
                <StatCard
                    label="Compte créé"
                    value={coach.createdAt ? new Date(coach.createdAt).toLocaleDateString('fr-FR') : '–'}
                    helper={`ID ${coach.id}`}
                    icon={UserRound}
                />
            </Box>

            {/* Main content + sidebar */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', xl: '1.25fr 0.75fr' },
                    gap: 3,
                    alignItems: 'start',
                }}
            >
                {/* Campaigns list */}
                <Card variant="outlined">
                    <CardContent sx={{ p: 2.5 }}>
                        <SectionTitle
                            title="Campagnes rattachées"
                            subtitle={`Les campagnes pilotées par ${coach.displayName}.`}
                        />
                        <Box sx={{ overflowX: 'auto' }}>
                            <Table sx={{ minWidth: 600 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Campagne</TableCell>
                                        <TableCell>Entreprise</TableCell>
                                        <TableCell>Statut</TableCell>
                                        <TableCell>Créée le</TableCell>
                                        <TableCell />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {campaigns.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Aucune campagne rattachée à ce coach.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        campaigns.map(c => (
                                            <TableRow hover key={c.id}>
                                                <TableCell>
                                                    <Typography fontWeight={700} color="text.primary">
                                                        {c.name}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {companyNameById.get(c.companyId) ??
                                                            `Entreprise #${c.companyId}`}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <CampaignStatusChip status={c.status} />
                                                </TableCell>
                                                <TableCell>
                                                    {c.createdAt
                                                        ? new Date(c.createdAt).toLocaleDateString('fr-FR')
                                                        : '–'}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Button
                                                        size="small"
                                                        variant="text"
                                                        href={`/admin/campaigns/${c.id}`}
                                                        endIcon={<ArrowRight size={14} />}
                                                    >
                                                        Détail
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Box>
                        {archivedCampaigns > 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                                Dont {archivedCampaigns} campagne{archivedCampaigns > 1 ? 's' : ''} archivée
                                {archivedCampaigns > 1 ? 's' : ''}.
                            </Typography>
                        )}
                    </CardContent>
                </Card>

                {/* Sidebar — résumé + zone dangereuse */}
                <Stack spacing={2}>
                    <Card variant="outlined">
                        <CardContent sx={{ p: 2.5 }}>
                            <SectionTitle title="Identité" subtitle="Informations du coach." />
                            <Stack spacing={1.4}>
                                <StatCard variant="mini" label="Nom à afficher" value={coach.displayName} />
                                <StatCard variant="mini" label="Username" value={coach.username} />
                                <StatCard
                                    variant="mini"
                                    label="Statut"
                                    value={coach.isActive ? 'Actif' : 'Désactivé'}
                                />
                                <StatCard variant="mini" label="Campagnes" value={String(campaigns.length)} />
                            </Stack>
                            <Button
                                variant="outlined"
                                fullWidth
                                startIcon={<Pencil size={16} />}
                                onClick={() => setEditOpen(true)}
                                sx={{ borderRadius: 3, mt: 2 }}
                            >
                                Éditer le coach
                            </Button>
                        </CardContent>
                    </Card>

                    <Card variant="outlined" sx={{ borderColor: 'rgba(239,68,68,0.3)' }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <SectionTitle title="Zone dangereuse" subtitle="Actions irréversibles." />
                            <Button
                                variant="outlined"
                                color="error"
                                fullWidth
                                startIcon={<Trash2 size={16} />}
                                disabled={deleteCoach.isPending}
                                onClick={() => setDeleteOpen(true)}
                                sx={{ borderRadius: 3, mt: 1 }}
                            >
                                Supprimer le coach
                            </Button>
                            {campaigns.length > 0 && (
                                <Alert severity="warning" sx={{ mt: 1.5 }}>
                                    Ce coach pilote {campaigns.length} campagne{campaigns.length > 1 ? 's' : ''}. Pensez
                                    à les réassigner avant suppression.
                                </Alert>
                            )}
                            {deleteCoach.isError && (
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
