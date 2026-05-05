import { useMemo, useState } from "react";

import {
  Box,
  Button,
  Link as MuiLink,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";

import { AllProvidersModal } from "./all-providers-modal";
import { ProviderButton } from "./provider-button";
import { buildProviderList, type SignInProvider } from "./providers";

const FEATURED_COUNT = 2;

export function SignInCard() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [modalOpen, setModalOpen] = useState(false);

  const providers = useMemo(() => buildProviderList(), []);
  const featured = providers.slice(0, FEATURED_COUNT);
  const hasMore = providers.length > FEATURED_COUNT;

  const handleSelect = (provider: SignInProvider) => {
    if (!provider.available || !provider.oauthRedirect) return;
    provider.oauthRedirect("primary");
  };

  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: 460,
        mx: "auto",
        p: { xs: 3, sm: 4 },
        borderRadius: 5,
        bgcolor: isDark
          ? alpha(theme.palette.background.paper, 0.78)
          : alpha(theme.palette.background.paper, 0.92),
        border: `1px solid ${alpha(
          theme.palette.primary.main,
          isDark ? 0.22 : 0.12,
        )}`,
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        boxShadow: isDark
          ? `0 30px 70px ${alpha("#000", 0.55)}`
          : `0 24px 60px ${alpha(theme.palette.primary.dark, 0.18)}`,
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background: `linear-gradient(160deg, ${alpha(
            theme.palette.primary.main,
            isDark ? 0.18 : 0.07,
          )} 0%, transparent 55%)`,
          pointerEvents: "none",
        },
      }}
    >
      <Stack spacing={2.75} sx={{ position: "relative" }}>
        <Stack spacing={0.75}>
          <Typography
            variant="overline"
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 700,
              letterSpacing: 1.2,
            }}
          >
            Sign in
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
            Choose your primary drive
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
            The first account becomes your primary drive. Add secondary drives
            later from inside the app to span files across all of them.
          </Typography>
        </Stack>

        <Stack spacing={1.25}>
          {featured.map((provider) => (
            <ProviderButton
              key={provider.provider}
              provider={provider}
              onSelect={handleSelect}
            />
          ))}

          {hasMore && (
            <Button
              onClick={() => setModalOpen(true)}
              variant="text"
              size="small"
              sx={{
                alignSelf: "center",
                mt: 0.5,
                fontWeight: 700,
                color: theme.palette.primary.main,
                "&:hover": {
                  bgcolor: alpha(theme.palette.primary.main, isDark ? 0.12 : 0.06),
                },
              }}
            >
              View all {providers.length} providers
            </Button>
          )}
        </Stack>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            color: "text.secondary",
          }}
        >
          <Box
            sx={{
              flex: 1,
              height: 1,
              bgcolor: alpha(theme.palette.divider, 0.7),
            }}
          />
          <Typography variant="caption" sx={{ letterSpacing: 0.5 }}>
            Secure OAuth
          </Typography>
          <Box
            sx={{
              flex: 1,
              height: 1,
              bgcolor: alpha(theme.palette.divider, 0.7),
            }}
          />
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textAlign: "center", lineHeight: 1.6, display: "block" }}
        >
          By continuing, you agree to our{" "}
          <MuiLink
            component={RouterLink}
            to="/terms"
            underline="hover"
            sx={{ fontWeight: 600 }}
          >
            Terms of Service
          </MuiLink>{" "}
          and{" "}
          <MuiLink
            component={RouterLink}
            to="/privacy"
            underline="hover"
            sx={{ fontWeight: 600 }}
          >
            Privacy Policy
          </MuiLink>
          .
        </Typography>
      </Stack>

      <AllProvidersModal
        open={modalOpen}
        providers={providers}
        onClose={() => setModalOpen(false)}
        onSelect={handleSelect}
      />
    </Paper>
  );
}
