import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  title?: string;
  message?: string;
  variant?: "page" | "embedded";
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught an error", error, info);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isEmbedded = this.props.variant === "embedded";

    return (
      <Box
        sx={{
          minHeight: isEmbedded ? 0 : "100dvh",
          p: { xs: 2, md: 3 },
          width: "100%",
        }}
      >
        <Paper
          sx={{
            maxWidth: isEmbedded ? "100%" : 680,
            mx: isEmbedded ? 0 : "auto",
            p: { xs: 3, md: 4 },
            borderRadius: 4,
          }}
        >
          <Stack spacing={2}>
            <Typography variant="h5">
              {this.props.title || "Something went wrong"}
            </Typography>
            <Typography color="text.secondary">
              {this.props.message ||
                "A rendering error occurred. You can retry this view or reload the app."}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={this.handleReset}>
                Try again
              </Button>
              <Button
                variant="outlined"
                onClick={() => window.location.reload()}
              >
                Reload app
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    );
  }
}
