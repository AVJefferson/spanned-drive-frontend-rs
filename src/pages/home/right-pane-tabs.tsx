import { Box, Accordion, Typography, Button } from "@mui/material";
import { Drive } from "../../contexts/Drive";

export function InfoTab() {
  return <></>;
}

export function SettingsTab() {
  return <></>;
}

function DriveCard(drive: Drive) {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="body2" sx={{ fontWeight: "medium" }}>
        {drive.provider_icon()}
      </Typography>
    </Box>
  );
}

export function DrivesTab(props: any) {
  const { primaryDrive, secondaryDrives } = props;

  return (
    <div>
      
    </div>
  );
}

export function TasksTab() {
  return <></>;
}
