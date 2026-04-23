import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Archive,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Clock3,
  Copy,
  MessageSquareText,
  Play,
  Sparkles,
  Send,
  Square,
  Target,
  Upload,
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
  Collapse,
  IconButton,
  LinearProgress,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import type { CampaignParticipantProgress, CampaignStatus } from "@aor/types";
import { useAdminCampaign, useCoaches, useCompanies, useUpdateAdminCampaignStatus, useInviteCampaignParticipants, useImportParticipantsToCampaign, useParticipantTokens } from "@/hooks/admin";
import { ADMIN_COLORS as COLORS } from "@/components/common/colors";
import { SectionTitle } from "@/components/common/SectionTitle";
import { StatCard } from "@/components/common/StatCard";
import { MiniStat } from "@/components/common/MiniStat";

export const Route = createFileRoute("/admin/campaigns/$campaignId")({
  component: AdminCampaignDetailRoute,
});

const QUESTIONNAIRE_LABELS: Record<string, string> = {
  B: "B \u2014 Comportement",
  F: "F \u2014 Ressentis",
  S: "S \u2014 Soi",
};

function StatusChip({ status }: { status: CampaignStatus }) {
  if (status === "active")
    return <Chip label="Active" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(16,185,129,0.12)", color: "rgb(4,120,87)" }} />;
  if (status === "closed" || status === "archived")
    return <Chip label="Archivée" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(148,163,184,0.16)", color: "rgb(100,116,139)" }} />;
  return <Chip label="Brouillon" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(255,204,0,0.16)", color: "rgb(180,120,0)" }} />;
}

function statusText(status: CampaignStatus): string {
  if (status === "active") return "Active";
  if (status === "closed" || status === "archived") return "Archivée";
  return "Brouillon";
}

type ProgressStatus = CampaignParticipantProgress["selfRatingStatus"];

function ProgressChip({ status }: { status: ProgressStatus }) {
  if (status === "completed")
    return <Chip label="Terminé" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(16,185,129,0.12)", color: "rgb(4,120,87)" }} />;
  if (status === "pending")
    return <Chip label="En cours" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue }} />;
  return <Chip label="Verrouillé" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(148,163,184,0.16)", color: "rgb(100,116,139)" }} />;
}

function MiniLine({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <Stack direction="row" spacing={1.2} alignItems="start">
      <Box sx={{ width: 36, height: 36, borderRadius: 3, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, display: "grid", placeItems: "center", flex: "none" }}>
        <Icon size={15} />
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.25 }}>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

function computeProgress(participants: CampaignParticipantProgress[]): number {
  if (participants.length === 0) return 0;
  const totalSteps = participants.length * 4;
  let completed = 0;
  for (const p of participants) {
    if (p.selfRatingStatus === "completed") completed++;
    if (p.peerFeedbackStatus === "completed") completed++;
    if (p.elementHumainStatus === "completed") completed++;
    if (p.resultsStatus === "completed") completed++;
  }
  return Math.round((completed / totalSteps) * 100);
}

function ParticipantTokensRow({ participantId, campaignId, colSpan }: { participantId: number; campaignId: number; colSpan: number }) {
  const { data: allTokens = [], isLoading } = useParticipantTokens(participantId);
  const tokens = allTokens.filter((t) => t.campaign_id === campaignId);
  const [copied, setCopied] = React.useState<string | null>(null);

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <TableRow>
      <TableCell colSpan={colSpan} sx={{ py: 0, bgcolor: "rgba(15,23,42,0.02)" }}>
        <Collapse in unmountOnExit>
          <Box sx={{ py: 2, px: 1 }}>
            {isLoading ? (
              <Skeleton variant="text" width={300} />
            ) : tokens.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Aucun token d'invitation.</Typography>
            ) : (
              <Stack spacing={1}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Tokens d'invitation
                </Typography>
                {tokens.map((t) => (
                  <Stack key={t.id} direction="row" spacing={1.5} alignItems="center" sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2, px: 1.5, py: 1, bgcolor: "#fff" }}>
                    <Chip label={t.questionnaire_id} size="small" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, fontWeight: 700 }} />
                    <Chip
                      label={t.status}
                      size="small"
                      sx={{
                        borderRadius: 99,
                        bgcolor: t.status === "active" ? "rgba(16,185,129,0.12)" : "rgba(148,163,184,0.16)",
                        color: t.status === "active" ? "rgb(4,120,87)" : "rgb(100,116,139)",
                      }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace", fontSize: 12 }}>
                      {t.invite_url}
                    </Typography>
                    {t.expires_at && (
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                        Exp. {new Date(t.expires_at).toLocaleDateString("fr-FR")}
                      </Typography>
                    )}
                    <Tooltip title={copied === t.invite_url ? "Copié !" : "Copier le lien"}>
                      <IconButton size="small" onClick={() => handleCopy(t.invite_url)}>
                        <Copy size={14} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ))}
              </Stack>
            )}
          </Box>
        </Collapse>
      </TableCell>
    </TableRow>
  );
}

function AdminCampaignDetailRoute() {
  const { campaignId } = Route.useParams();
  const numericId = Number(campaignId);

  const { data: detail, isLoading } = useAdminCampaign(numericId);
  const { data: companies = [] } = useCompanies();
  const { data: coaches = [] } = useCoaches();
  const updateStatus = useUpdateAdminCampaignStatus();
  const inviteParticipants = useInviteCampaignParticipants();
  const importParticipants = useImportParticipantsToCampaign();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [snack, setSnack] = React.useState<string | null>(null);
  const [expandedParticipant, setExpandedParticipant] = React.useState<number | null>(null);

  const handleInvite = async () => {
    const result = await inviteParticipants.mutateAsync({ campaignId: numericId });
    setSnack(`${result.created} invitation${result.created !== 1 ? "s" : ""} envoyée${result.created !== 1 ? "s" : ""}`);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const result = await importParticipants.mutateAsync({ campaignId: numericId, formData });
    setSnack(`${result.created} créé${result.created !== 1 ? "s" : ""}, ${result.invited} invité${result.invited !== 1 ? "s" : ""}`);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const campaign = detail?.campaign;
  const participants = detail?.participant_progress ?? [];
  const responsesTotal = detail?.responses_total ?? 0;

  const companyName = campaign
    ? (companies.find((c) => c.id === campaign.companyId)?.name ?? "\u2013")
    : "\u2013";
  const coachName = campaign
    ? (coaches.find((c) => c.id === campaign.coachId)?.displayName ?? "\u2013")
    : "\u2013";
  const questionnaireLabel = campaign?.questionnaireId
    ? (QUESTIONNAIRE_LABELS[campaign.questionnaireId] ?? campaign.questionnaireId)
    : "\u2013";

  const progress = computeProgress(participants);

  if (isLoading) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="rounded" height={140} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={110} />
          ))}
        </Box>
        <Skeleton variant="rounded" height={300} />
      </Stack>
    );
  }

  if (!campaign) {
    return (
      <Card variant="outlined">
        <CardContent sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary">
            Campagne introuvable.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={3}>
      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} message={snack} />
      {inviteParticipants.isError && <Alert severity="error" onClose={() => inviteParticipants.reset()}>Erreur lors de l'envoi des invitations.</Alert>}
      {importParticipants.isError && <Alert severity="error" onClose={() => importParticipants.reset()}>Erreur lors de l'import : {importParticipants.error?.message}</Alert>}

      {/* Header */}
      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack spacing={2.5} direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ xs: "start", lg: "start" }}>
            <Box>
              <Chip label="Détail campagne" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, mb: 1.5 }} />
              <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                {campaign.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7, maxWidth: 900 }}>
                Cockpit opérationnel de la campagne : questionnaire assigné, participants, invitations, réponses et pilotage.
              </Typography>
            </Box>

            <Button
              variant="outlined"
              component={Link}
              to="/admin/campaigns"
              sx={{ borderRadius: 3, textTransform: "none" }}
            >
              Retour aux campagnes
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Stat cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
        <StatCard label="Participants" value={participants.length} helper="rattachés" icon={Users} />
        <StatCard label="Réponses" value={responsesTotal} helper="collectées" icon={MessageSquareText} />
        <StatCard label="Progression" value={`${progress}%`} helper="parcours global" icon={Target} />
        <StatCard label="Statut" value={statusText(campaign.status)} helper={campaign.status} icon={BadgeCheck} />
      </Box>

      {/* Main content + sidebar */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.25fr 0.75fr" }, gap: 3, alignItems: "start" }}>
        <Stack spacing={3}>
          {/* Operational summary */}
          <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle
                title="Résumé opérationnel"
                subtitle="Les informations clés pour piloter rapidement la campagne."
              />

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2, mt: 2 }}>
                <MiniStat label="Entreprise" value={companyName} />
                <MiniStat label="Coach" value={coachName} />
                <MiniStat label="Questionnaire" value={questionnaireLabel} />
              </Box>

              <Box sx={{ mt: 2.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Progression
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{ mt: 1, height: 10, borderRadius: 99, bgcolor: "rgba(15,23,42,0.06)", "& .MuiLinearProgress-bar": { bgcolor: COLORS.blue } }}
                />
              </Box>

              <Stack direction="row" spacing={1.2} sx={{ mt: 2.5, flexWrap: "wrap" }}>
                <Chip icon={<CalendarDays size={14} />} label={`Créée le ${campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString("fr-FR") : "\u2013"}`} sx={{ borderRadius: 99 }} />
                {campaign.startsAt && (
                  <Chip icon={<Clock3 size={14} />} label={`Début ${new Date(campaign.startsAt).toLocaleDateString("fr-FR")}`} sx={{ borderRadius: 99 }} />
                )}
                {campaign.endsAt && (
                  <Chip icon={<Clock3 size={14} />} label={`Fin ${new Date(campaign.endsAt).toLocaleDateString("fr-FR")}`} sx={{ borderRadius: 99 }} />
                )}
                <StatusChip status={campaign.status} />
              </Stack>
            </CardContent>
          </Card>

          {/* Participants table */}
          <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle
                title="Participants de la campagne"
                subtitle="Vue opérationnelle des participants rattachés et de leur état de collecte."
              />

              <Box sx={{ overflowX: "auto" }}>
                <Table sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" />
                      <TableCell>Participant</TableCell>
                      <TableCell>Auto-éval</TableCell>
                      <TableCell>Pairs</TableCell>
                      <TableCell>Élément Humain</TableCell>
                      <TableCell>Résultats</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {participants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            Aucun participant pour le moment.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      participants.map((p) => (
                        <React.Fragment key={p.participantId}>
                          <TableRow
                            hover
                            sx={{ cursor: "pointer" }}
                            onClick={() => setExpandedParticipant(expandedParticipant === p.participantId ? null : p.participantId)}
                          >
                            <TableCell padding="checkbox">
                              <IconButton size="small">
                                <ChevronDown
                                  size={16}
                                  style={{
                                    transition: "transform 0.2s",
                                    transform: expandedParticipant === p.participantId ? "rotate(180deg)" : "rotate(0deg)",
                                  }}
                                />
                              </IconButton>
                            </TableCell>
                            <TableCell>
                              <Typography fontWeight={700} color="text.primary">
                                {p.fullName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {p.email}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <ProgressChip status={p.selfRatingStatus} />
                            </TableCell>
                            <TableCell>
                              <ProgressChip status={p.peerFeedbackStatus} />
                            </TableCell>
                            <TableCell>
                              <ProgressChip status={p.elementHumainStatus} />
                            </TableCell>
                            <TableCell>
                              <ProgressChip status={p.resultsStatus} />
                            </TableCell>
                          </TableRow>
                          {expandedParticipant === p.participantId && (
                            <ParticipantTokensRow participantId={p.participantId} campaignId={campaign.id} colSpan={6} />
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>
        </Stack>

        {/* Right sidebar */}
        <Stack spacing={3}>
          <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle title="Statut de la campagne" subtitle="Les participants ne peuvent commencer que si la campagne est active." />
              <Stack spacing={1.2} sx={{ mt: 2 }}>
                {campaign.status === "draft" && (
                  <Button
                    variant="contained"
                    disableElevation
                    startIcon={<Play size={16} />}
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ campaignId: campaign.id, status: "active", align_starts_at_to_now: true })}
                    sx={{ borderRadius: 3, bgcolor: "rgb(4,120,87)", textTransform: "none", "&:hover": { bgcolor: "rgb(3,100,70)" } }}
                  >
                    {updateStatus.isPending ? "En cours…" : "Lancer la campagne"}
                  </Button>
                )}
                {campaign.status === "active" && (
                  <Button
                    variant="contained"
                    disableElevation
                    startIcon={<Square size={16} />}
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ campaignId: campaign.id, status: "closed" })}
                    sx={{ borderRadius: 3, bgcolor: "rgb(180,120,0)", textTransform: "none", "&:hover": { bgcolor: "rgb(150,100,0)" } }}
                  >
                    {updateStatus.isPending ? "En cours…" : "Clôturer la campagne"}
                  </Button>
                )}
                {(campaign.status === "draft" || campaign.status === "active" || campaign.status === "closed") && (
                  <Button
                    variant="outlined"
                    startIcon={<Archive size={16} />}
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ campaignId: campaign.id, status: "archived" })}
                    sx={{ borderRadius: 3, textTransform: "none", color: "text.secondary" }}
                  >
                    Archiver
                  </Button>
                )}
                {campaign.status === "archived" && (
                  <Typography variant="body2" color="text.secondary">
                    Cette campagne est archivée. Aucune action disponible.
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle title="Gérer les participants" subtitle="Inviter les participants de l'entreprise ou importer un fichier CSV." />
              <Stack spacing={1.2} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  disableElevation
                  startIcon={<Send size={16} />}
                  disabled={inviteParticipants.isPending || campaign.status === "archived"}
                  onClick={handleInvite}
                  sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}
                >
                  {inviteParticipants.isPending ? "Envoi…" : "Inviter les participants"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  hidden
                  onChange={handleFileChange}
                />
                <Button
                  variant="outlined"
                  startIcon={<Upload size={16} />}
                  disabled={importParticipants.isPending || campaign.status === "archived"}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ borderRadius: 3, textTransform: "none" }}
                >
                  {importParticipants.isPending ? "Import…" : "Importer un CSV"}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle title="Pilotage" subtitle="Quelques repères utiles." />
              <Stack spacing={1.2} sx={{ mt: 2 }}>
                <MiniLine label="Questionnaire" value={questionnaireLabel} icon={ClipboardList} />
                <MiniLine label="Coach" value={coachName} icon={UserRound} />
                <MiniLine label="Entreprise" value={companyName} icon={Sparkles} />
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Stack>
  );
}
