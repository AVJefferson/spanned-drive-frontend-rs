import { Box, Typography, Paper } from "@mui/material";
import bgImage from "../../../assets/signin-bg.jpg";

const privacyNotices: Record<string, any> = import.meta.glob(
  "./privacy-*.tsx",
  {
    eager: true,
  },
);

export default function Privacy(props: { date: string }) {
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
      {`./privacy-${props.date}.tsx` in privacyNotices
        ? privacyNotices[`./privacy-${props.date}.tsx`].default()
        : privacyNotices["./privacy-current.tsx"].default()}

      {
        // if privacy not present, show message as a dropdown at the top of the page that vanishes
        !(`./privacy-${props.date}.tsx` in privacyNotices) &&
          props.date !== "" && (
            <Box
              sx={{
                position: "absolute",
                top: 20,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10,
                width: "90%",
                maxWidth: 600,
                animation: "fadeOut 5s forwards",
                "@keyframes fadeOut": {
                  "0%": {
                    opacity: 1,
                    transform: "translateX(-50%) translateY(0)",
                  },
                  "80%": {
                    opacity: 1,
                    transform: "translateX(-50%) translateY(0)",
                  },
                  "100%": {
                    opacity: 0,
                    transform: "translateX(-50%) translateY(-20px)",
                  },
                },
              }}
            >
              <Paper
                elevation={4}
                sx={{
                  p: 2,
                  bgcolor: "warning.light",
                  color: "warning.contrastText",
                  textAlign: "center",
                  borderRadius: 2,
                }}
              >
                <Typography variant="body2" fontWeight="bold">
                  The requested version ({props.date}) was not found. Displaying
                  the current Privacy Policy instead.
                </Typography>
              </Paper>
            </Box>
          )
      }
    </Box>
  );
}
