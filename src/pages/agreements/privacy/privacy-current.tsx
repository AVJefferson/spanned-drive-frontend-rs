import { Box, Paper, Typography } from "@mui/material";
export default function Privacy() {
  return (
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
        <Typography variant="body1" sx={{ mb: 3 }}>
          Welcome to Spanned Drive. This Privacy Policy explains how we collect,
          use, disclose, and safeguard your information when you use our
          application. This policy is designed to comply with the General Data
          Protection Regulation (GDPR), the Digital Personal Data Protection Act
          (DPDPA), and the Google API Services User Data Policy.
        </Typography>

        <Typography variant="h6" component="h2" gutterBottom fontWeight="bold">
          1. Information We Collect
        </Typography>
        <Typography variant="body1" component="div" sx={{ mb: 2 }}>
          When you use our application, particularly when authenticating via
          Google, we may collect the following information:
          <ul>
            <li>
              <strong>Personal Identification Information:</strong> Name, email
              address, and profile picture provided by Google OAuth.
            </li>
            <li>
              <strong>Google Drive Data:</strong> With your explicit consent, we
              access your Google Drive files and metadata strictly to provide
              the core functionality of our application (e.g., viewing,
              managing, and syncing files).
            </li>
            <li>
              <strong>Usage Data:</strong> Information about how you interact
              with our application to improve user experience.
            </li>
          </ul>
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
        <Typography variant="body1" component="div" sx={{ mb: 2 }}>
          We use your personal information and Google Drive data solely for the
          following purposes:
          <ul>
            <li>
              To provide and maintain the core functionalities of Spanned Drive.
            </li>
            <li>To authenticate your identity using Google OAuth.</li>
            <li>To perform file management operations requested by you.</li>
            <li>To improve our application's performance and security.</li>
          </ul>
        </Typography>

        <Typography
          variant="h6"
          component="h2"
          gutterBottom
          fontWeight="bold"
          sx={{ mt: 3 }}
        >
          3. Google API Services User Data Policy Compliance
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Spanned Drive's use and transfer to any other app of information
          received from Google APIs will adhere to the{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline" }}
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements. We do not use your Google
          data for targeted advertising, nor do we sell it to third parties.
        </Typography>

        <Typography
          variant="h6"
          component="h2"
          gutterBottom
          fontWeight="bold"
          sx={{ mt: 3 }}
        >
          4. Data Sharing and Disclosure
        </Typography>
        <Typography variant="body1" component="div" sx={{ mb: 2 }}>
          We do not sell, trade, or otherwise transfer your personal information
          to outside parties except:
          <ul>
            <li>To comply with legal obligations.</li>
            <li>To protect and defend our rights and property.</li>
            <li>With your explicit, informed consent.</li>
          </ul>
        </Typography>

        <Typography
          variant="h6"
          component="h2"
          gutterBottom
          fontWeight="bold"
          sx={{ mt: 3 }}
        >
          5. Data Retention and Deletion
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          We retain your personal data only for as long as necessary to provide
          you with our services and fulfill the purposes described in this
          policy. You can revoke access to your Google account at any time via
          your Google Account settings. Upon account deletion or revocation of
          access, we will promptly delete your personal data from our active
          databases.
        </Typography>

        <Typography
          variant="h6"
          component="h2"
          gutterBottom
          fontWeight="bold"
          sx={{ mt: 3 }}
        >
          6. Your Privacy Rights (GDPR & DPDPA)
        </Typography>
        <Typography variant="body1" component="div" sx={{ mb: 2 }}>
          Depending on your location, you may have the following rights
          regarding your data:
          <ul>
            <li>
              <strong>Right to Access:</strong> You can request copies of your
              personal data.
            </li>
            <li>
              <strong>Right to Rectification:</strong> You can request
              correction of inaccurate data.
            </li>
            <li>
              <strong>Right to Erasure (Right to be Forgotten):</strong> You can
              request that we erase your personal data under certain conditions.
            </li>
            <li>
              <strong>Right to Restrict Processing:</strong> You can request
              that we restrict the processing of your personal data.
            </li>
            <li>
              <strong>Right to Data Portability:</strong> You can request the
              transfer of your data to another organization or directly to you.
            </li>
          </ul>
          To exercise these rights, please contact us using the information
          below.
        </Typography>

        <Typography
          variant="h6"
          component="h2"
          gutterBottom
          fontWeight="bold"
          sx={{ mt: 3 }}
        >
          7. Security of Your Information
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          We use administrative, technical, and physical security measures to
          help protect your personal information. While we have taken reasonable
          steps to secure the personal information you provide to us, please be
          aware that despite our efforts, no security measures are perfect or
          impenetrable.
        </Typography>

        <Typography
          variant="h6"
          component="h2"
          gutterBottom
          fontWeight="bold"
          sx={{ mt: 3 }}
        >
          8. Contact Us
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          If you have questions or comments about this Privacy Policy, your
          rights, or our data practices, please contact us at:
          privacy@spanneddrive.com (please update with your actual contact
          email).
        </Typography>
      </Box>
    </Paper>
  );
}
