import { ADMIN_COLORS as COLORS } from "@/components/common/colors";
import { SectionTitle } from "@/components/common/SectionTitle";
import { StatCard } from "@/components/common/StatCard";
import { useAdminQuestionnaires } from "@/hooks/questionnaires";
import {
    Box,
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
    Typography
} from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import {
    ClipboardList,
    Users
} from "lucide-react";
import * as React from "react";

export const Route = createFileRoute("/admin/questionnaires")({
    component: AdminQuestionnairesRoute,
});

function AdminQuestionnairesRoute() {
    const [search, setSearch] = React.useState("");

    const { data: questionnaires = [], isLoading } = useAdminQuestionnaires();

    const uniqueDimensions = React.useMemo(() => {
        const set = new Set<string>();
        for (const q of questionnaires) {
            for (const d of q.dimensions) set.add(d.name);
        }
        return set.size;
    }, [questionnaires]);

    const filtered = search.trim()
        ? questionnaires.filter(
            (q) =>
                q.title.toLowerCase().includes(search.toLowerCase()) ||
                q.id.toLowerCase().includes(search.toLowerCase())
        )
        : questionnaires;

    return (
        <Stack spacing={3}>
            <Card variant="outlined">
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Stack spacing={2.5} direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ xs: "start", lg: "start" }}>
                        <Box>
                            <Chip label="Questionnaires" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, mb: 1.5 }} />
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                Questionnaires
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}>
                                Référentiel des questionnaires, avec les dimensions, le volume de questions et l'état de publication.
                            </Typography>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
                <StatCard label="Questionnaires" value={questionnaires.length} helper="référencés" icon={ClipboardList} loading={isLoading} />
                <StatCard label="Dimensions" value={uniqueDimensions} helper="au total" icon={Users} loading={isLoading} />
            </Box>

            <Card variant="outlined">
                <CardContent sx={{ p: 2.5 }}>
                    <SectionTitle
                        title="Liste des questionnaires"
                        subtitle="Voir rapidement la structure et ouvrir le détail ou l'édition."
                        action={
                            <TextField
                                size="small"
                                placeholder="Rechercher un questionnaire…"
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
                                    <TableCell>Code</TableCell>
                                    <TableCell>Questionnaire</TableCell>
                                    <TableCell>Dimensions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading
                                    ? Array.from({ length: 3 }).map((_, i) => (
                                        <TableRow key={i}>
                                            {Array.from({ length: 3 }).map((__, j) => (
                                                <TableCell key={j}><Skeleton variant="text" /></TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                    : filtered.map((q) => (
                                        <TableRow hover key={q.id}>
                                            <TableCell>
                                                <Typography fontWeight={700} color="text.primary">
                                                    {q.id}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography fontWeight={700} color="text.primary">
                                                    {q.title}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {q.description}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{q.dimensions.map((d) => d.name).join(" · ")}</TableCell>
                                        </TableRow>
                                    ))}
                                {!isLoading && filtered.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {search ? "Aucun questionnaire ne correspond à la recherche." : "Aucun questionnaire pour le moment."}
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
                            : filtered.map((q) => (
                                <Card variant="outlined" key={q.id}>
                                    <CardContent sx={{ p: 2.5 }}>
                                        <Stack spacing={1.8}>
                                            <Box>
                                                <Typography variant="h6" fontWeight={800} color="text.primary">
                                                    {q.id} · {q.title}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                                                    {q.description}
                                                </Typography>
                                            </Box>
                                            <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                                                {q.dimensions.map((d) => (
                                                    <Chip key={d.name} label={d.name} size="small" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue }} />
                                                ))}
                                            </Stack>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))}
                        {!isLoading && filtered.length === 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                                {search ? "Aucun questionnaire ne correspond à la recherche." : "Aucun questionnaire pour le moment."}
                            </Typography>
                        )}
                    </Stack>
                </CardContent>
            </Card>
        </Stack>
    );
}
