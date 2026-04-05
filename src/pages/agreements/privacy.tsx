import React from "react";
import { Box, Paper, Typography, Divider, Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import bgImage from "../../assets/signin-bg.jpg";

export default function Privacy() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: `url(${bgImage})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, sm: 4, md: 5 },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          zIndex: 0,
        },
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: { xs: 3, sm: 5 },
          width: "100%",
          maxWidth: 800,
          borderRadius: 3,
          bgcolor: "background.paper",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          zIndex: 1,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Privacy Policy
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Last updated: {new Date().toLocaleDateString()}
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            fontWeight="bold"
          >
            1. Information We Collect
          </Typography>
          <Typography variant="body1" paragraph>
            We may collect personal information that you voluntarily provide to
            us when you express an interest in obtaining information about us or
            our products and Services.
          </Typography>

          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            fontWeight="bold"
            sx={{ mt: 3 }}
          >
            2. How We Use Your Information
          </Typography>
          <Typography variant="body1" paragraph>
            We use personal information collected via our application for a
            variety of business purposes, primarily to provide, maintain, and
            improve our services to you.
          </Typography>

          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            fontWeight="bold"
            sx={{ mt: 3 }}
          >
            3. Will Your Information Be Shared?
          </Typography>
          <Typography variant="body1" paragraph>
            We only share information with your consent, to comply with laws, to
            provide you with services, to protect your rights, or to fulfill
            business obligations.
          </Typography>

          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            fontWeight="bold"
            sx={{ mt: 3 }}
          >
            4. Data Retention
          </Typography>
          <Typography variant="body1" paragraph>
            We will only keep your personal information for as long as it is
            necessary for the purposes set out in this privacy notice, unless a
            longer retention period is required or permitted by law.
          </Typography>

          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            fontWeight="bold"
            sx={{ mt: 3 }}
          >
            5. Contact Us
          </Typography>
          <Typography variant="body1" paragraph>
            If you have questions or comments about this notice, you may contact
            us using the provided contact information in the application.
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Button component={RouterLink} to="/" variant="outlined">
              Back to Home
            </Button>
            <Typography variant="body2" color="text.secondary">
              Also view our{" "}
              <RouterLink
                to="/terms"
                style={{ color: "inherit", fontWeight: "bold" }}
              >
                Terms of Service
              </RouterLink>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
