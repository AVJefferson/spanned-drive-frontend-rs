import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Dialog,
  DialogContent,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useLogicalFolders } from "../../contexts/LogicalFolders";
import type { LogicalEntry } from "../../contexts/LogicalFolderTypes";
import { useSession } from "../../contexts/SessionContext";
import { useTasksActions } from "../../contexts/TasksContext";
import { createDriveKey } from "../../utils/ids";
import { ErrorBoundary } from "../../components/ErrorBoundary";

import { CreateLogicalFolderDialog, DestinationDialog } from "./home-dialogs";
import { HomeExplorer } from "./home-explorer";
import { InfoTab, SettingsTab, DrivesTab, TasksTab } from "./right-pane-tabs";

function FolderTabIcon() {
  return "▣";
}

function DrivesTabIcon() {
  return "◫";
}

function TasksTabIcon() {
  return "✓";
}

function SettingsTabIcon() {
  return "◌";
}

function InfoTabIcon() {
  return "i";
}

const HomePage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { session, setDriveUsageLimit, refreshAllDriveDetails } = useSession();
  const { logicalFolders, isReady, createLogicalFolder, getLogicalFolder } =
    useLogicalFolders();
  const { enqueueUpload, enqueueDelete, enqueueCopy, enqueueMove } = useTasksActions();

  const [selectedLogicalFolderId, setSelectedLogicalFolderId] = useState<string | null>(
    null,
  );
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [selectedDesktopTab, setSelectedDesktopTab] = useState(0);
  const [selectedMobileTab, setSelectedMobileTab] = useState("folders");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [selectedDriveKeys, setSelectedDriveKeys] = useState<string[]>([]);
  const [createError, setCreateError] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [uploadAnchorEl, setUploadAnchorEl] = useState<HTMLElement | null>(null);
  const [copyMoveMode, setCopyMoveMode] = useState<"copy" | "move" | null>(null);
  const [destinationParentId, setDestinationParentId] = useState<string | null>(null);
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const refreshedDriveSetRef = useRef<string | null>(null);

  useEffect(() => {
    folderInputRef.current?.setAttribute("webkitdirectory", "");
    folderInputRef.current?.setAttribute("directory", "");
  }, []);

  useEffect(() => {
    if (!session.primaryDrive) {
      navigate("/signin");
    }
  }, [navigate, session.primaryDrive]);

  useEffect(() => {
    const driveSetSignature = [
      ...(session.primaryDrive
        ? [createDriveKey(session.primaryDrive.provider, session.primaryDrive.email)]
        : []),
      ...session.secondaryDrives.map((drive) =>
        createDriveKey(drive.provider, drive.email),
      ),
    ]
      .sort()
      .join("|");

    if (!driveSetSignature || refreshedDriveSetRef.current === driveSetSignature) {
      return;
    }

    refreshedDriveSetRef.current = driveSetSignature;
    void refreshAllDriveDetails();
  }, [refreshAllDriveDetails, session.primaryDrive, session.secondaryDrives]);

  const activeLogicalFolder = selectedLogicalFolderId
    ? getLogicalFolder(selectedLogicalFolderId)
    : undefined;
  const selectedEntry = activeLogicalFolder?.items.find(
    (entry) => entry.id === selectedEntryId,
  );

  const allAvailableDrives = useMemo(
    () => [
      ...(session.primaryDrive ? [session.primaryDrive] : []),
      ...session.secondaryDrives,
    ],
    [session.primaryDrive, session.secondaryDrives],
  );

  const breadcrumbs = useMemo(() => {
    if (!activeLogicalFolder || !currentParentId) {
      return [];
    }

    const items: LogicalEntry[] = [];
    let pointer = activeLogicalFolder.items.find((entry) => entry.id === currentParentId);
    while (pointer) {
      items.unshift(pointer);
      pointer = pointer.parentId
        ? activeLogicalFolder.items.find((entry) => entry.id === pointer?.parentId)
        : undefined;
    }

    return items;
  }, [activeLogicalFolder, currentParentId]);

  const destinationOptions = useMemo(
    () => [
      {
        id: null,
        label: activeLogicalFolder ? `${activeLogicalFolder.name} /` : "Root",
      },
      ...(activeLogicalFolder?.items
        .filter((entry) => entry.kind === "folder" && entry.id !== selectedEntryId)
        .map((entry) => ({
          id: entry.id,
          label: entry.name,
        })) || []),
    ],
    [activeLogicalFolder, selectedEntryId],
  );

  if (!session.primaryDrive) {
    return null;
  }

  const resetSelection = () => {
    setSelectedEntryId(null);
    setMobileInfoOpen(false);
  };

  const openLogicalFolder = (logicalFolderId: string) => {
    setSelectedLogicalFolderId(logicalFolderId);
    setCurrentParentId(null);
    resetSelection();
  };

  const openEntry = (entry: LogicalEntry) => {
    if (entry.kind === "folder") {
      setCurrentParentId(entry.id);
      resetSelection();
      return;
    }

    setSelectedEntryId(entry.id);
    setSelectedDesktopTab(1);
    if (isMobile) {
      setMobileInfoOpen(true);
    }
  };

  const openInfo = (entry: LogicalEntry) => {
    setSelectedEntryId(entry.id);
    setSelectedDesktopTab(1);
    if (isMobile) {
      setMobileInfoOpen(true);
    }
  };

  const handleCreateLogicalFolder = async () => {
    const drives = allAvailableDrives.filter((drive) =>
      selectedDriveKeys.includes(`${drive.provider}:${drive.email}`.toLowerCase()),
    );

    if (!createName.trim()) {
      setCreateError("A logical folder name is required.");
      return;
    }

    if (drives.length === 0) {
      setCreateError("Select at least one backend drive.");
      return;
    }

    setIsCreatingFolder(true);
    setCreateError("");
    try {
      const folder = await createLogicalFolder(createName.trim(), drives);
      openLogicalFolder(folder.id);
      setCreateDialogOpen(false);
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : "Unable to create logical folder.",
      );
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const enqueueSelectedUpload = (files: File[]) => {
    if (!activeLogicalFolder || files.length === 0) {
      return;
    }

    enqueueUpload(activeLogicalFolder.id, currentParentId, files);
  };

  const detailsPanel =
    selectedEntry && activeLogicalFolder ? (
      <InfoTab
        selectedEntry={selectedEntry}
        logicalFolder={activeLogicalFolder}
        onDelete={() => {
          if (window.confirm(`Delete ${selectedEntry.name}?`)) {
            enqueueDelete(activeLogicalFolder.id, selectedEntry.id);
            resetSelection();
          }
        }}
        onCopy={() => {
          setCopyMoveMode("copy");
          setDestinationParentId(currentParentId);
        }}
        onMove={() => {
          setCopyMoveMode("move");
          setDestinationParentId(currentParentId);
        }}
      />
    ) : (
      <SettingsTab />
    );

  const explorerPanel = (
    <ErrorBoundary
      title="Explorer error"
      message="The file explorer failed to render. Retry this section or reload the app."
    >
      <Paper sx={{ flex: 1, minHeight: 0, overflow: "auto", p: { xs: 2, md: 3 } }}>
        {!isReady ? (
          <Typography color="text.secondary">Loading your logical folders...</Typography>
        ) : (
          <HomeExplorer
            logicalFolders={logicalFolders}
            activeLogicalFolder={activeLogicalFolder}
            currentParentId={currentParentId}
            selectedEntryId={selectedEntryId}
            breadcrumbs={breadcrumbs}
            onOpenLogicalFolder={openLogicalFolder}
            onBackToRoot={() => {
              setSelectedLogicalFolderId(null);
              setCurrentParentId(null);
              resetSelection();
            }}
            onNavigateToFolder={(entryId) => {
              setCurrentParentId(entryId);
              resetSelection();
            }}
            onOpenEntry={openEntry}
            onOpenInfo={openInfo}
            onCreateLogicalFolder={() => {
              setCreateName("");
              setSelectedDriveKeys([]);
              setCreateError("");
              setCreateDialogOpen(true);
            }}
          />
        )}
      </Paper>
    </ErrorBoundary>
  );

  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "background.default" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ px: { xs: 2, md: 3 }, py: 2 }}
      >
        <Box>
          <Typography variant="overline" color="text.secondary">
            Spanned Drive
          </Typography>
          <Typography variant="h5">Unified cloud storage</Typography>
        </Box>
        {selectedMobileTab === "folders" || !isMobile ? (
          <Button
            variant="contained"
            onClick={(event) => {
              if (!selectedLogicalFolderId) {
                setCreateName("");
                setSelectedDriveKeys([]);
                setCreateError("");
                setCreateDialogOpen(true);
                return;
              }

              setUploadAnchorEl(event.currentTarget);
            }}
          >
            + {selectedLogicalFolderId ? "Upload" : "New logical folder"}
          </Button>
        ) : null}
      </Stack>

      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        onChange={(event) => {
          enqueueSelectedUpload(Array.from(event.target.files || []));
          event.target.value = "";
        }}
      />
      <input
        ref={folderInputRef}
        type="file"
        hidden
        multiple
        onChange={(event) => {
          enqueueSelectedUpload(Array.from(event.target.files || []));
          event.target.value = "";
        }}
      />

      <Menu
        anchorEl={uploadAnchorEl}
        open={Boolean(uploadAnchorEl)}
        onClose={() => setUploadAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            setUploadAnchorEl(null);
            fileInputRef.current?.click();
          }}
        >
          Upload files
        </MenuItem>
        <MenuItem
          onClick={() => {
            setUploadAnchorEl(null);
            folderInputRef.current?.click();
          }}
        >
          Upload folder
        </MenuItem>
      </Menu>

      <Box sx={{ flex: 1,  minHeight: 0, px: { xs: 0, md: 3 }, pb: isMobile ? 10 : 3 }}>
        {isMobile ? (
          <Box sx={{ height: "100%" }}>
            {selectedMobileTab === "folders" ? explorerPanel : null}
            {selectedMobileTab === "drives" ? (
              <Paper sx={{ p: 2.5 }}>
                <DrivesTab
                  primaryDrive={session.primaryDrive}
                  secondaryDrives={session.secondaryDrives}
                  onChangeUsageLimit={setDriveUsageLimit}
                />
              </Paper>
            ) : null}
            {selectedMobileTab === "tasks" ? (
              <Paper sx={{ p: 2.5 }}>
                <TasksTab />
              </Paper>
            ) : null}
            {selectedMobileTab === "settings" ? (
              <Paper sx={{ p: 2.5 }}>
                <SettingsTab />
              </Paper>
            ) : null}
          </Box>
        ) : (
          <Stack direction="row" spacing={2}>
            {explorerPanel}
            <Paper sx={{ width: 380, minWidth: 380, display: "flex", flexDirection: "column", height: "calc(100vh - 125px)"}}>
              <Tabs value={selectedDesktopTab} onChange={(_, value) => setSelectedDesktopTab(value)} variant="fullWidth">
                <Tab label={DrivesTabIcon()} />
                <Tab label={InfoTabIcon()} />
                <Tab label={TasksTabIcon()} />
              </Tabs>
              <Box sx={{ flex: 1, overflow: "auto", p: 2.5 }}>
                {selectedDesktopTab === 0 ? (
                  <DrivesTab
                    primaryDrive={session.primaryDrive}
                    secondaryDrives={session.secondaryDrives}
                    onChangeUsageLimit={setDriveUsageLimit}
                  />
                ) : null}
                {selectedDesktopTab === 1 ? detailsPanel : null}
                {selectedDesktopTab === 2 ? <TasksTab /> : null}
              </Box>
            </Paper>
          </Stack>
        )}
      </Box>

      <CreateLogicalFolderDialog
        open={createDialogOpen}
        drives={allAvailableDrives}
        selectedDriveKeys={selectedDriveKeys}
        name={createName}
        error={createError}
        creating={isCreatingFolder}
        onClose={() => setCreateDialogOpen(false)}
        onNameChange={setCreateName}
        onToggleDrive={(driveKey) =>
          setSelectedDriveKeys((current) =>
            current.includes(driveKey)
              ? current.filter((item) => item !== driveKey)
              : [...current, driveKey],
          )
        }
        onCreate={handleCreateLogicalFolder}
      />

      <DestinationDialog
        open={Boolean(copyMoveMode && selectedEntry)}
        mode={copyMoveMode}
        options={destinationOptions}
        selectedDestinationId={destinationParentId}
        onClose={() => setCopyMoveMode(null)}
        onSelect={setDestinationParentId}
        onConfirm={() => {
          if (!activeLogicalFolder || !selectedEntry || !copyMoveMode) {
            return;
          }

          if (copyMoveMode === "copy") {
            enqueueCopy(activeLogicalFolder.id, selectedEntry.id, destinationParentId);
          } else {
            enqueueMove(activeLogicalFolder.id, selectedEntry.id, destinationParentId);
          }

          setCopyMoveMode(null);
          resetSelection();
        }}
      />

      <Dialog
        open={mobileInfoOpen && Boolean(selectedEntry && activeLogicalFolder)}
        onClose={() => setMobileInfoOpen(false)}
        fullWidth
      >
        <DialogContent>
          {selectedEntry && activeLogicalFolder ? detailsPanel : null}
        </DialogContent>
      </Dialog>

      {isMobile ? (
        <Paper elevation={8} sx={{ position: "fixed", left: 12, right: 12, bottom: 12, borderRadius: 999, overflow: "hidden" }}>
          <BottomNavigation value={selectedMobileTab} onChange={(_, value) => setSelectedMobileTab(value)} showLabels>
            <BottomNavigationAction label="Folders" value="folders" icon={<span>{FolderTabIcon()}</span>} />
            <BottomNavigationAction label="Drives" value="drives" icon={<span>{DrivesTabIcon()}</span>} />
            <BottomNavigationAction label="Tasks" value="tasks" icon={<span>{TasksTabIcon()}</span>} />
            <BottomNavigationAction label="Settings" value="settings" icon={<span>{SettingsTabIcon()}</span>} />
          </BottomNavigation>
        </Paper>
      ) : null}
    </Box>
  );
};

export default HomePage;
