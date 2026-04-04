import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  let errorMessage: string;
  let errorStatus: number | undefined;

  if (isRouteErrorResponse(error)) {
    errorStatus = error.status;
    errorMessage = error.statusText || error.data?.message;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else {
    errorMessage = "An unknown error occurred.";
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "grey.50",
        p: 3,
      }}
    >
      <Typography variant="h1" component="h1" color="primary" gutterBottom>
        {errorStatus || "Oops!"}
      </Typography>
      <Typography variant="h5" component="h2" gutterBottom>
        Sorry, an unexpected error has occurred.
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        <i>{errorMessage}</i>
      </Typography>
      <Button component={Link} to="/" variant="contained" color="primary">
        Go to Homepage
      </Button>
    </Box>
  );
}
