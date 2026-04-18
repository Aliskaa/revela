import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
    ClipboardList,
    MessageSquareText,
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
import { ADMIN_COLORS as COLORS } from "@/components/common/colors";
import { SectionTitle } from "@/components/common/SectionTitle";
import { StatCard } from "@/components/common/StatCard";
import { MiniStat } from "@/components/common/MiniStat";
import { useAdminResponses } from "@/hooks/admin";
import type { AdminResponse, ResponseSubmissionKind } from "@aor/types";

export const Route = createFileRoute("/admin/responses")({
    component: AdminResponsesRoute,
});

const SUBMISSION_KIND_LABELS: Record<ResponseSubmissionKind, string> = {
    element_humain: "Test Élément Humain",
    self_rating: "Auto-évaluation",
    peer_rating: "Feedback des pairs",
};

function kindLabel(kind: ResponseSubmissionKind): string {
    return SUBMISSION_KIND_LABELS[kind] ?? kind;
}

function AdminResponsesRoute() {
    const [page, setPage] = React.useState(1);
    const [search, setSearch] = React.useState("");

    const { data, isLoading } = useAdminResponses(undefined, page, 50);

    const responses = data?.items ?? [];
    const totalPages = data?.pages ?? 1;

    const selfCount = responses.filter((r) => r.submission_kind === "self_rating").length;
    const peerCount = responses.filter((r) => r.submission_kind === "peer_rating").length;
    const ehCount = responses.filter((r) => r.submission_kind === "element_humain").length;

    const filtered = search.trim()
        ? responses.filter(
              (r) =>
                  r.name.toLowerCase().includes(search.toLowerCase()) ||
                  r.email.toLowerCase().includes(search.toLowerCase()) ||
                  r.organisation.toLowerCase().includes(search.toLowerCase())
          )
        : responses;

    return (
        <Stack spacing={3}>
            <Card variant="outlined">
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Stack spacing={2.5} direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ xs: "start", lg: "start" }}>
                        <Box>
                            <Chip label="Réponses" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, mb: 1.5 }} />
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                Réponses
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}>
                                Suivi des soumissions collectées par campagne, avec accès rapide aux dossiers de collecte.
                            </Typography>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
                <StatCard label="Soumissions" value={data?.total ?? "–"} helper="tous types confondus" icon={MessageSquareText} loading={isLoading} />
                <StatCard label="Auto-éval" value={selfCount} helper="sur cette page" icon={Users} loading={isLoading} />
                <StatCard label="Pairs" value={peerCount} helper="sur cette page" icon={Sparkles} loading={isLoading} />
                <StatCard label="Élément Humain" value={ehCount} helper="sur cette page" icon={ClipboardList} loading={isLoading} />
            </Box>

            <Card variant="outlined">
                <CardContent sx={{ p: 2.5 }}>
                    <SectionTitle
                        title="Liste des soumissions"
                        subtitle="Chaque ligne correspond à un type de réponse relié à une campagne et à un participant."
                        action={
                            <TextField
                                size="small"
                                placeholder="Rechercher une soumission…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                sx={{ minWidth: 300 }}
                            />
                        }
                    />

                    {/* Desktop table */}
                    <Box sx={{ display: { xs: "none", lg: "block" }, overflowX: "auto" }}>
                        <Table sx={{ minWidth: 900 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Questionnaire</TableCell>
                                    <TableCell>Organisation</TableCell>
                                    <TableCell>Scores</TableCell>
                                    <TableCell>Soumis le</TableCell>
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
                                    : filtered.map((response) => (
                                          <TableRow hover key={response.id}>
                                              <TableCell>
                                                  <Typography fontWeight={700} color="text.primary">
                                                      {kindLabel(response.submission_kind)}
                                                  </Typography>
                                                  <Typography variant="caption" color="text.secondary">
                                                      {response.name}
                                                  </Typography>
                                              </TableCell>
                                              <TableCell>{response.questionnaire_id}</TableCell>
                                              <TableCell>{response.organisation || "–"}</TableCell>
                                              <TableCell>{Object.keys(response.scores).length}</TableCell>
                                              <TableCell>
                                                  {new Date(response.submitted_at).toLocaleDateString("fr-FR")}
                                              </TableCell>
                                          </TableRow>
                                      ))}
                                {!isLoading && filtered.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {search ? "Aucune soumission ne correspond à la recherche." : "Aucune soumission pour le moment."}
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
                            : filtered.map((response) => (
                                  <Card variant="outlined" key={response.id}>
                                      <CardContent sx={{ p: 2.5 }}>
                                          <Stack spacing={1.8}>
                                              <Box>
                                                  <Typography variant="h6" fontWeight={800} color="text.primary">
                                                      {kindLabel(response.submission_kind)}
                                                  </Typography>
                                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                                                      {response.name}
                                                  </Typography>
                                              </Box>
                                              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.2 }}>
                                                  <MiniStat label="Questionnaire" value={response.questionnaire_id} />
                                                  <MiniStat label="Organisation" value={response.organisation || "–"} />
                                                  <MiniStat label="Scores" value={String(Object.keys(response.scores).length)} />
                                                  <MiniStat
                                                      label="Soumis le"
                                                      value={new Date(response.submitted_at).toLocaleDateString("fr-FR")}
                                                  />
                                              </Box>
                                          </Stack>
                                      </CardContent>
                                  </Card>
                              ))}
                        {!isLoading && filtered.length === 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                                {search ? "Aucune soumission ne correspond à la recherche." : "Aucune soumission pour le moment."}
                            </Typography>
                        )}
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

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.2fr 0.8fr" }, gap: 3, alignItems: "start" }}>
                <Card variant="outlined">
                    <CardContent sx={{ p: 2.5 }}>
                        <SectionTitle title="Accès rapides" subtitle="Les vues les plus utiles pour la collecte." />
                        <Stack spacing={1.2} sx={{ mt: 2 }}>
                            <Button variant="outlined" component={Link} to="/admin/campaigns" startIcon={<ClipboardList size={16} />} sx={{ justifyContent: "space-between", borderRadius: 3, textTransform: "none" }}>
                                Voir les campagnes concernées
                            </Button>
                            <Button variant="outlined" component={Link} to="/admin/participants" startIcon={<Users size={16} />} sx={{ justifyContent: "space-between", borderRadius: 3, textTransform: "none" }}>
                                Voir les participants actifs
                            </Button>
                            <Button variant="outlined" component={Link} to="/admin/questionnaires" startIcon={<Sparkles size={16} />} sx={{ justifyContent: "space-between", borderRadius: 3, textTransform: "none" }}>
                                Voir les questionnaires assignés
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>

                <Card variant="outlined">
                    <CardContent sx={{ p: 2.5 }}>
                        <SectionTitle title="Lecture rapide" subtitle="La page doit aider à repérer ce qui bloque la collecte." />
                        <Box sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 4, p: 2, mt: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                                Un admin doit pouvoir identifier immédiatement les réponses complétées, celles en cours, et les éléments encore attendus avant restitution.
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Stack>
    );
}
