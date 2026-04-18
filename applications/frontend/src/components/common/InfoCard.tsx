import { Box, Stack, Typography } from "@mui/material";

import { Card } from "@mui/material";

const COLORS = {
  blue: "rgb(15,24,152)",
  yellow: "rgb(255,204,0)",
  border: "rgba(15,23,42,0.10)",
};

export function InfoCard({ icon: Icon, label, value, color = COLORS.blue, borderColor = COLORS.border }: { icon: React.ElementType; label: string; value: string; color?: string, borderColor?: string }) {
    return (
        <Card variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" spacing={1.3} alignItems="start">
          <Box sx={{ width: 38, height: 38, borderRadius: 3, bgcolor: borderColor, color: color, display: "grid", placeItems: "center", flex: "none" }}>
            <Icon size={16} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.25, lineHeight: 1.6 }}>{value}</Typography>
          </Box>
        </Stack>
      </Card>
    );
  }
  