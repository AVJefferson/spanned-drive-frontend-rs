import {
  Box,
  Typography,
  Paper,
  FormControl,
  Select,
  MenuItem,
  Button,
  Link,
} from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import bgImage from "../../../assets/signin-bg.jpg";

const privacyNotices: Record<string, any> = import.meta.glob(
  "./privacy-*.tsx",
  {
    eager: true,
  },
);

const versions = Object.keys(privacyNotices)
  .map((key) => {
    const match = key.match(/\.\/privacy-(.*)\.tsx/);
    return match ? match[1] : null;
  })
  .filter((v) => v !== null) as string[];

const sortedVersions = [...versions].sort((a, b) => {
  if (a === "current") return -1;
  if (b === "current") return 1;
  return b.localeCompare(a);
});

export default function Privacy(props: { date: string }) {
  const navigate = useNavigate();
  const currentVersion = props.date || "current";
  const displayVersion = versions.includes(currentVersion)
    ? currentVersion
    : "current";

  const handleVersionChange = (event: any) => {
    const newVersion = event.target.value;
    if (newVersion === "current") {
      navigate("/privacy");
    } else {
      navigate(`/privacy/${newVersion}`);
    }
  };

  return (
    <Box
      sx={{
        height: "100dvh",
        overflow: "hidden",
        backgroundImage: `url(${bgImage})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        display: "flex",
        flexDirection: "column",
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
      <Box
        sx={{
          width: "100%",
          boxSizing: "border-box",
          p: 2,
          display: "flex",
          justifyContent: "flex-end",
          zIndex: 20,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 1,
            px: 2,
            bgcolor: "rgba(255, 255, 255, 0.9)",
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography variant="body2" fontWeight="bold" color="text.secondary">
            Version:
          </Typography>
          <FormControl variant="standard" sx={{ minWidth: 120 }}>
            <Select
              value={displayVersion}
              onChange={handleVersionChange}
              disableUnderline
              sx={{ fontWeight: "bold", fontSize: "0.9rem" }}
            >
              {sortedVersions.map((version) => (
                <MenuItem key={version} value={version}>
                  {version === "current" ? "Current" : version}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 2, sm: 4, md: 5 },
          width: "100%",
          boxSizing: "border-box",
          overflow: "hidden",
          zIndex: 1,
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: { xs: 3, sm: 5 },
            width: "100%",
            maxWidth: 1000,
            borderRadius: 3,
            bgcolor: "background.paper",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            zIndex: 1,
            height: "100%",
            maxHeight: "100%",
            overflowY: "auto",
            boxSizing: "border-box",
          }}
        >
          {`./privacy-${displayVersion}.tsx` in privacyNotices
            ? privacyNotices[`./privacy-${displayVersion}.tsx`].default()
            : privacyNotices["./privacy-current.tsx"].default()}
        </Paper>
      </Box>

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

      <Box
        sx={{
          width: "100%",
          boxSizing: "border-box",
          p: 2,
          display: "flex",
          justifyContent: "center",
          zIndex: 20,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 1,
            px: 2,
            bgcolor: "rgba(255, 255, 255, 0.9)",
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Button component={RouterLink} to="/" size="small" sx={{ fontWeight: "bold" }}>
            Back to Home
          </Button>
          <Typography variant="body2" color="text.secondary">
            Also view:{" "}
            <Link component={RouterLink} to="/terms" sx={{ textDecoration: "none", fontWeight: "bold" }}>
              Terms of Service
            </Link>
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
