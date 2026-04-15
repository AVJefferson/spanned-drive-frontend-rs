import {
  Box,
  Accordion,
  Typography,
  Button,
  Grid,
  LinearProgress,
  Dialog,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { LogoutFromLocalStorage } from "../../services/browser/logout";
import { Drive, Drives } from "../../contexts/Drive";
import GoogleOauthRedirect from "../../services/google/google-oauth-signin";

function DriveCard(drive: Drive) {
  return <></>;
}

function OnBtnClickLogout() {
  // TODO, Make nicer UI
  if (!window.confirm("Are you sure you want to log out?")) {
    return;
  }

  const Navigate = useNavigate();
  LogoutFromLocalStorage();
  Navigate("/signin");
}

function LogoutIcon() {
  return (
    // logout icon
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  );
}

export default function DrivesTab(props: any) {
  const [expandedDrives, setExpandedDrives] = useState<string[]>([]);
  const [isDialogNewSecondaryDriveOpen, setIsDialogNewSecondaryDriveOpen] =
    useState(false);

  const { primaryDrive, secondaryDrives } = props;

  function handleListItemClickForNewSecondaryDrive(provider: string) {
    setIsDialogNewSecondaryDriveOpen(false);
    console.log(provider, Drives[provider], Drives[provider].oauthRedirect);
    if (!provider) return;
    else
      Drives[provider]?.oauth_redirect({
        accountType: "secondary",
      });
  }

  return (
    <div>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Custom title card for primary drive */}
        <Box
          sx={{
            width: "100%",
            p: 2,
            border: "1px solid",
            borderColor: "primary.main",
            borderRadius: 2,
            bgcolor: "action.hover",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            {primaryDrive.provider_icon()}
            <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: "bold" }}>
              Primary
            </Typography>
            <Button
              title="Log Out"
              variant="contained"
              sx={{
                ml: "auto",
                mr: 0.5,
              }}
              style={{
                minWidth: "32px",
                width: "32px",
                height: "32px",
                padding: 0,
              }}
              size="small"
              onClick={OnBtnClickLogout}
              disableElevation
            >
              {LogoutIcon()}
            </Button>
          </Box>
          <Typography variant="body2" noWrap>
            {primaryDrive.email.split("@")[0] || "Unknown"}
          </Typography>

          {/* Primary drive Usage Details */}
          {/* it should be 4 numbers 1 rows 4 columns, total, limit, used, remaining*/}
          {/* do not use grid and make the text small + add colors */}

          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={
                (parseFloat(primaryDrive.sdrive_used_space) /
                  parseFloat(primaryDrive.sdrive_limit)) *
                  100 || 20
              }
              valueBuffer={50}
              aria-label="5gb"
              sx={{ height: 6, borderRadius: 3, mb: 1 }}
              title={"Used 3gb / Total 5gb"}
            />
            <LinearProgress
              variant="determinate"
              value={
                (parseFloat(primaryDrive.sdrive_used_space) /
                  parseFloat(primaryDrive.sdrive_limit)) *
                  100 || 20
              }
              valueBuffer={50}
              aria-label="5gb"
              sx={{ height: 6, borderRadius: 3, mb: 1 }}
            />
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          height: "1px",
          bgcolor: "divider",
          my: 0.5,
          position: "relative",
        }}
      />
      {/* Total available space adding up sdrive limits of all drives*/}
      Some Numbers
      <Box
        sx={{
          height: "1px",
          bgcolor: "divider",
          my: 0.5,
          position: "relative",
        }}
      />
      <Button
        variant="outlined"
        fullWidth
        sx={{ mt: 2 }}
        onClick={() => setIsDialogNewSecondaryDriveOpen(true)}
      >
        Add Drive
      </Button>
      <Dialog open={isDialogNewSecondaryDriveOpen}>
        <DialogTitle>Select Provider</DialogTitle>
        <List sx={{ pt: 0 }}>
          {Object.keys(Drives).map((p: string) => {
            let name = p.split("/").pop()?.replace(".tsx", "") || p;
            name = name
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");

            return (
              <ListItem disablePadding key={name}>
                <ListItemButton
                  onClick={() => handleListItemClickForNewSecondaryDrive(p)}
                >
                  <ListItemText primary={name} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Dialog>
    </div>
  );
}
