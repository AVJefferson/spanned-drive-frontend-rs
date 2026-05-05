import {
  Box,
  Container,
  Grid,
  Link as MuiLink,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Link as RouterLink, Navigate } from "react-router-dom";

import { useSession } from "../../contexts/session-context";
import { AnimatedBackground } from "./animated-bg";
import { HeroSide } from "./hero-side";
import { SignInCard } from "./signin-card";

export function SignInPage() {
  const theme = useTheme();
  const session = useSession();

  if (session.primaryDrive?.email) {
    return <Navigate to="/" replace />;
  }

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100dvh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      <AnimatedBackground />

      <Container
        maxWidth="lg"
        sx={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          py: { xs: 3, md: 6 },
        }}
      >
        <Grid
          container
          spacing={{ xs: 4, md: 6 }}
          alignItems="center"
          sx={{ flex: 1 }}
        >
          <Grid size={{ xs: 12, md: 7 }}>
            <HeroSide />
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <SignInCard />
          </Grid>
        </Grid>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 1.25, sm: 2 }}
          alignItems="center"
          justifyContent={{ xs: "center", sm: "flex-end" }}
          sx={{
            mt: { xs: 4, md: 6 },
            pt: 2.5,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
            color: "text.secondary",
          }}
        >
          <Stack
            direction="row"
            spacing={2.5}
            sx={{
              "& a": {
                fontWeight: 600,
                color: theme.palette.text.secondary,
                "&:hover": { color: theme.palette.primary.main },
              },
            }}
          >
            <MuiLink component={RouterLink} to="/privacy" underline="hover">
              Privacy
            </MuiLink>
            <MuiLink component={RouterLink} to="/terms" underline="hover">
              Terms
            </MuiLink>
            <Typography
              variant="body2"
              component="span"
              sx={{ color: "text.disabled" }}
            >
              © {new Date().getFullYear()} Spanned Drive
            </Typography>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}