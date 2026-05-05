import { useMemo } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { useSession } from "../../contexts/session-context";
import { Drives } from "../../drives";

const CloseIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden focusable="false">
    <path
      d="M6 6l12 12M18 6 6 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export interface AddSecondaryDriveDialogProps {
  open: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

export function AddSecondaryDriveDialog({
  open,
  onClose,
  isMobile = false,
}: AddSecondaryDriveDialogProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm")) || isMobile;
  const session = useSession();

  const connectedKeys = useMemo(() => {
    const keys = new Set<string>();
    if (session.primaryDrive) {
      keys.add(`${session.primaryDrive.provider}::${session.primaryDrive.email}`);
    }
    session.secondaryDrives?.forEach((drive) => {
      if (drive.refreshToken) {
        keys.add(`${drive.provider}::${drive.email}`);
      }
    });
    return keys;
  }, [session.primaryDrive, session.secondaryDrives]);

  const providers = Object.values(Drives);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: fullScreen ? 0 : 4,
            bgcolor: "background.paper",
            backgroundImage: `linear-gradient(180deg, ${alpha(
              theme.palette.primary.main,
              isDark ? 0.06 : 0.03,
            )} 0%, transparent 60%)`,
            border: `1px solid ${alpha(
              theme.palette.primary.main,
              isDark ? 0.18 : 0.1,
            )}`,
          },
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", gap: 2, pb: 1.5 }}>
        <Stack spacing={0.5} sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Add a secondary drive
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pick the cloud you want to span uploads to.
          </Typography>
        </Stack>
        <IconButton
          onClick={onClose}
          aria-label="Close"
          size="small"
          sx={{ mt: 0.25 }}
        >
          {CloseIcon}
        </IconButton>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          maxHeight: { xs: "100%", sm: 420 },
          overflowY: "auto",
        }}
      >
        <Stack spacing={1.25}>
          {providers.map((Drive) => {
            return (
              <ProviderRow
                key={Drive.provider}
                label={Drive.providerLabel}
                icon={Drive.providerIcon}
                onSelect={() => {
                  onClose();
                  Drive.oauthRedirect("secondary");
                }}
              />
            );
          })}
        </Stack>
        {providers.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No providers are wired up in this build yet.
          </Typography>
        ) : null}
        {connectedKeys.size > 0 ? (
          <Box sx={{ mt: 2.5 }}>
            <Typography variant="caption" color="text.secondary">
              You can connect the same provider with a different account; each
              account counts as its own drive.
            </Typography>
          </Box>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ProviderRow({
  label,
  icon,
  onSelect,
}: {
  label: string;
  icon: React.ReactNode;
  onSelect: () => void;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        width: "100%",
        px: 2,
        py: 1.5,
        borderRadius: 999,
        cursor: "pointer",
        bgcolor: isDark
          ? alpha(theme.palette.primary.main, 0.08)
          : alpha(theme.palette.primary.main, 0.04),
        border: `1.5px solid ${alpha(
          theme.palette.primary.main,
          isDark ? 0.22 : 0.16,
        )}`,
        transition: "transform 160ms ease, border-color 200ms ease, background 200ms ease",
        outline: "none",
        "&:hover": {
          transform: "translateY(-1px)",
          borderColor: theme.palette.primary.main,
          bgcolor: alpha(theme.palette.primary.main, isDark ? 0.16 : 0.08),
        },
        "&:focus-visible": {
          borderColor: theme.palette.primary.main,
          boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.32)}`,
        },
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: "50%",
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
      <Typography variant="body1" sx={{ fontWeight: 700 }}>
        Continue with {label}
      </Typography>
    </Box>
  );
}

export interface ConfirmDriveActionDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmColor?: "error" | "warning" | "primary";
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDriveActionDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmColor = "primary",
  onClose,
  onConfirm,
}: ConfirmDriveActionDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 4 } } }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button
          onClick={onClose}
          sx={{ borderRadius: 999, fontWeight: 700 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color={confirmColor}
          onClick={onConfirm}
          sx={{ borderRadius: 999, fontWeight: 700 }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
