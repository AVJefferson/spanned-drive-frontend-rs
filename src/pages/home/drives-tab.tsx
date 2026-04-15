import { Box, Accordion, Typography, Button, Grid, LinearProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { LogoutFromLocalStorage } from "../../services/browser/logout";
import { Drive } from "../../contexts/Drive";

function DriveCard(drive: Drive) {
  return <></>;
}

function OnBtnClickLogout() {
  const Navigate = useNavigate();
  LogoutFromLocalStorage();
  Navigate("/signin");
}

function LogoutIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "#fff" }}
    >
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
      <line x1="12" y1="2" x2="12" y2="12"></line>
    </svg>
  );
}

export default function DrivesTab(props: any) {
  const [expandedDrives, setExpandedDrives] = useState<string[]>([]);

  const { primaryDrive, secondaryDrives } = props;

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
          {/* it should be 4 numbers 2 rows 2 columns, used storage / total storage  and sdrive usage / sdrive limit*/}
          {/* do not use grid and make the text small + add colors */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              mt: 1.5,
              gap: 1,
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ flex: "1 1 40%" }}>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ fontSize: "0.65rem" }}
              >
                Total Usage
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontWeight: "medium", color: "primary.main" }}
              >
                {primaryDrive.drive_details?.used_space || 0}GB /{" "}
                {primaryDrive.drive_details?.total_space || 0}GB
              </Typography>
            </Box>
            <Box sx={{ flex: "1 1 40%" }}>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ fontSize: "0.65rem" }}
              >
                SDrive Usage
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontWeight: "medium", color: "secondary.main" }}
              >
                {primaryDrive.drive_details?.sdrive_usage || 0}GB /{" "}
                {primaryDrive.drive_settings?.usage_limit || 0}GB
              </Typography>
            </Box>
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
      <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
        Add Drive
      </Button>
    </div>
  );
}
