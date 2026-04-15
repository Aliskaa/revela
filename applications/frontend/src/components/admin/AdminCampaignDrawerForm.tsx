import * as React from "react";
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
import { AdminDrawerForm } from "./AdminDrawerForm";

export type CampaignDrawerMode = "create" | "edit";

export type CampaignFormValues = {
  name: string;
  company: string;
  coach: string;
  questionnaire: string;
  startDate: string;
  endDate: string;
  status: "draft" | "active" | "closed";
  description: string;
};

export type AdminCampaignDrawerFormProps = {
  open: boolean;
  mode: CampaignDrawerMode;
  initialValues?: Partial<CampaignFormValues>;
  onClose: () => void;
  onSubmit: (values: CampaignFormValues) => void;
  isSubmitting?: boolean;
};

const defaultValues: CampaignFormValues = {
  name: "",
  company: "",
  coach: "",
  questionnaire: "B",
  startDate: "",
  endDate: "",
  status: "draft",
  description: "",
};

const questionnaireOptions = [
  { value: "B", label: "B — Comportement" },
  { value: "F", label: "F — Ressentis" },
  { value: "S", label: "S — Soi" },
];

export function AdminCampaignDrawerForm({
  open,
  mode,
  initialValues,
  onClose,
  onSubmit,
  isSubmitting = false,
}: AdminCampaignDrawerFormProps) {
  const [values, setValues] = React.useState<CampaignFormValues>({
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

  const title = mode === "create" ? "Nouvelle campagne" : "Éditer la campagne";
  const subtitle =
    mode === "create"
      ? "Créer une campagne et lui associer un questionnaire."
      : "Mettre à jour les informations de la campagne.";

  const handleChange = <K extends keyof CampaignFormValues>(key: K, value: CampaignFormValues[K]) => {
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
              label="Nom de la campagne"
              value={values.name}
              onChange={(e) => handleChange("name", e.target.value)}
              fullWidth
            />
            <TextField
              label="Description"
              value={values.description}
              onChange={(e) => handleChange("description", e.target.value)}
              multiline
              minRows={4}
              fullWidth
            />
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Affectation
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Entreprise"
              value={values.company}
              onChange={(e) => handleChange("company", e.target.value)}
              fullWidth
            />
            <TextField
              label="Coach"
              value={values.coach}
              onChange={(e) => handleChange("coach", e.target.value)}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="questionnaire-label">Questionnaire</InputLabel>
              <Select
                labelId="questionnaire-label"
                label="Questionnaire"
                value={values.questionnaire}
                onChange={(e) => handleChange("questionnaire", e.target.value)}
              >
                {questionnaireOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Dates et statut
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Date de début"
              type="date"
              value={values.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Date de fin"
              type="date"
              value={values.endDate}
              onChange={(e) => handleChange("endDate", e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="status-label">Statut</InputLabel>
              <Select
                labelId="status-label"
                label="Statut"
                value={values.status}
                onChange={(e) => handleChange("status", e.target.value as CampaignFormValues["status"])}
              >
                <MenuItem value="draft">Brouillon</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="closed">Clôturée</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>
      </Stack>
    </AdminDrawerForm>
  );
}

/*
Usage:

const [open, setOpen] = useState(false);

<AdminCampaignDrawerForm
  open={open}
  mode="create"
  onClose={() => setOpen(false)}
  onSubmit={(values) => {
    console.log(values);
  }}
/>
*/
