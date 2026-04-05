import React from 'react';
import { Box, Paper, Typography } from "@mui/material";
import bgImage from "../../assets/signin-bg.jpg";

export default function Terms() {
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
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 0,
        }
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: { xs: 3, sm: 5 },
          width: "100%",
          maxWidth: 800,
          borderRadius: 3,
          bgcolor: 'background.paper',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          zIndex: 1,
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Terms of Service
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Last updated: {new Date().toLocaleDateString()}
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" component="h2" gutterBottom fontWeight="bold">
            1. Acceptance of Terms
          </Typography>
          <Typography variant="body1" paragraph>
            By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement.
          </Typography>

          <Typography variant="h6" component="h2" gutterBottom fontWeight="bold" sx={{ mt: 3 }}>
            2. Use License
          </Typography>
          <Typography variant="body1" paragraph>
            Permission is granted to temporarily use this application for personal, non-commercial transitory viewing only.
          </Typography>

          <Typography variant="h6" component="h2" gutterBottom fontWeight="bold" sx={{ mt: 3 }}>
            3. Disclaimer
          </Typography>
          <Typography variant="body1" paragraph>
            The materials within this application are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </Typography>

          <Typography variant="h6" component="h2" gutterBottom fontWeight="bold" sx={{ mt: 3 }}>
            4. Limitations
          </Typography>
          <Typography variant="body1" paragraph>
            In no event shall we or our suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on this application.
          </Typography>

          <Typography variant="h6" component="h2" gutterBottom fontWeight="bold" sx={{ mt: 3 }}>
            5. Modifications
          </Typography>
          <Typography variant="body1" paragraph>
            We may revise these terms of service for its application at any time without notice. By using this application you are agreeing to be bound by the then current version of these terms of service.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
