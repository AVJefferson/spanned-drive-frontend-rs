import { Box, Grid, Paper, Typography } from "@mui/material";
import { useSession } from "../../contexts/SessionContext";

const HomePage = () => {
  const { session, isExpired } = useSession();

  if (!session || !session.loggedIn || isExpired(session.primaryAccount)) {
    // navigate to signing page
    window.location.href = "/signin";
    return null;
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Section: Left, Middle, and Right Panes */}
      <Grid container spacing={1} sx={{ flex: 1, overflow: "hidden" }}>
        {/* Left Pane */}
        <Grid size={{ xs: 2 }}>
          <Paper sx={{ height: "100%", bgcolor: "grey.100", p: 2 }}>
            <Typography variant="h6">Left Pane</Typography>
          </Paper>
        </Grid>

        {/* Middle Content */}
        <Grid size={{ xs: 8 }}>
          <Paper sx={{ height: "100%", p: 2, overflowY: "auto" }}>
            <Typography variant="h4">Main Content Area</Typography>
            <Typography sx={{ mt: 2 }}>
              Your primary application content goes here. This area is set to
              scroll independently if the content exceeds the height.
            </Typography>
          </Paper>
        </Grid>

        {/* Right Pane */}
        <Grid size={{ xs: 2 }}>
          <Paper sx={{ height: "100%", bgcolor: "grey.100", p: 2 }}>
            <Typography variant="h6">Right Pane</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Bottom Pane */}
      <Box sx={{ mt: 1 }}>
        <Paper
          sx={{
            p: 2,
            bgcolor: "primary.main",
            color: "white",
            textAlign: "center",
          }}
        >
          <Typography variant="h6">Bottom Pane / Footer</Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default HomePage;
