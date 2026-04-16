import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Link as MuiLink,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import "@mui/material/styles";
import { Link } from "react-router-dom";

import bgImage from "../../assets/signin-bg.avif";
import handleGoogleSignIn from "../../services/google/google-oauth-signin";

const GoogleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="21" height="21" viewBox="0 0 21 21" fill="none">
    <path
      d="M10 21H0V11h10v10zM21 21H11V11h10v10zM10 10H0V0h10v10zM21 10H11V0h10v10z"
      fill="#00a4ef"
    />
  </svg>
);

const OthersIcon = () => (
  <svg width="21" height="21" viewBox="0 0 21 21" fill="none">
    <path d="M10 21H0V11h10V0h10v10zM21 10H11V0h10v10z" fill="currentColor" />
  </svg>
);

export default function SignInModernPage() {
  const handleMicrosoftSignIn = () => {};
  const handleGenericSignIn = () => {};

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "background.default",
        backgroundImage: `linear-gradient(rgba(4, 20, 37, 0.65), rgba(4, 20, 37, 0.82)), url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Box
        sx={{
          minHeight: "100vh",
          px: { xs: 2, md: 4 },
          py: { xs: 3, md: 4 },
          backdropFilter: "blur(10px)",
        }}
      >
        <Grid container spacing={{ xs: 3, md: 4 }} alignItems="stretch">
          <Grid size={{ xs: 12, md: 7 }}>
            <Stack
              spacing={3}
              sx={{ color: "white", height: "100%", justifyContent: "center" }}
            >
              <Chip
                label="Spanned Drive"
                sx={{
                  alignSelf: "flex-start",
                  bgcolor: "rgba(125,211,252,0.18)",
                  color: "white",
                  borderRadius: 999,
                }}
              />
              <Typography
                variant="h1"
                sx={{ fontSize: { xs: "2.5rem", md: "4.25rem" }, lineHeight: 1 }}
              >
                One logical drive.
                <br />
                All your cloud storage.
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  maxWidth: 720,
                  color: "rgba(255,255,255,0.82)",
                  lineHeight: 1.6,
                }}
              >
                Start with one primary account, add secondary drives later, and
                upload through a single logical folder space that adapts to your
                available room.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Card
                  sx={{
                    minWidth: 220,
                    bgcolor: "rgba(8, 23, 38, 0.72)",
                    color: "white",
                    borderRadius: 5,
                  }}
                >
                  <CardContent>
                    <Typography variant="overline" color="rgba(255,255,255,0.65)">
                      Smart placement
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      Route uploads into the drives you selected for each
                      logical folder.
                    </Typography>
                  </CardContent>
                </Card>
                <Card
                  sx={{
                    minWidth: 220,
                    bgcolor: "rgba(8, 23, 38, 0.72)",
                    color: "white",
                    borderRadius: 5,
                  }}
                >
                  <CardContent>
                    <Typography variant="overline" color="rgba(255,255,255,0.65)">
                      Background tasks
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      Track uploads, copies, moves, and deletes as resumable
                      microtasks.
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 4 },
                maxWidth: 460,
                mx: "auto",
                borderRadius: 6,
                bgcolor: "background.paper",
                boxShadow: "0 30px 70px rgba(3, 15, 28, 0.28)",
                animation: "signinFloat 7s ease-in-out infinite",
                "@keyframes signinFloat": {
                  "0%": { transform: "translateY(0px)" },
                  "50%": { transform: "translateY(-6px)" },
                  "100%": { transform: "translateY(0px)" },
                },
              }}
            >
              <Stack spacing={2.25}>
                <Typography variant="overline" color="text.secondary">
                  Sign in
                </Typography>
                <Typography variant="h4">Choose your primary drive</Typography>
                <Typography variant="body1" color="text.secondary">
                  The first account becomes your primary drive. Every later
                  login is added as a secondary backend drive from inside the
                  app.
                </Typography>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<GoogleIcon />}
                  onClick={() => handleGoogleSignIn("primary")}
                  sx={{ py: 1.6 }}
                >
                  Continue with Google
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<MicrosoftIcon />}
                  onClick={handleMicrosoftSignIn}
                  sx={{ py: 1.6 }}
                >
                  Continue with Microsoft
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<OthersIcon />}
                  onClick={handleGenericSignIn}
                  sx={{ py: 1.6 }}
                >
                  Continue with Others
                </Button>

                <Typography variant="body2" color="text.secondary">
                  By signing in, you agree to our{" "}
                  <MuiLink component={Link} to="/terms" underline="hover">
                    Terms of Service
                  </MuiLink>{" "}
                  and{" "}
                  <MuiLink component={Link} to="/privacy" underline="hover">
                    Privacy Policy
                  </MuiLink>
                  .
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
