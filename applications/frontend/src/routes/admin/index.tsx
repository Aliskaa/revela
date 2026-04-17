import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  FileText,
  MessageSquareText,
  Plus,
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
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useAdminDashboard, useAdminCampaigns, useCoaches, useCompanies } from "@/hooks/admin";
import type { CampaignStatus } from "@aor/types";
import { ADMIN_COLORS as COLORS } from "@/components/common/colors";
import { SectionTitle } from "@/components/common/SectionTitle";
import { StatCard } from "@/components/common/StatCard";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboardRoute,
});


const QUESTIONNAIRE_LABELS: Record<string, string> = {
  B: "B — Comportement",
  F: "F — Ressentis",
  S: "S — Soi",
};


function StatusChip({ status }: { status: CampaignStatus }) {
  if (status === "active") {
    return <Chip label="Active" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(16,185,129,0.12)", color: "rgb(4,120,87)" }} />;
  }
  if (status === "closed" || status === "archived") {
    return <Chip label="Archivée" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(148,163,184,0.16)", color: "rgb(100,116,139)" }} />;
  }
  return <Chip label="Brouillon" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(255,204,0,0.16)", color: "rgb(180,120,0)" }} />;
}

function QuickAction({
  icon: Icon,
  title,
  subtitle,
  to,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  to: string;
}) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.2 }}>
        <Stack spacing={1.3}>
          <Stack direction="row" spacing={1.3} alignItems="start">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 3,
                bgcolor: "rgba(15,24,152,0.08)",
                color: COLORS.blue,
                display: "grid",
                placeItems: "center",
                flex: "none",
              }}
            >
              <Icon size={16} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography fontWeight={700} color="text.primary">
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.7 }}>
                {subtitle}
              </Typography>
            </Box>
          </Stack>
          <Button component={Link} to={to} variant="outlined" sx={{ borderRadius: 3, textTransform: "none", width: "fit-content" }}>
            Ouvrir
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function AdminDashboardRoute() {
  const { data: dashboard, isLoading: dashboardLoading } = useAdminDashboard();
  const { data: campaigns = [], isLoading: campaignsLoading } = useAdminCampaigns();
  const { data: coaches = [], isLoading: coachesLoading } = useCoaches();
  const { data: companies = [] } = useCompanies();

  const isLoading = dashboardLoading || campaignsLoading || coachesLoading;

  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;

  const companyName = (id: number) => companies.find((c) => c.id === id)?.name ?? "–";
  const coachName = (id: number) => coaches.find((c) => c.id === id)?.displayName ?? "–";

  const recentCampaigns = [...campaigns]
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, 5);

  const questionnaireEntries = Object.entries(dashboard?.by_questionnaire ?? {});

  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack
            spacing={2.5}
            direction={{ xs: "column", lg: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "start", lg: "start" }}
          >
            <Box>
              <Chip
                label="Administration"
                sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, mb: 1.5 }}
              />
              <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                Bienvenue, Admin AOR !
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}>
                Le tableau de bord centralisé vous permet de visualiser rapidement l'état des campagnes, des participants,
                des coachs et des questionnaires.
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <Button
                variant="contained"
                disableElevation
                component={Link}
                to="/admin/campaigns"
                startIcon={<Plus size={16} />}
                sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}
              >
                Nouvelle campagne
              </Button>
              <Button variant="outlined" startIcon={<FileText size={16} />} sx={{ borderRadius: 3, textTransform: "none" }}>
                Exporter
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" },
          gap: 2,
        }}
      >
        <StatCard
          label="Campagnes actives"
          value={activeCampaigns}
          helper={`sur ${campaigns.length} campagne${campaigns.length !== 1 ? "s" : ""}`}
          icon={Target}
          loading={campaignsLoading}
        />
        <StatCard
          label="Participants"
          value={dashboard?.total_participants ?? "–"}
          helper="accès ouverts"
          icon={Users}
          loading={dashboardLoading}
        />
        <StatCard
          label="Entreprises"
          value={dashboard?.total_companies ?? "–"}
          helper="clients suivis"
          icon={Building2}
          loading={dashboardLoading}
        />
        <StatCard
          label="Coachs"
          value={coaches.length}
          helper="utilisateurs actifs"
          icon={UserRound}
          loading={coachesLoading}
        />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.35fr 0.65fr" }, gap: 3, alignItems: "start" }}>
        <Card variant="outlined">
          <CardContent sx={{ p: 2.5 }}>
            <SectionTitle
              title="Suivi des campagnes"
              subtitle="Vue rapide des campagnes récentes et de leur état opérationnel."
              action={
                <Button component={Link} to="/admin/campaigns" variant="outlined" sx={{ borderRadius: 3, textTransform: "none" }}>
                  Voir toutes
                </Button>
              }
            />

            <Box sx={{ overflowX: "auto" }}>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Campagne</TableCell>
                    <TableCell>Entreprise</TableCell>
                    <TableCell>Coach</TableCell>
                    <TableCell>Questionnaire</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Créée le</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 6 }).map((__, j) => (
                            <TableCell key={j}>
                              <Skeleton variant="text" />
                            </TableCell>
                          ))}
                          <TableCell />
                        </TableRow>
                      ))
                    : recentCampaigns.map((campaign) => (
                        <TableRow hover key={campaign.id}>
                          <TableCell>
                            <Typography fontWeight={700} color="text.primary">
                              {campaign.name}
                            </Typography>
                          </TableCell>
                          <TableCell>{companyName(campaign.companyId)}</TableCell>
                          <TableCell>{coachName(campaign.coachId)}</TableCell>
                          <TableCell>
                            {campaign.questionnaireId
                              ? (QUESTIONNAIRE_LABELS[campaign.questionnaireId] ?? campaign.questionnaireId)
                              : "–"}
                          </TableCell>
                          <TableCell>
                            <StatusChip status={campaign.status} />
                          </TableCell>
                          <TableCell>
                            {campaign.createdAt
                              ? new Date(campaign.createdAt).toLocaleDateString("fr-FR")
                              : "–"}
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              component={Link}
                              to="/admin/campaigns/$campaignId"
                              params={{ campaignId: String(campaign.id) }}
                              variant="text"
                              endIcon={<ArrowRight size={16} />}
                              sx={{ textTransform: "none" }}
                            >
                              Ouvrir
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  {!isLoading && recentCampaigns.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          Aucune campagne pour le moment.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </CardContent>
        </Card>

        <Stack spacing={3}>
          <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle
                title="Questionnaires"
                subtitle="Répartition des réponses par questionnaire."
              />
              <Stack spacing={1.2} sx={{ mt: 2 }}>
                {dashboardLoading
                  ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={56} />)
                  : questionnaireEntries.length === 0
                  ? (
                    <Typography variant="body2" color="text.secondary">
                      Aucune réponse enregistrée.
                    </Typography>
                  )
                  : questionnaireEntries.map(([qid, info]) => (
                      <Stack
                        key={qid}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 4, p: 2 }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight={700} color="text.primary">
                            {info.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {info.count} réponse{info.count !== 1 ? "s" : ""}
                          </Typography>
                        </Box>
                        <Chip
                          label={info.count > 0 ? "En cours" : "En attente"}
                          size="small"
                          sx={{
                            borderRadius: 99,
                            bgcolor: info.count > 0 ? "rgba(16,185,129,0.12)" : "rgba(255,204,0,0.16)",
                            color: info.count > 0 ? "rgb(4,120,87)" : "rgb(180,120,0)",
                          }}
                        />
                      </Stack>
                    ))}
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle title="Accès rapides" subtitle="Les actions les plus fréquentes côté admin." />
              <Stack spacing={1.2} sx={{ mt: 2 }}>
                <QuickAction
                  icon={ClipboardList}
                  title="Créer une campagne"
                  subtitle="Lancer un nouveau parcours avec un questionnaire assigné."
                  to="/admin/campaigns"
                />
                <QuickAction
                  icon={MessageSquareText}
                  title="Consulter les réponses"
                  subtitle="Voir les soumissions et les statuts de collecte."
                  to="/admin/responses"
                />
                <QuickAction
                  icon={Sparkles}
                  title="Gérer les questionnaires"
                  subtitle="Piloter le catalogue et les versions."
                  to="/admin/questionnaires"
                />
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>

      <Card variant="outlined">
        <CardContent sx={{ p: 2.5 }}>
          <SectionTitle title="Synthèse opérationnelle" subtitle="Ce dashboard doit aider à décider vite." />
          <Box
            sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2, mt: 2 }}
          >
            <Card variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                À surveiller
              </Typography>
              <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.4 }}>
                Les campagnes en brouillon
              </Typography>
            </Card>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Suivi
              </Typography>
              <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.4 }}>
                Les questionnaires actifs et les volumes reçus
              </Typography>
            </Card>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Prochaine étape
              </Typography>
              <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.4 }}>
                Ouvrir la campagne détail
              </Typography>
            </Card>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}
