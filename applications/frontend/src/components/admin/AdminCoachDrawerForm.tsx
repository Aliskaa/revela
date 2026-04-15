import {
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import * as React from "react";
import { AdminDrawerForm } from "./AdminDrawerForm";

export type CoachDrawerMode = "create" | "edit";

export type CoachFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  campaigns: number;
  participants: number;
  status: "active" | "inactive";
  notes: string;
};

export type AdminCoachDrawerFormProps = {
  open: boolean;
  mode: CoachDrawerMode;
  initialValues?: Partial<CoachFormValues>;
  onClose: () => void;
  onSubmit: (values: CoachFormValues) => void;
  isSubmitting?: boolean;
};

const defaultValues: CoachFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  company: "",
  campaigns: 0,
  participants: 0,
  status: "active",
  notes: "",
};

export function AdminCoachDrawerForm({
  open,
  mode,
  initialValues,
  onClose,
  onSubmit,
  isSubmitting = false,
}: AdminCoachDrawerFormProps) {
  const [values, setValues] = React.useState<CoachFormValues>({
    ...defaultValues,
    ...initialValues,
  });

  React.useEffect(() => {
    if (open) {
      setValues({
        ...defaultValues,
        ...initialValues,
      });
    }
  }, [open, initialValues]);

  const title = mode === "create" ? "Nouveau coach" : "Éditer le coach";
  const subtitle =
    mode === "create"
      ? "Créer un coach et le relier à ses campagnes."
      : "Mettre à jour les informations du coach.";

  const handleChange = <K extends keyof CoachFormValues>(key: K, value: CoachFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => onSubmit(values);

  return (
    <AdminDrawerForm
      open={open}
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={mode === "create" ? "Créer" : "Enregistrer"}
      isSubmitting={isSubmitting}
    >
      <Stack spacing={2.25}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Identité
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Prénom"
              value={values.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              fullWidth
            />
            <TextField
              label="Nom"
              value={values.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              fullWidth
            />
            <TextField
              label="Email"
              value={values.email}
              onChange={(e) => handleChange("email", e.target.value)}
              fullWidth
            />
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Référentiel
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Organisation"
              value={values.company}
              onChange={(e) => handleChange("company", e.target.value)}
              fullWidth
            />
            <TextField
              label="Nombre de campagnes"
              type="number"
              value={values.campaigns}
              onChange={(e) => handleChange("campaigns", Number(e.target.value))}
              fullWidth
            />
            <TextField
              label="Nombre de participants"
              type="number"
              value={values.participants}
              onChange={(e) => handleChange("participants", Number(e.target.value))}
              fullWidth
            />
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Statut
          </Typography>
          <FormControl fullWidth>
            <InputLabel id="coach-status-label">Statut</InputLabel>
            <Select
              labelId="coach-status-label"
              label="Statut"
              value={values.status}
              onChange={(e) => handleChange("status", e.target.value as CoachFormValues["status"])}
            >
              <MenuItem value="active">Actif</MenuItem>
              <MenuItem value="inactive">Inactif</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Notes
          </Typography>
          <TextField
            label="Commentaire"
            value={values.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            multiline
            minRows={4}
            fullWidth
          />
        </Box>
      </Stack>
    </AdminDrawerForm>
  );
}

/*
Usage:

const [open, setOpen] = useState(false);

<AdminCoachDrawerForm
  open={open}
  mode="create"
  onClose={() => setOpen(false)}
  onSubmit={(values) => {
    console.log(values);
  }}
/>
*/
