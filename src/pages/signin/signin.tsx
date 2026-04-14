import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Typography,
  Link as MuiLink,
} from "@mui/material";

// explicity import material UI CSS to avoid triggering CSS import issues in Nginx
import "@mui/material/styles";
import { Link } from "react-router-dom";
import bgImage from "../../assets/signin-bg.avif";
import { default as handleGoogleSignIn } from "../../services/google/google-oauth-signin";

const GoogleIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
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
  <svg
    width="21"
    height="21"
    viewBox="0 0 21 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 21H0V11h10v10zM21 21H11V11h10v10zM10 10H0V0h10v10zM21 10H11V0h10v10z"
      fill="#00a4ef"
    />
  </svg>
);

const OthersIcon = () => (
  <svg
    width="21"
    height="21"
    viewBox="0 0 21 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M10 21H0V11h10V0h10v10zM21 10H11V0h10v10z" fill="currentColor" />
  </svg>
);

const FadeInSection = ({ children }: { children: React.ReactNode }) => {
  const [progress, setProgress] = useState(0);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!domRef.current) return;
      const rect = domRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const start = windowHeight;
      const end = windowHeight * 0.75;

      let p = (start - rect.top) / (start - end);
      p = Math.max(0, Math.min(1, p));
      setProgress(p);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={domRef}
      style={{
        opacity: progress,
        transform: `translateY(${(1 - progress) * 50}px)`,
        width: "100%",
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
};

const FileSplitAnimation = () => {
  const [progress, setProgress] = useState(0);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!domRef.current) return;
      const rect = domRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const start = windowHeight * 0.3;
      const end = windowHeight * -0.25;

      let p = (start - rect.top) / (start - end);
      p = Math.max(0, Math.min(1, p));
      setProgress(p);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fileTop = 15 + Math.min(progress / 0.4, 1) * 30; // 15% to 45%
  const fileOpacity = 1 - Math.min(progress / 0.4, 1);

  const chunkOpacity = progress < 0.3 ? 0 : Math.min((progress - 0.3) / 0.2, 1);
  const leftChunkX = 50 - Math.min(Math.max((progress - 0.3) / 0.4, 0), 1) * 25;
  const rightChunkX =
    50 + Math.min(Math.max((progress - 0.3) / 0.4, 0), 1) * 25;

  const cloudOpacity = progress < 0.6 ? 0 : Math.min((progress - 0.6) / 0.4, 1);
  const googleDriveUsage = Math.floor(cloudOpacity * 75);
  const oneDriveUsage = Math.floor(cloudOpacity * 25);

  return (
    <Box
      ref={domRef}
      sx={{
        position: "relative",
        height: 400,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        my: 6,
        overflow: "hidden",
      }}
    >
      {/* Big File */}
      <Box
        sx={{
          position: "absolute",
          top: `${fileTop}%`,
          opacity: fileOpacity,
          width: { xs: 150, sm: 250 },
          height: 120,
          bgcolor: "primary.main",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 2,
          zIndex: 2,
          boxShadow: 3,
          willChange: "top, opacity",
        }}
      >
        <Typography variant="h5" fontWeight="bold" textAlign="center">
          Very Big File
        </Typography>
      </Box>

      {/* Split files */}
      <Box
        sx={{
          position: "absolute",
          top: "55%",
          left: `${leftChunkX}%`,
          transform: "translate(-50%, -50%)",
          opacity: chunkOpacity,
          width: { xs: 100, sm: 160 },
          height: 90,
          bgcolor: "#34A853",
          color: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 2,
          zIndex: 1,
          boxShadow: 2,
          willChange: "left, opacity",
        }}
      >
        <Typography variant="body1" fontWeight="bold" textAlign="center">
          Smaller Chunks
        </Typography>
      </Box>

      <Box
        sx={{
          position: "absolute",
          top: "55%",
          left: `${rightChunkX}%`,
          transform: "translate(-50%, -50%)",
          opacity: chunkOpacity,
          width: { xs: 100, sm: 160 },
          height: 90,
          bgcolor: "#00a4ef",
          color: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 2,
          zIndex: 1,
          boxShadow: 2,
          willChange: "left, opacity",
        }}
      >
        <Typography variant="body1" fontWeight="bold" textAlign="center">
          Smaller Chunks
        </Typography>
      </Box>

      {/* Cloud Drives Platforms */}
      <Box
        sx={{
          position: "absolute",
          bottom: "5%",
          width: "100%",
          display: "flex",
          justifyContent: "space-around",
          opacity: cloudOpacity,
          willChange: "opacity",
        }}
      >
        <Box
          sx={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: 140,
          }}
        >
          <Box
            sx={{
              bgcolor: "white",
              p: 1.5,
              borderRadius: "50%",
              boxShadow: 1,
              mb: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <GoogleIcon />
          </Box>
          <Typography variant="subtitle1" fontWeight="bold">
            Google Drive
          </Typography>
          <Box
            sx={{
              width: "100%",
              mt: 1,
              bgcolor: "grey.300",
              borderRadius: 1,
              height: 8,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                width: `${googleDriveUsage}%`,
                height: "100%",
                bgcolor: "#34A853",
              }}
            />
          </Box>
          <Typography
            variant="caption"
            sx={{ mt: 0.5, color: "text.secondary", fontWeight: "medium" }}
          >
            {googleDriveUsage}% Used
          </Typography>
        </Box>
        <Box
          sx={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: 140,
          }}
        >
          <Box
            sx={{
              bgcolor: "white",
              p: 1.5,
              borderRadius: "50%",
              boxShadow: 1,
              mb: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MicrosoftIcon />
          </Box>
          <Typography variant="subtitle1" fontWeight="bold">
            OneDrive
          </Typography>
          <Box
            sx={{
              width: "100%",
              mt: 1,
              bgcolor: "grey.300",
              borderRadius: 1,
              height: 8,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                width: `${oneDriveUsage}%`,
                height: "100%",
                bgcolor: "#00a4ef",
              }}
            />
          </Box>
          <Typography
            variant="caption"
            sx={{ mt: 0.5, color: "text.secondary", fontWeight: "medium" }}
          >
            {oneDriveUsage}% Used
          </Typography>
        </Box>
      </Box>

      {/* Connection Lines */}
      <Box
        sx={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 2,
          height: "25%",
          bgcolor: "text.disabled",
          opacity: cloudOpacity,
          zIndex: 0,
          willChange: "opacity",
        }}
      />
    </Box>
  );
};

const SignInPage = () => {
  const handleMicrosoftSignIn = () => {
    // TODO: Implement Microsoft (OneDrive) OAuth
  };

  const handleGenericSignIn = () => {
    // TODO: Implement Generic OAuth
  };

  return (
    <>
      <Box sx={{ width: "100%", overflowX: "hidden" }}>
        <Grid
          container
          sx={{
            minHeight: "100vh",
            backgroundImage: `url(${bgImage})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.6)", // Dark overlay for better text visibility
              zIndex: 0,
            },
          }}
        >
          {/* Left side: Information or Hero Area */}
          <Grid
            size={{ xs: false, sm: 4, md: 7 }}
            sx={{
              display: { xs: "none", sm: "flex" },
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              color: "white",
              p: 4,
              zIndex: 1,
              textAlign: "center",
            }}
          >
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              fontWeight="bold"
              sx={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
            >
              Spanned Drive
            </Typography>
            <Typography
              variant="h6"
              align="center"
              sx={{ maxWidth: 600, textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
            >
              A secure, distributed drive solution bringing all your cloud
              storage together in one place.
            </Typography>
          </Grid>

          {/* Right side: Sign-in Area */}
          <Grid
            size={{ xs: 12, sm: 8, md: 5 }}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              p: { xs: 2, sm: 4, md: 5 },
              zIndex: 1,
            }}
          >
            <Paper
              elevation={6}
              sx={{
                p: { xs: 4, sm: 5 },
                width: "100%",
                maxWidth: 400,
                borderRadius: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                bgcolor: "background.paper",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {/* Mobile Branding (only visible on xs) */}
                <Box
                  sx={{
                    display: { xs: "flex", sm: "none" },
                    flexDirection: "column",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="h4"
                    component="h1"
                    fontWeight="bold"
                    color="primary.main"
                  >
                    Spanned Drive
                  </Typography>
                </Box>

                <Box sx={{ mb: 2, textAlign: "center" }}>
                  <Typography
                    component="h2"
                    variant="h5"
                    fontWeight="bold"
                    gutterBottom
                  >
                    SIGNIN TO SPANNED DRIVE
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<GoogleIcon />}
                  onClick={handleGoogleSignIn}
                  sx={{
                    py: 1.5,
                    borderColor: "grey.300",
                    color: "text.primary",
                    "&:hover": {
                      borderColor: "grey.400",
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  Continue with Google
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<MicrosoftIcon />}
                  onClick={handleMicrosoftSignIn}
                  sx={{
                    py: 1.5,
                    borderColor: "grey.300",
                    color: "text.primary",
                    "&:hover": {
                      borderColor: "grey.400",
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  Continue with Microsoft
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<OthersIcon />}
                  onClick={handleGenericSignIn}
                  sx={{
                    py: 1.5,
                    borderColor: "grey.300",
                    color: "text.primary",
                    "&:hover": {
                      borderColor: "grey.400",
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  Continue with Others
                </Button>

                <Box sx={{ mt: 3, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    By signing in, you agree to our{" "}
                    <MuiLink href="/terms" underline="always">
                      Terms of Service
                    </MuiLink>{" "}
                    and{" "}
                    <MuiLink href="/privacy" underline="always">
                      Privacy Policy
                    </MuiLink>
                    .
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Scrollable Information Section */}
        <Box
          sx={{ bgcolor: "background.default", color: "text.primary", py: 10 }}
        >
          <Container maxWidth="lg">
            <FadeInSection>
              <Box sx={{ textAlign: "center", mb: 12 }}>
                <Typography
                  variant="h3"
                  component="h2"
                  fontWeight="bold"
                  gutterBottom
                >
                  What is Spanned Drive?
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ maxWidth: 800, mx: "auto", lineHeight: 1.6 }}
                >
                  Spanned Drive is an innovative cloud aggregation platform that
                  combines all your fragmented storage accounts—like Google
                  Drive and OneDrive—into a single, unified logical drive. Stop
                  worrying about which account has free space; let us handle the
                  distribution.
                </Typography>
              </Box>
            </FadeInSection>

            <FadeInSection>
              <Box sx={{ mb: 12 }}>
                <Typography
                  variant="h4"
                  component="h3"
                  fontWeight="bold"
                  textAlign="center"
                  gutterBottom
                >
                  Seamless File Splitting
                </Typography>
                <Typography
                  variant="body1"
                  textAlign="center"
                  color="text.secondary"
                  sx={{ maxWidth: 700, mx: "auto", mb: 4, fontSize: "1.1rem" }}
                >
                  When you upload a large file, Spanned Drive seamlessly splits
                  it into smaller chunks and distributes them across your
                  connected drives behind the scenes.
                </Typography>

                <FileSplitAnimation />

                <Typography
                  variant="body1"
                  textAlign="center"
                  color="text.secondary"
                  sx={{ maxWidth: 700, mx: "auto", mt: 2, fontSize: "1.1rem" }}
                >
                  A Big File or Folder is intelligently divided to fit into the
                  available space across your accounts, maximizing your storage
                  utilization effortlessly.
                </Typography>
              </Box>
            </FadeInSection>

            <FadeInSection>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 4, md: 6 },
                  borderRadius: 4,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Grid container spacing={6} alignItems="center">
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography
                      variant="h4"
                      component="h3"
                      fontWeight="bold"
                      gutterBottom
                    >
                      Transparent & Secure
                    </Typography>
                    <Typography
                      variant="body1"
                      paragraph
                      sx={{ fontSize: "1.1rem" }}
                    >
                      We request access to your cloud drives for one reason
                      only: <strong>to manage your files on your behalf</strong>
                      .
                    </Typography>
                    <Typography
                      variant="body1"
                      paragraph
                      sx={{ fontSize: "1.1rem" }}
                    >
                      Spanned Drive uses your authentication tokens strictly to
                      list, read, write, and delete files so we can present them
                      as a unified filesystem.
                    </Typography>
                    <Typography
                      variant="body1"
                      paragraph
                      sx={{ fontSize: "1.1rem" }}
                    >
                      <strong>
                        We do not analyze, sell, or share your data with third
                        parties.
                      </strong>{" "}
                      Your privacy and security are our top priorities. All
                      operations are performed transparently.
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </FadeInSection>
          </Container>
        </Box>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          width: "100%",
          boxSizing: "border-box",
          p: { xs: 1, sm: 2 },
          display: "flex",
          justifyContent: "center",
          zIndex: 20,
          bgcolor: "background.default", // Ensure footer has a background
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 1,
            px: { xs: 1, sm: 2 },
            bgcolor: "background.paper",
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            maxWidth: 1000, // Match the max width of the content above
          }}
        >
          <Button
            component={Link}
            to="/"
            size="small"
            sx={{
              fontWeight: "bold",
              fontSize: { xs: "0.7rem", sm: "0.8125rem" },
              minWidth: "auto",
            }}
          >
            Back to Home
          </Button>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}
          >
            View our:{" "}
            <MuiLink
              component={Link}
              to="/privacy"
              sx={{
                textDecoration: "none",
                fontWeight: "bold",
                fontSize: { xs: "0.7rem", sm: "0.875rem" },
              }}
            >
              Privacy Policy
            </MuiLink>{" "}
            and{" "}
            <MuiLink
              component={Link}
              to="/terms"
              sx={{
                textDecoration: "none",
                fontWeight: "bold",
                fontSize: { xs: "0.7rem", sm: "0.875rem" },
              }}
            >
              Terms of Service
            </MuiLink>
          </Typography>
        </Paper>
      </Box>
    </>
  );
};

export default SignInPage;
