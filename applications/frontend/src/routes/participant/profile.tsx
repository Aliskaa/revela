import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Building2,
  Mail,
  MapPin,
  PencilLine,
  Sparkles,
  UserRound,
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
  Typography,
} from "@mui/material";

export const Route = createFileRoute("/participant/profile")({
  component: ParticipantProfileRoute,
});

const COLORS = {
  blue: "rgb(15,24,152)",
  yellow: "rgb(255,204,0)",
  border: "rgba(15,23,42,0.10)",
};

const profile = {
  firstName: "Thomas",
  lastName: "Dubois",
  email: "thomas.dubois@ville-lyon.fr",
  company: "Ville de Lyon",
  direction: "Direction Sports & Jeunesse",
  service: "Développement des équipes",
  functionLevel: "Management intermédiaire",
};

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

function InfoCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Box sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 4, p: 2 }}>
      <Stack direction="row" spacing={1.3} alignItems="start">
        <Box sx={{ width: 38, height: 38, borderRadius: 3, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, display: "grid", placeItems: "center", flex: "none" }}>
          <Icon size={16} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
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

function ParticipantProfileRoute() {
  return (
    <Stack spacing={3}>
      <Card variant="outlined" sx={{ borderRadius: 6, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack spacing={2.5} direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ xs: "start", lg: "start" }}>
            <Box>
              <Chip label="Profil participant" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, mb: 1.5 }} />
              <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                Mon profil
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}>
                Les données de base sont préremplies par la campagne. Le participant peut consulter ses informations et compléter les éléments utiles à son parcours.
              </Typography>
            </Box>

            <Box sx={{ borderRadius: 4, bgcolor: "rgba(15,23,42,0.03)", p: 2.2, width: { xs: "100%", sm: 340 } }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 48, height: 48, borderRadius: 4, bgcolor: COLORS.blue, color: "#fff", display: "grid", placeItems: "center" }}>
                  <UserRound size={20} />
                </Box>
                <Box>
                  <Typography fontWeight={800} color="text.primary">
                    {profile.firstName} {profile.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Participant actif
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
        <InfoCard icon={UserRound} label="Nom" value={`${profile.firstName} ${profile.lastName}`} />
        <InfoCard icon={Mail} label="Email" value={profile.email} />
        <InfoCard icon={Building2} label="Organisation" value={profile.company} />
        <InfoCard icon={Users} label="Niveau" value={profile.functionLevel} />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.15fr 0.85fr" }, gap: 3, alignItems: "start" }}>
        <Card variant="outlined" sx={{ borderRadius: 6, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
          <CardContent sx={{ p: 2.5 }}>
            <SectionTitle title="Informations préremplies" subtitle="Ces informations sont injectées à partir du fichier d’import de campagne." />

            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField label="Prénom" defaultValue={profile.firstName} fullWidth />
              <TextField label="Nom" defaultValue={profile.lastName} fullWidth />
              <TextField label="Email" defaultValue={profile.email} fullWidth />
              <TextField label="Organisation" defaultValue={profile.company} fullWidth />
              <TextField label="Direction" defaultValue={profile.direction} fullWidth />
              <TextField label="Service" defaultValue={profile.service} fullWidth />
              <TextField label="Fonction" defaultValue={profile.functionLevel} fullWidth />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ mt: 2.5 }}>
              <Button variant="contained" disableElevation startIcon={<PencilLine size={16} />} sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}>
                Mettre à jour
              </Button>
              <Button variant="outlined" sx={{ borderRadius: 3, textTransform: "none" }}>
                Réinitialiser
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Stack spacing={2.5}>
          <Card variant="outlined" sx={{ borderRadius: 6, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle title="Rôle dans la campagne" subtitle="Le profil participant reste simple et lisible." />
              <Stack spacing={1.4} sx={{ mt: 1.5 }}>
                <InfoCard icon={Sparkles} label="Accès" value="Participant uniquement" />
                <InfoCard icon={MapPin} label="Contexte" value="Rattaché à une campagne active" />
                <InfoCard icon={Users} label="Finalité" value="Auto-évaluation, pairs, test, restitution" />
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 6, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle title="Confidentialité" subtitle="Les espaces sont séparés pour préserver la confiance du participant." />
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Les données du participant ne sont visibles que dans son espace. Le coach et l’administration disposent de vues distinctes, avec des droits différents.
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Stack>
  );
}
