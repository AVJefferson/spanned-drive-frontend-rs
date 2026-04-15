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

function DriveCard(drive: Drive) {
  // return an accordion that has Googleicon and email-id in it. When user clicks on it, it should accordion, basically open up into more details+settings
  const [expanded, setExpanded] = useState(false);

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      sx={{
        mb: 1,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "8px !important",
        "&:before": { display: "none" },
        boxShadow: "none",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          p: 1.5,
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {drive.provider_icon()}
        <Typography
          variant="body2"
          sx={{ ml: 1, fontWeight: "medium", flexGrow: 1 }}
          noWrap
        >
          {drive.email.split("@")[0]}
        </Typography>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </Box>
      <Box sx={{ px: 2, pb: 2, display: expanded ? "block" : "none" }}>
        <Box sx={{ mt: 1.5, my: 0.1 }}>
          <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
            Storage Usage
          </Typography>
          <LinearProgress
            variant="determinate"
            value={
              (parseFloat(drive?.drive_details?.used_space) /
                parseFloat(drive?.drive_details?.total_space)) *
                100 || 0
            }
            sx={{ height: 6, borderRadius: 3 }}
          />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mt: 0.5,
            }}
          ></Box>
        </Box>
      </Box>
    </Accordion>
  );
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

  function AddDrivesDialog() {
    return (
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
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "", color: "white" }}>
                      {/* {Drives[p].provider_icon() || null} */}
                    </Avatar>
                  </ListItemAvatar>

                  <ListItemText primary={name} />
                </ListItemButton>
              </ListItem>
            );
          })}
          <ListItem disablePadding>
            {/* make this one red */}

            <ListItemButton
              onClick={() => setIsDialogNewSecondaryDriveOpen(false)}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: "error.main" }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </Avatar>
              </ListItemAvatar>

              <ListItemText primary="Cancel" />
            </ListItemButton>
          </ListItem>
        </List>
      </Dialog>
    );
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
      Combined Stats
      <Box
        sx={{
          height: "1px",
          bgcolor: "divider",
          my: 0.5,
          position: "relative",
        }}
      />
      {/* Secondary Drive Cards */}
      <Box sx={{ mt: 2 }}>
        {secondaryDrives.map((drive: Drive, index: number) => (
          <DriveCard key={index} {...drive} />
        ))}
      </Box>
      <Button
        variant="outlined"
        fullWidth
        sx={{ mt: 2, my: 0.2 }}
        onClick={() => setIsDialogNewSecondaryDriveOpen(true)}
      >
        Add Drive
      </Button>
      <AddDrivesDialog />
    </div>
  );
}
