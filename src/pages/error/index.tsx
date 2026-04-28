import { Link } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";

export function ErrorPage() {
  const errorMessage = new URLSearchParams(window.location.search).get("error");
  const errorStatus = new URLSearchParams(window.location.search).get("status");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "background.default",
        color: "text.primary",
        p: 3,
      }}
    >
      <Typography variant="h1" component="h1" color="error" gutterBottom>
        {errorStatus || "Oops!"}
      </Typography>
      <Typography variant="h5" component="h2" gutterBottom>
        Sorry, an unexpected error has occurred.
      </Typography>
      <Typography variant="body1" color="text.secondary">
        <i>{errorMessage}</i>
      </Typography>
      <Button component={Link} to="/" variant="contained" color="primary">
        Go to Homepage
      </Button>
    </Box>
  );
}
