import { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Link as MuiLink,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import { useRuntime } from "../../contexts/runtime-context";
import { useSession } from "../../contexts/session-context";
import { useSettings, type ThemePreference } from "../../contexts/settings-context";
import { getDriveImplementation } from "../../drives";

import { ConfirmDriveActionDialog } from "./home-dialogs";

export { default as DrivesTab } from "./drives-tab";

const SignOutIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden focusable="false">
    <path
      d="M14 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2m-7-4h13m0 0-3-3m3 3-3 3"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

export function TasksTab() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Stack spacing={{ xs: 2, md: 2.5 }}>
      <Stack spacing={0.5}>
        <Typography variant="overline" color="text.secondary">
          Tasks
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
          Background activity
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Uploads, downloads and chunk operations show up here while they run.
        </Typography>
      </Stack>

      <Card
        sx={{
          borderRadius: 6,
          borderStyle: "dashed",
          py: { xs: 5, md: 7 },
          textAlign: "center",
          bgcolor: alpha(theme.palette.primary.main, isDark ? 0.05 : 0.04),
        }}
      >
        <CardContent>
          <Stack alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha(
                  theme.palette.primary.main,
                  isDark ? 0.15 : 0.1,
                ),
                color: theme.palette.primary.main,
              }}
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                aria-hidden
                focusable="false"
              >
                <path
                  d="M12 6v6l4 2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Nothing running
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 360 }}
            >
              Active uploads, copies, and downloads will show progress here so
              you can pause, retry, or cancel them.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

export function AccountTab() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const session = useSession();
  const { theme: themePreference, setAppSettings } = useSettings();
  const runtime = useRuntime();

  const [logoutOpen, setLogoutOpen] = useState(false);

  if (!session.primaryDrive) {
    return null;
  }

  const primary = session.primaryDrive;
  const providerLabel =
    getDriveImplementation(primary.provider)?.providerLabel || primary.provider;
  const providerIcon = getDriveImplementation(primary.provider)?.providerIcon;
  const initials = primary.email[0]?.toUpperCase() || "S";

  return (
    <Stack spacing={{ xs: 2, md: 2.5 }}>
      <Stack spacing={0.5}>
        <Typography variant="overline" color="text.secondary">
          Account
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
          Profile and preferences
        </Typography>
      </Stack>

      <Card
        sx={{
          borderRadius: 6,
          overflow: "hidden",
          border: `1px solid ${alpha(theme.palette.primary.main, isDark ? 0.28 : 0.16)}`,
          background: isDark
            ? `linear-gradient(140deg, ${alpha(theme.palette.primary.dark, 0.45)} 0%, ${alpha(theme.palette.primary.main, 0.12)} 60%, transparent 100%)`
            : `linear-gradient(140deg, ${alpha(theme.palette.primary.main, 0.16)} 0%, ${alpha(theme.palette.primary.light, 0.16)} 60%, transparent 100%)`,
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              sx={{
                width: 60,
                height: 60,
                bgcolor: alpha(theme.palette.primary.main, 0.18),
                color: theme.palette.primary.main,
                fontWeight: 800,
                fontSize: "1.4rem",
                border: `1px solid ${alpha(theme.palette.primary.main, 0.32)}`,
              }}
            >
              {initials}
            </Avatar>
            <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }} noWrap>
                {primary.email.split("@")[0] || primary.email}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {primary.email}
              </Typography>
              <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
                sx={{ mt: 0.5 }}
              >
                <Box sx={{ display: "flex" }}>{providerIcon}</Box>
                <Chip
                  label={providerLabel}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    letterSpacing: 0.4,
                    bgcolor: alpha(theme.palette.primary.main, 0.14),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    color: theme.palette.primary.main,
                  }}
                />
              </Stack>
            </Stack>
          </Stack>

          <Divider
            sx={{ my: 2, borderColor: alpha(theme.palette.divider, 0.5) }}
          />

          <Button
            fullWidth
            variant="outlined"
            color="error"
            startIcon={SignOutIcon}
            onClick={() => setLogoutOpen(true)}
            sx={{ borderRadius: 999, fontWeight: 700 }}
          >
            Sign out of Spanned Drive
          </Button>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 5 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
            Appearance
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel id="home-theme-select-label">Theme</InputLabel>
            <Select
              labelId="home-theme-select-label"
              label="Theme"
              value={themePreference}
              onChange={(event) =>
                setAppSettings({ theme: event.target.value as ThemePreference })
              }
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="system">Follow system</MenuItem>
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 5 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
            About this build
          </Typography>
          <Stack spacing={0.75}>
            <DetailRow label="Environment" value={runtime.kind} />
            <DetailRow label="App version" value={runtime.appVersion} />
            <DetailRow
              label="Wrapper"
              value={
                runtime.kind === "tauri"
                  ? `Tauri ${runtime.wrapperVersion}`
                  : "Browser"
              }
            />
            <DetailRow label="Platform" value={runtime.platform} truncate />
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Stack
            direction="row"
            spacing={1.5}
            useFlexGap
            sx={{ flexWrap: "wrap" }}
          >
            <MuiLink
              component={RouterLink}
              to="/privacy"
              underline="hover"
              sx={{ fontWeight: 600 }}
            >
              Privacy Policy
            </MuiLink>
            <Typography component="span" variant="body2" color="text.disabled">
              ·
            </Typography>
            <MuiLink
              component={RouterLink}
              to="/terms"
              underline="hover"
              sx={{ fontWeight: 600 }}
            >
              Terms of Service
            </MuiLink>
          </Stack>
        </CardContent>
      </Card>

      <ConfirmDriveActionDialog
        open={logoutOpen}
        title="Sign out of Spanned Drive"
        description="This signs out the primary drive and clears the local session. Secondary drives stay remembered, but you will need to sign in again to use them."
        confirmLabel="Sign out"
        confirmColor="error"
        onClose={() => setLogoutOpen(false)}
        onConfirm={() => {
          session.logoutPrimaryDrive();
          setLogoutOpen(false);
          navigate("/signin");
        }}
      />
    </Stack>
  );
}

function DetailRow({
  label,
  value,
  truncate = false,
}: {
  label: string;
  value: string | number;
  truncate?: boolean;
}) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="baseline"
      justifyContent="space-between"
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 700 }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        noWrap={truncate}
        sx={{
          fontWeight: 600,
          textAlign: "right",
          maxWidth: truncate ? "70%" : undefined,
        }}
        title={typeof value === "string" ? value : undefined}
      >
        {value}
      </Typography>
    </Stack>
  );
}
