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
import { Drives } from "../../services/drives/registry";

export default function SignInModernPage() {
  const providers = Object.values(Drives);

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

                {providers.map((Provider) => {
                  const ProviderIcon = Provider.provider_icon;
                  return (
                    <Button
                      key={Provider.provider}
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<ProviderIcon />}
                      onClick={() =>
                        Provider.oauth_redirect({ accountType: "primary" })
                      }
                      sx={{ py: 1.6 }}
                    >
                      Continue with {Provider.provider_label}
                    </Button>
                  );
                })}

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
