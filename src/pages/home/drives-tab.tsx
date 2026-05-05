import { useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { type DriveSession, useSession } from "../../contexts/session-context";
import { Drives, getDriveImplementation } from "../../drives";

import {
  AddSecondaryDriveDialog,
  ConfirmDriveActionDialog,
} from "./home-dialogs";

export interface DrivesTabProps {
  isMobile?: boolean;
}

const PlusIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden focusable="false">
    <path
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const PrimaryStarIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden focusable="false">
    <path
      d="m12 3.5 2.6 5.5 6 .8-4.3 4.2 1.1 6L12 17l-5.4 3 1-6L3.4 9.8l6-.8Z"
      fill="currentColor"
    />
  </svg>
);

function deriveDriveLabel(drive: DriveSession) {
  return drive.email.split("@")[0] || drive.email;
}

function findProviderLabel(provider: string) {
  return getDriveImplementation(provider)?.providerLabel || provider;
}

function findProviderIcon(provider: string) {
  return getDriveImplementation(provider)?.providerIcon || null;
}

export default function DrivesTab({ isMobile = false }: DrivesTabProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const session = useSession();

  const [addOpen, setAddOpen] = useState(false);
  const [logoutTarget, setLogoutTarget] = useState<DriveSession | null>(null);
  const [forgetTarget, setForgetTarget] = useState<DriveSession | null>(null);

  const loggedInSecondaries =
    session.secondaryDrives?.filter((drive) => drive.refreshToken) || [];
  const loggedOutSecondaries =
    session.secondaryDrives?.filter((drive) => !drive.refreshToken) || [];

  const totalConnected =
    (session.primaryDrive ? 1 : 0) + loggedInSecondaries.length;
  const totalProviders = useMemo(
    () =>
      new Set(
        [
          session.primaryDrive?.provider,
          ...loggedInSecondaries.map((drive) => drive.provider),
        ].filter(Boolean) as string[],
      ).size,
    [session.primaryDrive, loggedInSecondaries],
  );

  return (
    <Stack spacing={{ xs: 2, md: 2.75 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 1.5, sm: 2 }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
      >
        <Button
          variant="contained"
          startIcon={PlusIcon}
          onClick={() => setAddOpen(true)}
          sx={{
            borderRadius: 999,
            fontWeight: 700,
            alignSelf: { sm: "center" },
          }}
        >
          Add drive
        </Button>
      </Stack>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        useFlexGap
        sx={{ flexWrap: "wrap" }}
      ></Stack>

      {session.primaryDrive ? (
        <PrimaryDriveCard drive={session.primaryDrive} />
      ) : null}

      {loggedInSecondaries.length > 0 ? (
        <Stack spacing={1.25}>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ letterSpacing: 0.5, textTransform: "uppercase" }}
          >
            Secondary drives
          </Typography>
          <Stack spacing={1.25}>
            {loggedInSecondaries.map((drive) => (
              <SecondaryDriveCard
                key={`${drive.provider}:${drive.email}`}
                drive={drive}
                onLogout={() => setLogoutTarget(drive)}
              />
            ))}
          </Stack>
        </Stack>
      ) : null}

      {loggedOutSecondaries.length > 0 ? (
        <Stack spacing={1.25}>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ letterSpacing: 0.5, textTransform: "uppercase" }}
          >
            Remembered (signed out)
          </Typography>
          <Stack spacing={1.25}>
            {loggedOutSecondaries.map((drive) => (
              <RememberedDriveCard
                key={`${drive.provider}:${drive.email}`}
                drive={drive}
                onForget={() => setForgetTarget(drive)}
              />
            ))}
          </Stack>
        </Stack>
      ) : null}

      {!session.primaryDrive && loggedInSecondaries.length === 0 ? (
        <Card
          variant="outlined"
          sx={{
            borderRadius: 5,
            borderStyle: "dashed",
            py: { xs: 4, md: 6 },
            textAlign: "center",
            bgcolor: alpha(theme.palette.primary.main, isDark ? 0.06 : 0.04),
          }}
        >
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              No drives yet
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1, maxWidth: 380, mx: "auto" }}
            >
              Connect a cloud account to begin spanning files. You can add as
              many as you want from any supported provider.
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 2.5, borderRadius: 999, fontWeight: 700 }}
              onClick={() => setAddOpen(true)}
            >
              Connect a drive
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <AddSecondaryDriveDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        isMobile={isMobile}
      />

      <ConfirmDriveActionDialog
        open={Boolean(logoutTarget)}
        title="Sign out drive"
        description={
          logoutTarget
            ? `Sign out ${logoutTarget.email}? Spanned Drive will keep this drive on file but stop using it for new uploads until you sign in again.`
            : ""
        }
        confirmLabel="Sign out"
        confirmColor="warning"
        onClose={() => setLogoutTarget(null)}
        onConfirm={() => {
          if (logoutTarget) {
            session.logoutSecondaryDrive(
              logoutTarget.provider,
              logoutTarget.email,
            );
          }
          setLogoutTarget(null);
        }}
      />

      <ConfirmDriveActionDialog
        open={Boolean(forgetTarget)}
        title="Forget remembered drive"
        description={
          forgetTarget
            ? `Forget ${forgetTarget.email}? Spanned Drive will remove all local references to this account. Files already uploaded to that drive remain on the provider.`
            : ""
        }
        confirmLabel="Forget"
        confirmColor="error"
        onClose={() => setForgetTarget(null)}
        onConfirm={() => {
          if (forgetTarget) {
            session.removeSecondaryDrive(
              forgetTarget.provider,
              forgetTarget.email,
            );
          }
          setForgetTarget(null);
        }}
      />
    </Stack>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        flex: { xs: "1 1 0", sm: "0 0 auto" },
        minWidth: 120,
        px: 2,
        py: 1.25,
        borderRadius: 4,
        bgcolor: alpha(theme.palette.primary.main, isDark ? 0.1 : 0.06),
        border: `1px solid ${alpha(
          theme.palette.primary.main,
          isDark ? 0.25 : 0.14,
        )}`,
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 700 }}
      >
        {label}
      </Typography>
      <Typography
        variant="h5"
        sx={{ fontWeight: 800, lineHeight: 1.1, mt: 0.25 }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function PrimaryDriveCard({ drive }: { drive: DriveSession }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const providerLabel = findProviderLabel(drive.provider);
  const icon = findProviderIcon(drive.provider);

  return (
    <Card
      sx={{
        borderRadius: 6,
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${alpha(
          theme.palette.primary.main,
          isDark ? 0.32 : 0.18,
        )}`,
        background: isDark
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.55)} 0%, ${alpha(theme.palette.primary.main, 0.18)} 60%, transparent 100%)`
          : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.18)} 0%, ${alpha(theme.palette.primary.light, 0.18)} 55%, transparent 100%)`,
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: isDark ? alpha("#fff", 0.06) : "#fff",
              border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box sx={{ color: theme.palette.warning.main, display: "flex" }}>
                {PrimaryStarIcon}
              </Box>
              <Typography
                variant="overline"
                sx={{
                  fontWeight: 700,
                  letterSpacing: 1,
                  color: "text.secondary",
                }}
              >
                Primary drive
              </Typography>
            </Stack>
            <Typography variant="h6" sx={{ fontWeight: 800 }} noWrap>
              {deriveDriveLabel(drive)}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {drive.email} · {providerLabel}
            </Typography>
          </Stack>
        </Stack>

        <Divider
          sx={{ my: 2, borderColor: alpha(theme.palette.divider, 0.5) }}
        />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
        >
          <Typography variant="body2" color="text.secondary">
            Sign-in active. Storage usage will appear here once sync lands.
          </Typography>
          <Chip
            label="Active"
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: "0.7rem",
              letterSpacing: 0.5,
              textTransform: "uppercase",
              bgcolor: alpha(theme.palette.success.main, 0.18),
              color: theme.palette.success.main,
              border: `1px solid ${alpha(theme.palette.success.main, 0.35)}`,
              alignSelf: { xs: "flex-start", sm: "auto" },
            }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

function SecondaryDriveCard({
  drive,
  onLogout,
}: {
  drive: DriveSession;
  onLogout: () => void;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const providerLabel = findProviderLabel(drive.provider);
  const icon = findProviderIcon(drive.provider);

  return (
    <Card
      sx={{
        borderRadius: 5,
        bgcolor: alpha(theme.palette.background.paper, isDark ? 0.65 : 1),
        transition: "transform 160ms ease, border-color 200ms ease",
        "&:hover": {
          transform: "translateY(-1px)",
          borderColor: theme.palette.primary.main,
        },
      }}
    >
      <CardContent
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.75,
          py: { xs: 1.75, md: 2 },
          "&:last-child": { pb: { xs: 1.75, md: 2 } },
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: isDark ? alpha("#fff", 0.06) : "#fff",
            border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
            {deriveDriveLabel(drive)}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {drive.email} · {providerLabel}
          </Typography>
        </Stack>
        <Button
          size="small"
          variant="text"
          color="warning"
          onClick={onLogout}
          sx={{ borderRadius: 999, fontWeight: 700 }}
        >
          Sign out
        </Button>
      </CardContent>
    </Card>
  );
}

function RememberedDriveCard({
  drive,
  onForget,
}: {
  drive: DriveSession;
  onForget: () => void;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const Implementation = Drives[drive.provider];
  const providerLabel = findProviderLabel(drive.provider);

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 5,
        borderStyle: "dashed",
        bgcolor: alpha(theme.palette.background.paper, isDark ? 0.4 : 0.6),
      }}
    >
      <CardContent
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          py: 1.5,
          "&:last-child": { pb: 1.5 },
        }}
      >
        <Avatar
          sx={{
            bgcolor: "transparent",
            width: 36,
            height: 36,
            opacity: 0.7,
          }}
        >
          {Implementation?.providerIcon || drive.email[0].toUpperCase()}
        </Avatar>
        <Stack spacing={0.1} sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2" noWrap>
            {drive.email}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {providerLabel} · signed out
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.5}>
          <Button
            size="small"
            variant="outlined"
            onClick={() =>
              Implementation?.oauthRedirect("secondary", drive.email)
            }
            sx={{ borderRadius: 999, fontWeight: 700 }}
          >
            Sign in
          </Button>
          <IconButton
            size="small"
            color="error"
            aria-label={`Forget ${drive.email}`}
            onClick={onForget}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              aria-hidden
              focusable="false"
            >
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </IconButton>
        </Stack>
      </CardContent>
    </Card>
  );
}
