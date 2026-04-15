import * as React from "react";
import { useParticipantSession } from "@/hooks/participantSession";
import type { ParticipantSession } from "@/api/types";
import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarCheck2,
  Clock3,
  MessageSquare,
  PhoneCall,
  Sparkles,
  UserRound,
  Users,
  Video,
} from "lucide-react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export const Route = createFileRoute("/participant/coach")({
  component: ParticipantCoachRoute,
});

const COLORS = {
  blue: "rgb(15,24,152)",
  yellow: "rgb(255,204,0)",
  border: "rgba(15,23,42,0.10)",
};

type ContactChannel = {
  label: string;
  value: string;
  icon: React.ElementType;
};

type ParticipantAssignment = ParticipantSession["assignments"][number];
type CoachView = {
  name: string;
  title: string;
  company: string;
  status: string;
  bio: string;
  campaignName: string;
  questionnaire: string;
};

const coach = {
  name: "Claire Martin",
  title: "Coach référente Révéla",
  company: "AOR Conseil",
  status: "Disponible",
  bio: "J’accompagne la lecture des écarts ICO et la préparation de la restitution. Mon rôle est d’aider à transformer les résultats en questions utiles.",
};

const nextSession = {
  date: "Jeudi 18 avril",
  time: "14:00 – 15:00",
  format: "Visioconférence",
  topic: "Restitution des résultats et préparation du plan d’action",
};

const channels: ContactChannel[] = [
  { label: "Email", value: "claire.martin@aor-conseil.fr", icon: MessageSquare },
  { label: "Téléphone", value: "+33 6 00 00 00 00", icon: PhoneCall },
  { label: "Visio", value: "Lien envoyé par email", icon: Video },
];

const coachFromAssignment = (assignment?: ParticipantAssignment): CoachView => ({
  ...coach,
  name: assignment?.coach_name ?? "Coach non attribue",
  company: assignment?.company_name ?? "Organisation non renseignee",
  status: assignment?.campaign_status === "active" ? "Disponible" : "En attente",
  campaignName: assignment?.campaign_name ?? "Aucune campagne active",
  questionnaire: assignment?.questionnaire_title ?? assignment?.questionnaire_id ?? "Aucun questionnaire assigne",
  bio: assignment?.coach_name
    ? "Votre coach accompagne la lecture des resultats et la preparation de la restitution de campagne."
    : "Aucun coach n'est encore rattache a votre campagne participant.",
});

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

function CoachHeader({ coachView }: { coachView: CoachView }) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack spacing={2.5} direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ xs: "start", lg: "start" }}>
          <Box>
            <Chip label={coachView.status} sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, mb: 1.5 }} />
            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
              Mon coach
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7, maxWidth: 840 }}>
              Cette page présente le coach associé à la campagne, les moyens de contact et la séance de restitution à venir.
            </Typography>
          </Box>

          <Card variant="outlined" sx={{ width: { xs: "100%", sm: 340 } }}>
            <CardContent sx={{ p: 2, display: "flex", gap: 1.5, alignItems: "center" }}>
              <Box sx={{ width: 48, height: 48, borderRadius: 4, bgcolor: COLORS.blue, color: "#fff", display: "grid", placeItems: "center" }}>
                <UserRound size={20} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={800} color="text.primary">
                  {coachView.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {coachView.title} · {coachView.company}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </CardContent>
    </Card>
  );
}

function CoachProfileCard({ coachView }: { coachView: CoachView }) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.5 }}>
        <SectionTitle title="Profil du coach" subtitle="Lecture simple du rôle et du cadre d’accompagnement." />

        <Stack spacing={2.5} sx={{ mt: 1.5 }}>
          <Box sx={{ borderRadius: 4, bgcolor: "rgba(15,23,42,0.03)", p: 2.2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              {coachView.bio}
            </Typography>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 }}>
            <InfoPill label="Rôle" value="Accompagnement / restitution" icon={Sparkles} />
            <InfoPill label="Cadre" value="Confidentialité et lecture partagée" icon={Users} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function NextSessionCard() {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.5 }}>
        <SectionTitle title="Prochaine séance" subtitle="La restitution est le temps de mise en sens des résultats." />

        <Stack spacing={1.5} sx={{ mt: 1.5 }}>
          <Card variant="outlined" sx={{ bgcolor: COLORS.blue, color: "#fff", p: 2.2 }}>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {nextSession.format}
            </Typography>
            <Typography variant="h6" fontWeight={800} sx={{ mt: 0.5 }}>
              {nextSession.date}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.4 }}>
              {nextSession.time}
            </Typography>
          </Card>

          <Stack spacing={1.25}>
            <SessionRow icon={Clock3} label="Durée" value="1 heure" />
            <SessionRow icon={CalendarCheck2} label="Objet" value={nextSession.topic} />
            <SessionRow icon={Video} label="Format" value={nextSession.format} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function SessionRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1.3} alignItems="start">
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
  );
}

function InfoPill({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <Card variant="outlined" sx={{ p: 1.8 }}>
      <Stack direction="row" spacing={1.2} alignItems="start">
        <Box sx={{ width: 36, height: 36, borderRadius: 3, bgcolor: "rgba(255,204,0,0.16)", color: "rgb(180,120,0)", display: "grid", placeItems: "center", flex: "none" }}>
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
    </Card>
  );
}

function ContactCard() {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.5 }}>
        <SectionTitle title="Contacter le coach" subtitle="Les canaux disponibles pour échanger avant ou après la séance." />

        <Stack spacing={1.3} sx={{ mt: 1.5 }}>
          {channels.map((channel) => (
            <Stack key={channel.label} direction="row" spacing={1.3} alignItems="center" sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 4, p: 1.8 }}>
              <Box sx={{ width: 38, height: 38, borderRadius: 3, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, display: "grid", placeItems: "center", flex: "none" }}>
                <channel.icon size={16} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">
                  {channel.label}
                </Typography>
                <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.25, lineHeight: 1.6 }}>
                  {channel.value}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

function MessageCard() {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.5 }}>
        <SectionTitle title="Message au coach" subtitle="Un court message pour préparer ou compléter la restitution." />

        <Stack spacing={1.5} sx={{ mt: 1.5 }}>
          <TextField fullWidth label="Objet" placeholder="Préparer notre séance de restitution" />
          <TextField fullWidth multiline minRows={5} label="Message" placeholder="Bonjour Claire, j’aimerais approfondir le point sur l’inclusion..." />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
            <Button variant="contained" disableElevation sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}>
              Envoyer
            </Button>
            <Button variant="outlined" sx={{ borderRadius: 3, textTransform: "none" }}>
              Enregistrer en brouillon
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ParticipantCoachRoute() {
  const { data: session, isLoading, isError } = useParticipantSession();
  const activeAssignment =
    session?.assignments.find(assignment => assignment.campaign_status === "active") ?? session?.assignments[0];
  const coachView = coachFromAssignment(activeAssignment);

  if (isLoading) {
    return (
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={800} color="text.primary">
            Chargement de votre coach
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
            Recuperation du coach rattache a votre campagne.
          </Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (isError || !session) {
    return <Alert severity="error">Impossible de charger votre coach pour le moment.</Alert>;
  }

  return (
    <Stack spacing={3}>
      <CoachHeader coachView={coachView} />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
        <Card variant="outlined">
          <CardContent sx={{ p: 2.3 }}>
            <Typography variant="body2" color="text.secondary">
              Statut
            </Typography>
            <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ mt: 0.5 }}>
              {coachView.status}
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardContent sx={{ p: 2.3 }}>
            <Typography variant="body2" color="text.secondary">
              Prochaine séance
            </Typography>
            <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ mt: 0.5 }}>
              {coachView.campaignName}
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardContent sx={{ p: 2.3 }}>
            <Typography variant="body2" color="text.secondary">
              Format
            </Typography>
            <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ mt: 0.5 }}>
              {coachView.questionnaire}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.2fr 0.8fr" }, gap: 3, alignItems: "start" }}>
        <Stack spacing={2.5}>
          <CoachProfileCard coachView={coachView} />
          <MessageCard />
        </Stack>

        <Stack spacing={2.5}>
          <NextSessionCard />
          <ContactCard />
        </Stack>
      </Box>
    </Stack>
  );
}
