import { useEffect, useState } from "react";
import { Box, Grid, Paper, Typography, Tab, Tabs, Button } from "@mui/material";

import { useSession } from "../../contexts/SessionContext";

import { InfoTab, SettingsTab, DrivesTab, TasksTab } from "./right-pane-tabs";

const HomePage = () => {
  const { session } = useSession();

  const [logicalFolders, setLogicalFolders] = useState([]);
  const [selectedLogicalDirPath, setSelectedLogicalDirPath] = useState(null);
  const [selectedLogicalFile, setSelectedLogicalFile] = useState(null);

  const [selectedRhsTab, setSelectedRhsTab] = useState(0);

  if (!session || !session.primaryDrive) {
    // navigate to signing page
    console.log({ session });
    window.location.href = "/signin";
    return null;
  }

  interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }

  function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`vertical-tabpanel-${index}`}
        aria-labelledby={`vertical-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ p: 3 }}>
            <Typography>{children}</Typography>
          </Box>
        )}
      </div>
    );
  }

  function a11yProps(index: number) {
    return {
      id: `vertical-tab-${index}`,
      "aria-controls": `vertical-tabpanel-${index}`,
    };
  }

  const handleRhsTabChange = (
    _event: React.SyntheticEvent,
    newValue: number,
  ) => {
    setSelectedRhsTab(newValue);
  };

  function InfoIcon() {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    );
  }

  function DrivesIcon() {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
        <line x1="6" y1="6" x2="6.01" y2="6"></line>
        <line x1="6" y1="18" x2="6.01" y2="18"></line>
      </svg>
    );
  }

  function TasksIcon() {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="9 11 12 14 22 4"></polyline>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
      </svg>
    );
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
        {/* Middle Content */}
        <Grid size={{ xs: 12, sm: 10 }}>
          <Paper sx={{ height: "100%", p: 2, overflowY: "auto" }}>
            <Typography variant="h4">Main Content Area</Typography>
            <Typography sx={{ mt: 2 }}>
              Your primary application content goes here. This area is set to
              scroll independently if the content exceeds the height.
            </Typography>
          </Paper>
        </Grid>

        {/* Right Pane */}
        <Grid
          size={{ xs: 12, sm: 2 }}
          sx={{ display: { xs: "none", sm: "flex" }, flexDirection: "column" }}
        >
          <Tabs
            orientation="horizontal"
            variant="fullWidth"
            value={selectedRhsTab}
            onChange={handleRhsTabChange}
            aria-label="Right pane tabs"
            sx={{ minHeight: 48, borderBottom: 1, borderColor: "divider" }}
          >
            <Tab
              icon={DrivesIcon()}
              sx={{ minHeight: 48, minWidth: 0, p: 1 }}
              {...a11yProps(0)}
            />
            <Tab
              icon={InfoIcon()}
              sx={{ minHeight: 48, minWidth: 0, p: 1 }}
              {...a11yProps(1)}
            />
            <Tab
              icon={TasksIcon()}
              sx={{ minHeight: 48, minWidth: 0, p: 1 }}
              {...a11yProps(2)}
            />
          </Tabs>
          <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
            <TabPanel value={selectedRhsTab} index={0}>
              <DrivesTab
                primaryDrive={session.primaryDrive}
                secondaryDrives={session.secondaryDrives}
              />
            </TabPanel>
            <TabPanel value={selectedRhsTab} index={1}>
              {selectedLogicalDirPath ? <InfoTab /> : <SettingsTab />}
            </TabPanel>
            <TabPanel value={selectedRhsTab} index={2}>
              <TasksTab />
            </TabPanel>
          </Box>
        </Grid>
      </Grid>

      {/* Bottom Pane */}
      <Box sx={{ mt: 1, display: { xs: "block", sm: "none" } }}>
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
