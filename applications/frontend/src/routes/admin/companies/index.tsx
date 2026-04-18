import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
    ArrowRight,
    Building2,
    CalendarDays,
    ClipboardList,
    Plus,
    Sparkles,
    Users,
} from "lucide-react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
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
import { AdminCompanyDrawerForm } from "@/components/admin/AdminCompanyDrawerForm";
import { ADMIN_COLORS as COLORS } from "@/components/common/colors";
import { SectionTitle } from "@/components/common/SectionTitle";
import { StatCard } from "@/components/common/StatCard";
import { MiniStat } from "@/components/common/MiniStat";
import { useCompanies, useCreateCompany, useAdminCampaigns } from "@/hooks/admin";
import type { Company } from "@aor/types";

export const Route = createFileRoute("/admin/companies/")({
    component: AdminCompaniesRoute,
});

function AdminCompaniesRoute() {
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");

    const { data: companies = [], isLoading: companiesLoading } = useCompanies();
    const { data: campaigns = [], isLoading: campaignsLoading } = useAdminCampaigns();
    const createCompany = useCreateCompany();

    const totalParticipants = React.useMemo(
        () => companies.reduce((sum, c) => sum + c.participant_count, 0),
        [companies]
    );

    const filtered = search.trim()
        ? companies.filter(
              (c) =>
                  c.name.toLowerCase().includes(search.toLowerCase()) ||
                  (c.contact_name ?? "").toLowerCase().includes(search.toLowerCase())
          )
        : companies;

    return (
        <Stack spacing={3}>
            <AdminCompanyDrawerForm
                open={drawerOpen}
                mode="create"
                onClose={() => {
                    setDrawerOpen(false);
                    createCompany.reset();
                }}
                onSubmit={async (values) => {
                    await createCompany.mutateAsync({
                        name: values.name,
                        contactName: values.contactName || null,
                        contactEmail: values.contactEmail || null,
                    });
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
                        <Button
                            onClick={() => setDrawerOpen(true)}
                            variant="contained"
                            disableElevation
                            startIcon={<Plus size={16} />}
                            sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}
                        >
                            Ajouter une entreprise
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
                <StatCard label="Entreprises" value={companies.length} helper="référencées" icon={Building2} loading={companiesLoading} />
                <StatCard label="Participants" value={totalParticipants} helper="rattachés" icon={Users} loading={companiesLoading} />
                <StatCard label="Campagnes" value={campaigns.length} helper="rattachées" icon={ClipboardList} loading={campaignsLoading} />
            </Box>

            <Card variant="outlined">
                <CardContent sx={{ p: 2.5 }}>
                    <SectionTitle
                        title="Liste des entreprises"
                        subtitle="Recherche rapide et accès au détail des campagnes associées."
                        action={
                            <TextField
                                size="small"
                                placeholder="Rechercher une entreprise…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                sx={{ minWidth: 300 }}
                            />
                        }
                    />

                    {/* Desktop table */}
                    <Box sx={{ display: { xs: "none", lg: "block" }, overflowX: "auto" }}>
                        <Table sx={{ minWidth: 800 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Entreprise</TableCell>
                                    <TableCell>Contact</TableCell>
                                    <TableCell>Participants</TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {companiesLoading
                                    ? Array.from({ length: 4 }).map((_, i) => (
                                          <TableRow key={i}>
                                              {Array.from({ length: 3 }).map((__, j) => (
                                                  <TableCell key={j}><Skeleton variant="text" /></TableCell>
                                              ))}
                                          </TableRow>
                                      ))
                                    : filtered.map((company) => (
                                          <TableRow hover key={company.id}>
                                              <TableCell>
                                                  <Typography fontWeight={700} color="text.primary">
                                                      {company.name}
                                                  </Typography>
                                              </TableCell>
                                              <TableCell>
                                                  <Typography fontWeight={600} color="text.primary">
                                                      {company.contact_name ?? "–"}
                                                  </Typography>
                                                  <Typography variant="caption" color="text.secondary">
                                                      {company.contact_email ?? ""}
                                                  </Typography>
                                              </TableCell>
                                              <TableCell>{company.participant_count}</TableCell>
                                              <TableCell align="right">
                                                  <Button
                                                      component={Link}
                                                      to="/admin/companies/$companyId"
                                                      params={{ companyId: String(company.id) }}
                                                      variant="text"
                                                      endIcon={<ArrowRight size={16} />}
                                                      sx={{ textTransform: "none" }}
                                                  >
                                                      Ouvrir
                                                  </Button>
                                              </TableCell>
                                          </TableRow>
                                      ))}
                                {!companiesLoading && filtered.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {search ? "Aucune entreprise ne correspond à la recherche." : "Aucune entreprise pour le moment."}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Box>

                    {/* Mobile cards */}
                    <Stack spacing={2} sx={{ display: { xs: "flex", lg: "none" }, mt: 2 }}>
                        {companiesLoading
                            ? Array.from({ length: 3 }).map((_, i) => (
                                  <Skeleton key={i} variant="rounded" height={140} />
                              ))
                            : filtered.map((company) => (
                                  <Card variant="outlined" key={company.id}>
                                      <CardContent sx={{ p: 2.5 }}>
                                          <Stack spacing={1.8}>
                                              <Box>
                                                  <Typography variant="h6" fontWeight={800} color="text.primary">
                                                      {company.name}
                                                  </Typography>
                                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                                                      {company.contact_name ?? "–"}
                                                  </Typography>
                                                  <Typography variant="caption" color="text.secondary">
                                                      {company.contact_email ?? ""}
                                                  </Typography>
                                              </Box>
                                              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.2 }}>
                                                  <MiniStat label="Participants" value={String(company.participant_count)} />
                                              </Box>
                                          </Stack>
                                      </CardContent>
                                  </Card>
                              ))}
                        {!companiesLoading && filtered.length === 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                                {search ? "Aucune entreprise ne correspond à la recherche." : "Aucune entreprise pour le moment."}
                            </Typography>
                        )}
                    </Stack>
                </CardContent>
            </Card>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.2fr 0.8fr" }, gap: 3, alignItems: "start" }}>
                <Card variant="outlined">
                    <CardContent sx={{ p: 2.5 }}>
                        <SectionTitle title="Lecture rapide" subtitle="Ce que cette page doit aider à piloter." />
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2, mt: 2 }}>
                            <Card variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="caption" color="text.secondary">Priorité</Typography>
                                <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.4 }}>
                                    Les entreprises en campagne active
                                </Typography>
                            </Card>
                            <Card variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="caption" color="text.secondary">Suivi</Typography>
                                <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.4 }}>
                                    Le nombre de participants rattachés
                                </Typography>
                            </Card>
                            <Card variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="caption" color="text.secondary">Action</Typography>
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
                            <Button variant="outlined" component={Link} to="/admin/campaigns" startIcon={<CalendarDays size={16} />} sx={{ justifyContent: "space-between", borderRadius: 3, textTransform: "none" }}>
                                Voir les campagnes de l'entreprise
                            </Button>
                            <Button variant="outlined" component={Link} to="/admin/participants" startIcon={<Sparkles size={16} />} sx={{ justifyContent: "space-between", borderRadius: 3, textTransform: "none" }}>
                                Voir les participants actifs
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Box>
        </Stack>
    );
}
