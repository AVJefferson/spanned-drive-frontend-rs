import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { ProviderButton } from "./provider-button";
import type { SignInProvider } from "./providers";

interface AllProvidersModalProps {
  open: boolean;
  providers: SignInProvider[];
  onClose: () => void;
  onSelect: (provider: SignInProvider) => void;
}

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

export function AllProvidersModal({
  open,
  providers,
  onClose,
  onSelect,
}: AllProvidersModalProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const availableCount = providers.filter((entry) => entry.available).length;
  const upcomingCount = providers.length - availableCount;

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
            border: `1px solid ${alpha(theme.palette.primary.main, isDark ? 0.18 : 0.1)}`,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 2,
          pb: 1.5,
        }}
      >
        <Stack spacing={0.5} sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Pick a cloud provider
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {availableCount} available now
            {upcomingCount > 0 ? ` · ${upcomingCount} coming soon` : ""}
          </Typography>
        </Stack>
        <IconButton
          onClick={onClose}
          aria-label="Close provider list"
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
          {providers.map((provider) => (
            <ProviderButton
              key={provider.provider}
              provider={provider}
              variant="ghost"
              onSelect={(selected) => {
                if (selected.available) {
                  onClose();
                  onSelect(selected);
                }
              }}
            />
          ))}
        </Stack>
        <Box sx={{ mt: 2.5 }}>
          <Typography variant="caption" color="text.secondary">
            Spanned Drive only requests scopes needed to manage files on your
            behalf. 
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
