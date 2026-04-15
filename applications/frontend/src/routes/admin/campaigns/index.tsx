import type { AdminCampaign } from '@/api/types';
import CampaignForm from '@/components/campaign/form';
import { DataTable } from '@/components/common/DataTable';
import { useAdminCampaigns, useCoaches, useCompanies } from '@/hooks/admin';
import { Box, Chip, InputAdornment, TableCell, TableRow, TextField, Typography } from '@mui/material';
import { Link, createFileRoute } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

export const Route = createFileRoute('/admin/campaigns/')({
    component: AdminCampaignsPage,
});

const getStatusColor = (status: string) => {
    switch (status) {
        case 'active':
            return 'success';
        case 'closed':
            return 'error';
        case 'archived':
            return 'warning';
        default:
            return 'default';
    }
};

function AdminCampaignsPage() {
    const { data: campaigns, isLoading: campaignsLoading } = useAdminCampaigns();
    const { data: companies } = useCompanies();
    const { data: coaches } = useCoaches();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredAndSortedCampaigns = useMemo(() => {
        let filtered = [...(campaigns ?? [])];

        if (searchQuery.trim() !== '') {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(campaign => {
                const companyName = companies?.find(c => c.id === campaign.companyId)?.name ?? `#${campaign.companyId}`;
                return (
                    campaign.name.toLowerCase().includes(lowerQuery) ||
                    companyName.toString().toLowerCase().includes(lowerQuery)
                );
            });
        }

        return filtered.sort((a, b) => b.id - a.id);
    }, [campaigns, companies, searchQuery]);

    const columns = useMemo<ColumnDef<AdminCampaign>[]>(
        () => [
            {
                accessorKey: 'name',
                header: 'Nom de la campagne',
                enableSorting: false,
                cell: ({ row }) => (
                    <Link
                        to="/admin/campaigns/$campaignId"
                        params={{ campaignId: String(row.original.id) }}
                        style={{ textDecoration: 'none', color: '#1515B0', fontWeight: 600 }}
                    >
                        {row.original.name}
                    </Link>
                ),
            },
            {
                id: 'company',
                header: 'Entreprise',
                enableSorting: false,
                accessorFn: row => companies?.find(c => c.id === row.companyId)?.name ?? `#${row.companyId}`,
                cell: ({ getValue }) => (
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {getValue() as string}
                    </Typography>
                ),
            },
            {
                id: 'coach',
                header: 'Coach',
                enableSorting: false,
                accessorFn: row => coaches?.find(c => c.id === row.coachId)?.displayName ?? `#${row.coachId}`,
                cell: ({ getValue }) => (
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {getValue() as string}
                    </Typography>
                ),
            },
            {
                accessorKey: 'questionnaireId',
                header: 'Questionnaire',
                enableSorting: false,
                cell: ({ getValue }) => (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {(getValue() as string | null) ?? '—'}
                    </Typography>
                ),
            },
            {
                accessorKey: 'status',
                header: 'Statut',
                enableSorting: false,
                cell: ({ getValue }) => {
                    const status = getValue() as string;
                    return (
                        <Chip
                            label={status}
                            size="small"
                            color={getStatusColor(status) as 'default' | 'success' | 'error' | 'warning'}
                            variant={status === 'draft' ? 'outlined' : 'filled'}
                            sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                        />
                    );
                },
            },
        ],
        [companies, coaches]
    );

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, sm: 3, md: 4 } }}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    mb: 4,
                    gap: 2,
                }}
            >
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                        Campagnes
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        Visualisez les campagnes existantes et gérez vos nouvelles initiatives.
                    </Typography>
                </Box>
                <CampaignForm />
            </Box>

            <DataTable
                data={filteredAndSortedCampaigns}
                columns={columns}
                isLoading={campaignsLoading}
                minWidth={650}
                cardSx={{ boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
                toolbar={
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                        <TextField
                            size="small"
                            placeholder="Rechercher par campagne ou entreprise..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            sx={{ width: { xs: '100%', sm: 350 } }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                                        <Search size={20} />
                                    </InputAdornment>
                                ),
                                sx: { borderRadius: 2, bgcolor: 'background.default' },
                            }}
                        />
                    </Box>
                }
                afterRows={
                    <>
                        {!campaignsLoading && (campaigns?.length ?? 0) === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    align="center"
                                    sx={{ py: 4, color: 'text.secondary' }}
                                >
                                    Aucune campagne créée pour le moment.
                                </TableCell>
                            </TableRow>
                        )}
                        {!campaignsLoading &&
                            (campaigns?.length ?? 0) > 0 &&
                            filteredAndSortedCampaigns.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        align="center"
                                        sx={{ py: 4, color: 'text.secondary' }}
                                    >
                                        Aucune campagne ne correspond à votre recherche.
                                    </TableCell>
                                </TableRow>
                            )}
                    </>
                }
            />
        </Box>
    );
}
