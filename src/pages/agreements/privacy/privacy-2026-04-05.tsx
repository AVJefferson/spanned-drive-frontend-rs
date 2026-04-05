import { Box, Paper, Typography } from "@mui/material";

export default function Privacy() {
  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Privacy Policy
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Last updated: {new Date().toLocaleDateString()}
      </Typography>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" component="h2" gutterBottom fontWeight="bold">
          1. Information We Collect
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          We may collect personal information that you voluntarily provide to us
          when you express an interest in obtaining information about us or our
          products and Services.
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
        <Typography variant="body1" sx={{ mb: 2 }}>
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
        <Typography variant="body1" sx={{ mb: 2 }}>
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
        <Typography variant="body1" sx={{ mb: 2 }}>
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
        <Typography variant="body1" sx={{ mb: 2 }}>
          If you have questions or comments about this notice, you may contact
          us using the provided contact information in the application.
        </Typography>
      </Box>
    </>
  );
}
