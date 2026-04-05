import { Box, Button, Grid, Paper, Typography } from "@mui/material";

// explicity import material UI CSS to avoid triggering CSS import issues in Nginx
import "@mui/material/styles";
import { Link } from "react-router-dom";

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

const SignInPage = () => {
  const handleGoogleSignIn = () => {
    // TODO: Implement Google OAuth
    console.log("Sign in with Google");
  };

  const handleMicrosoftSignIn = () => {
    // TODO: Implement Microsoft (OneDrive) OAuth
    console.log("Sign in with Microsoft");
  };

  return (
    <Grid container sx={{ height: "100vh" }}>
      {/* Left side: Information or Hero Area */}
      <Grid
        size={{ xs: false, sm: 4, md: 7 }}
        sx={{
          display: { xs: "none", sm: "flex" },
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "primary.main",
          color: "primary.contrastText",
          p: 4,
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
          Spanned Drive
        </Typography>
        <Typography variant="h6" align="center" sx={{ maxWidth: 600 }}>
          A secure, distributed drive solution bringing all your cloud storage
          together in one place.
        </Typography>
      </Grid>

      {/* Right side: Sign-in Area */}
      <Grid
        size={{ xs: 12, sm: 8, md: 5 }}
        component={Paper}
        elevation={6}
        square
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 3, sm: 4, md: 5 },
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 400,
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
              mb: 4,
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
              Welcome back
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to access your dashboard
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
                bgcolor: "grey.50",
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
                bgcolor: "grey.50",
              },
            }}
          >
            Continue with Microsoft
          </Button>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              By signing in, you agree to our{" "}
              <Link to="/terms">Terms of Service</Link> and{" "}
              <Link to="/privacy">Privacy Policy</Link>.
            </Typography>
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
};

export default SignInPage;
