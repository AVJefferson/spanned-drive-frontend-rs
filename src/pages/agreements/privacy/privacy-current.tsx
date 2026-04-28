import { Box, Typography } from "@mui/material";
export default function Privacy() {
  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Privacy Policy
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Last updated: 2026-04-06
      </Typography>

      <Box sx={{ mt: 4 }}>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Welcome to Spanned Drive. This Privacy Policy explains how we collect,
          use, disclose, and safeguard your information when you use our
          application. This policy is designed to comply with the General Data
          Protection Regulation (GDPR), the Digital Personal Data Protection Act
          (DPDPA), and the Various API Services User Data Policy.
        </Typography>

        <Typography variant="h6" component="h2" gutterBottom fontWeight="bold">
          1. Information We Collect
        </Typography>
        <Typography variant="body1" component="div" sx={{ mb: 2 }}>
          When you use our application, particularly when authenticating via
          OAuth, we may collect the following information:
          <ul>
            <li>
              <strong>Personal Identification Information:</strong> Name, email
              address, and profile picture provided by OAuth.
            </li>
            <li>
              <strong>Drive Data:</strong> With your explicit consent (Provided
              during login), we access your Drive files and metadata strictly to
              provide the core functionality of our application (e.g., viewing,
              managing, and syncing files). These files are not stored on our
              servers and are only accessed temporarily during your session. We
              do not access or store any of your Drive data beyond what is
              necessary to provide our services.
            </li>
            <li>
              <strong>Usage Data:</strong> Anonymous Information about how you
              interact with our application to improve user experience. We
              cannot link this data to you personally and it is used solely for
              analytics and performance monitoring purposes.
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
          We use your personal information and Drive data solely for the
          following purposes:
          <ul>
            <li>
              To provide and maintain the core functionalities of Spanned Drive.
            </li>
            <li>To authenticate your identity using OAuth.</li>
            <li>To perform file management operations requested by you.</li>
            <li>To improve our application's performance and security.</li>
          </ul>
          <ul>
            <li>
              We do not use your information for targeted advertising, nor do we
              sell it to third parties.
            </li>
            <li>
              We do not use your information for any purposes other than those
              stated above without your explicit consent.
            </li>
            <li>
              We never access your drive data outside of the context of
              providing our services.
            </li>
            <li>
              In certain cases, we cannot access your drive data due to
              technical limitations or permissions. In such cases, we can only
              provide limited functionality, and we will inform you of any such
              limitations when they arise.
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
          3. Google API Services User Data Policy Compliance
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Spanned Drive's use of information received from Google APIs will
          adhere to the{" "}
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
        <Typography variant="body1" component="div" sx={{ mb: 2 }}>
          We retain your personal data only for as long as necessary to provide
          you with our services and fulfill the purposes described in this
          policy. You can revoke access to your Google account at any time via
          your Google Account settings. Upon account deletion or revocation of
          access, we will promptly delete your personal data from our active
          databases.

          All user data is stored securely in your own Drives. The only exceptions
          are-
          <ul>
            <li>
              <strong>Authentication Tokens:</strong> We may temporarily store OAuth tokens
              to maintain your session, but these are encrypted and deleted upon
              logout or after a short period of inactivity.
            </li>
            <li>
              <strong>Usage Data:</strong> We may retain anonymized usage data for
              analytics purposes, but this data cannot be linked back to you
              personally.
            </li>
            <li>
              <strong>Personal Data:</strong> We do not retain any personal data beyond what is necessary for
              authentication and service provision. Once you delete your account or revoke access,
              all personal data is deleted from our systems.
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
          The servers used to proivide our services are hosted by Oracle Cloud
          Infrastructure (OCI) and are located in India West (Mumbai) region.
          While we have taken reasonable steps to secure the personal information
          you provide to us, please be aware that despite our efforts, no security
          measures are perfect or impenetrable.
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
          <a href="mailto:avjeferson@gmail.com">avjeferson@gmail.com</a>.
        </Typography>
      </Box>
    </>
  );
}
