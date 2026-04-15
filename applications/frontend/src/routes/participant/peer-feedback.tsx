import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  ChevronRight,
  CircleUserRound,
  ClipboardList,
  Hash,
  Mail,
  Save,
  Sparkles,
  Users,
} from "lucide-react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

export const Route = createFileRoute("/participant/peer-feedback")({
  component: ParticipantPeerFeedbackRoute,
});

const COLORS = {
  blue: "rgb(15,24,152)",
  yellow: "rgb(255,204,0)",
  border: "rgba(15,23,42,0.10)",
};

type RatingItem = {
  label: string;
  value: number | null;
};

type DimensionBlock = {
  dimension: string;
  description: string;
  items: RatingItem[];
};

type PeerInvite = {
  name: string;
  email: string;
  status: "Envoyé" | "Répondu" | "En attente";
};

const questionnaire = {
  code: "B",
  title: "Feedback des pairs — Questionnaire B",
  subtitle: "Les pairs notent les short labels de 1 à 9, comme pour l’auto-évaluation.",
};

const dimensions: DimensionBlock[] = [
  {
    dimension: "Inclusion",
    description: "Comment le participant est perçu dans les relations et le sentiment d’appartenance.",
    items: [
      { label: "J’inclus les gens.", value: 8 },
      { label: "Je veux inclure les gens.", value: 7 },
      { label: "Les gens m’incluent.", value: 6 },
      { label: "Je veux que les gens m’incluent.", value: 6 },
    ],
  },
  {
    dimension: "Contrôle",
    description: "Comment le participant est perçu dans la prise d’influence et la décision.",
    items: [
      { label: "Je contrôle les gens.", value: 5 },
      { label: "Je veux contrôler les gens.", value: 5 },
      { label: "Les gens me contrôlent.", value: 4 },
      { label: "Je veux que les gens me contrôlent.", value: 4 },
    ],
  },
  {
    dimension: "Ouverture",
    description: "Comment le participant est perçu dans le partage émotionnel et relationnel.",
    items: [
      { label: "Je m’ouvre aux gens.", value: 7 },
      { label: "Je veux m’ouvrir aux gens.", value: 6 },
      { label: "Les gens s’ouvrent à moi.", value: 7 },
      { label: "Je veux que les gens s’ouvrent à moi.", value: 6 },
    ],
  },
];

const peers: PeerInvite[] = [
  { name: "Marie Dupont", email: "marie.dupont@ville-lyon.fr", status: "Répondu" },
  { name: "Paul Martin", email: "paul.martin@ville-lyon.fr", status: "En attente" },
  { name: "Claire Durand", email: "claire.durand@ville-lyon.fr", status: "Envoyé" },
];

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
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
  );
}

function InfoPill({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Box sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 4, p: 1.8 }}>
      <Stack direction="row" spacing={1.2} alignItems="start">
        <Box sx={{ width: 38, height: 38, borderRadius: 3, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, display: "grid", placeItems: "center", flex: "none" }}>
          <Icon size={16} />
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.25, lineHeight: 1.6 }}>
            {value}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function RatingScale({ value }: { value: number | null }) {
  return (
    <ToggleButtonGroup value={value} exclusive size="small" sx={{ flexWrap: "wrap", gap: 0.75 }}>
      {Array.from({ length: 9 }, (_, index) => {
        const n = index + 1;
        return (
          <ToggleButton
            key={n}
            value={n}
            sx={{
              minWidth: 38,
              height: 38,
              borderRadius: 2,
              borderColor: "rgba(15,23,42,0.12)",
              color: "text.primary",
              "&.Mui-selected": {
                bgcolor: COLORS.blue,
                color: "#fff",
              },
              "&.Mui-selected:hover": {
                bgcolor: "rgb(10,18,130)",
              },
            }}
          >
            {n}
          </ToggleButton>
        );
      })}
    </ToggleButtonGroup>
  );
}

function DimensionCard({ block }: { block: DimensionBlock }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 6, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Box>
              <Typography variant="h6" fontWeight={800} color="text.primary">
                {block.dimension}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                {block.description}
              </Typography>
            </Box>
            <Chip label="Pairs" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue }} />
          </Stack>

          <Stack spacing={1.5}>
            {block.items.map((item) => (
              <Box key={item.label} sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 4, p: 1.8 }}>
                <Stack spacing={1.4}>
                  <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="start">
                    <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.6 }}>
                      {item.label}
                    </Typography>
                    <Chip label={item.value ?? "—"} size="small" sx={{ borderRadius: 99, bgcolor: "rgba(255,204,0,0.16)", color: "rgb(180,120,0)" }} />
                  </Stack>
                  <RatingScale value={item.value} />
                </Stack>
              </Box>
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function PeerRow({ peer }: { peer: PeerInvite }) {
  const chipSx =
    peer.status === "Répondu"
      ? { bgcolor: "rgba(16,185,129,0.12)", color: "rgb(4,120,87)" }
      : peer.status === "Envoyé"
        ? { bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue }
        : { bgcolor: "rgba(255,204,0,0.16)", color: "rgb(180,120,0)" };

  return (
    <Stack direction="row" spacing={1.3} alignItems="center" sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 4, p: 1.8 }}>
      <Box sx={{ width: 38, height: 38, borderRadius: 3, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, display: "grid", placeItems: "center", flex: "none" }}>
        <CircleUserRound size={16} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" fontWeight={700} color="text.primary">
          {peer.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {peer.email}
        </Typography>
      </Box>
      <Chip label={peer.status} size="small" sx={{ borderRadius: 99, ...chipSx }} />
    </Stack>
  );
}

function ParticipantPeerFeedbackRoute() {
  return (
    <Stack spacing={3}>
      <Card variant="outlined" sx={{ borderRadius: 6, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack spacing={2.5} direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ xs: "start", lg: "start" }}>
            <Box>
              <Chip label="Feedback des pairs" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, mb: 1.5 }} />
              <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                {questionnaire.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}>
                Les pairs utilisent la même logique de saisie que l’auto-évaluation : une note de 1 à 9 sur les short labels.
              </Typography>
            </Box>

            <Card variant="outlined" sx={{ borderRadius: 4, borderColor: COLORS.border, width: { xs: "100%", sm: 340 } }}>
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ width: 48, height: 48, borderRadius: 4, bgcolor: COLORS.blue, color: "#fff", display: "grid", placeItems: "center" }}>
                    <Sparkles size={20} />
                  </Box>
                  <Box>
                    <Typography fontWeight={800} color="text.primary">
                      Saisie pairs
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Une note par short label
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
        <InfoPill icon={ClipboardList} label="Questionnaire" value={questionnaire.code} />
        <InfoPill icon={BadgeCheck} label="Type" value="Feedback pairs" />
        <InfoPill icon={Hash} label="Échelle" value="1 à 9" />
        <InfoPill icon={Users} label="Pairs" value="3 à 5 répondants" />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.2fr 0.8fr" }, gap: 3, alignItems: "start" }}>
        <Card variant="outlined" sx={{ borderRadius: 6, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
          <CardContent sx={{ p: 2.5 }}>
            <SectionTitle title="Saisie des feedbacks des pairs" subtitle="Les réponses se structurent par dimension pour garder une expérience compacte." />
            <Divider sx={{ my: 2 }} />
            <Stack spacing={2}>
              {dimensions.map((block) => (
                <DimensionCard key={block.dimension} block={block} />
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Stack spacing={2.5}>
          <Card variant="outlined" sx={{ borderRadius: 6, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle title="Invitations envoyées" subtitle="Suivi simple des pairs sollicités." />
              <Stack spacing={1.3} sx={{ mt: 2 }}>
                {peers.map((peer) => (
                  <PeerRow key={peer.email} peer={peer} />
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 6, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle title="Inviter un pair" subtitle="L’ajout reste très simple pour ne pas interrompre le flux." />
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                <TextField label="Nom" placeholder="Prénom Nom" fullWidth />
                <TextField label="Email" placeholder="pair@domaine.fr" fullWidth />
                <Button variant="contained" disableElevation startIcon={<Mail size={16} />} sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}>
                  Envoyer l’invitation
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 6, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle title="Actions" subtitle="Sauvegarder ou poursuivre le parcours." />
              <Stack spacing={1.2} sx={{ mt: 2 }}>
                <Button variant="contained" disableElevation startIcon={<Save size={16} />} sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}>
                  Enregistrer
                </Button>
                <Button variant="outlined" endIcon={<ChevronRight size={16} />} sx={{ borderRadius: 3, textTransform: "none" }}>
                  Continuer vers le test
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Stack>
  );
}
