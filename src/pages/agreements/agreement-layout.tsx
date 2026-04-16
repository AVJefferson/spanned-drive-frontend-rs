import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

interface AgreementLayoutProps {
  title: string;
  currentVersion: string;
  currentDateParam: string;
  sortedVersions: string[];
  onVersionChange: (version: string) => void;
  missingMessage: string;
  alternateLink: { to: string; label: string };
  children: React.ReactNode;
}

export function AgreementLayout({
  title,
  currentVersion,
  currentDateParam,
  sortedVersions,
  onVersionChange,
  missingMessage,
  alternateLink,
  children,
}: AgreementLayoutProps) {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", px: { xs: 2, md: 4 }, py: { xs: 2, md: 3 } }}>
      <Stack spacing={2} sx={{ maxWidth: 1240, mx: "auto" }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="overline" color="text.secondary">
              Spanned Drive
            </Typography>
            <Typography variant="h3">{title}</Typography>
          </Box>
          <Paper variant="outlined" sx={{ p: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              Version
            </Typography>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={currentVersion}
                onChange={(event) => onVersionChange(String(event.target.value))}
              >
                {sortedVersions.map((version) => (
                  <MenuItem key={version} value={version}>
                    {version === "current" ? "Current" : version}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
        </Stack>

        {!sortedVersions.includes(currentDateParam) && currentDateParam !== "" ? (
          <Paper sx={{ p: 2, bgcolor: "warning.main", color: "warning.contrastText" }}>
            <Typography variant="body2">{missingMessage}</Typography>
          </Paper>
        ) : null}

        <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 5 }}>{children}</Paper>

        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
          <Button component={RouterLink} to="/" variant="outlined">
            Back to Home
          </Button>
          <Button component={RouterLink} to={alternateLink.to} variant="text">
            {alternateLink.label}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
