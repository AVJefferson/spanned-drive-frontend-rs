import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Link as MuiLink,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";

import type {
  LogicalEntry,
  LogicalFolder,
  LogicalDrivePackingMode,
} from "../../contexts/LogicalFolderTypes";
import {
  MAX_CHUNK_SIZE_BYTES,
  MIN_CHUNK_SIZE_BYTES,
} from "../../contexts/LogicalFolderTypes";
import { useRuntime } from "../../contexts/RuntimeContext";
import { useSession } from "../../contexts/SessionContext";
import { useSettings } from "../../contexts/SettingsContext";
import { useTasksActions, useTasksState } from "../../contexts/TasksContext";
import { formatBytes, formatDateTime } from "../../utils/formatting";
export { default as DrivesTab } from "./drives-tab";

interface InfoTabProps {
  selectedEntry: LogicalEntry;
  logicalFolder: LogicalFolder;
  onDelete: () => void;
  onCopy: () => void;
  onMove: () => void;
  onDownload: () => void;
}

export function LogicalFolderInfoTab({
  logicalFolder,
  onDeleteLogicalDrive,
  onUpdateSettings,
}: {
  logicalFolder: LogicalFolder;
  onDeleteLogicalDrive: () => void;
  onUpdateSettings: (next: {
    packing?: {
      mode?: LogicalDrivePackingMode;
      chunkSizeBytes?: number;
    };
    listing?: {
      mergeMode?: "combined" | "drive-priority";
      sortBy?: "name" | "size" | "extension";
      sortDirection?: "asc" | "desc";
    };
  }) => void;
}) {
  const chunkSizeMB = Math.round((logicalFolder.packing?.chunkSizeBytes || 0) / (1024 * 1024));
  const minChunkSizeMB = Math.round(MIN_CHUNK_SIZE_BYTES / (1024 * 1024));
  const maxChunkSizeMB = Math.round(MAX_CHUNK_SIZE_BYTES / (1024 * 1024));

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="overline" color="text.secondary">
          Logical drive
        </Typography>
        <Typography variant="h6" sx={{ mt: 0.25 }}>
          {logicalFolder.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {logicalFolder.backends.length} backend drive
          {logicalFolder.backends.length === 1 ? "" : "s"} ·{" "}
          {(logicalFolder.items || []).length} total items
        </Typography>
        {logicalFolder.status === "partially_deleted" ? (
          <Typography variant="body2" color="warning.main" sx={{ mt: 0.75 }}>
            Partial delete in progress. This logical drive is read-only until cleanup succeeds.
          </Typography>
        ) : null}
      </Box>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Created
            </Typography>
            <Typography variant="subtitle2">
              {formatDateTime(logicalFolder.createdAt)}
            </Typography>
            <Divider />
            <Typography variant="body2" color="text.secondary">
              Last updated
            </Typography>
            <Typography variant="subtitle2">
              {formatDateTime(logicalFolder.updatedAt)}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Backing drives
        </Typography>
        <Stack spacing={1}>
          {(logicalFolder.backends || []).map((backend) => (
            <Card key={backend.driveKey} variant="outlined">
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="subtitle2">{backend.email}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {backend.provider}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="subtitle2">Packing settings</Typography>
            <FormControl fullWidth size="small">
              <InputLabel id="packing-mode-select-label">Packing mode</InputLabel>
              <Select
                labelId="packing-mode-select-label"
                label="Packing mode"
                value={logicalFolder.packing?.mode || "container"}
                onChange={(event) =>
                  onUpdateSettings({
                    packing: {
                      mode: event.target.value as LogicalDrivePackingMode,
                    },
                  })
                }
              >
                <MenuItem value="container">Container packing</MenuItem>
                <MenuItem value="form">Form packing</MenuItem>
                <MenuItem value="water-vertical">Water packing vertical</MenuItem>
                <MenuItem value="water-horizontal">Water packing horizontal</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              type="number"
              label={`Chunk size (${minChunkSizeMB}-${maxChunkSizeMB} MB)`}
              value={Number.isFinite(chunkSizeMB) ? chunkSizeMB : minChunkSizeMB}
              onChange={(event) => {
                const value = Number(event.target.value || 0);
                if (!value || Number.isNaN(value)) {
                  return;
                }
                onUpdateSettings({
                  packing: {
                    chunkSizeBytes: value * 1024 * 1024,
                  },
                });
              }}
            />
            {(logicalFolder.packing?.mode === "water-vertical" ||
              logicalFolder.packing?.mode === "water-horizontal") ? (
              <Typography variant="caption" color="warning.main">
                Water packing relies on SDrive metadata and may be unrecoverable if chunks
                are corrupted or manually edited.
              </Typography>
            ) : null}
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="subtitle2">Listing settings</Typography>
            <FormControl fullWidth size="small">
              <InputLabel id="merge-mode-select-label">Merge mode</InputLabel>
              <Select
                labelId="merge-mode-select-label"
                label="Merge mode"
                value={logicalFolder.listing?.mergeMode || "combined"}
                onChange={(event) =>
                  onUpdateSettings({
                    listing: {
                      mergeMode: event.target.value as "combined" | "drive-priority",
                    },
                  })
                }
              >
                <MenuItem value="combined">Combined (all drives)</MenuItem>
                <MenuItem value="drive-priority">Drive priority</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" spacing={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel id="listing-sort-by-label">Sort by</InputLabel>
                <Select
                  labelId="listing-sort-by-label"
                  label="Sort by"
                  value={logicalFolder.listing?.sortBy || "name"}
                  onChange={(event) =>
                    onUpdateSettings({
                      listing: {
                        sortBy: event.target.value as "name" | "size" | "extension",
                      },
                    })
                  }
                >
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="size">Size</MenuItem>
                  <MenuItem value="extension">Extension</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel id="listing-sort-direction-label">Direction</InputLabel>
                <Select
                  labelId="listing-sort-direction-label"
                  label="Direction"
                  value={logicalFolder.listing?.sortDirection || "asc"}
                  onChange={(event) =>
                    onUpdateSettings({
                      listing: {
                        sortDirection: event.target.value as "asc" | "desc",
                      },
                    })
                  }
                >
                  <MenuItem value="asc">Ascending</MenuItem>
                  <MenuItem value="desc">Descending</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Button variant="contained" color="error" onClick={onDeleteLogicalDrive}>
        Delete logical drive
      </Button>
    </Stack>
  );
}

function DrivePlacementList({
  selectedEntry,
}: {
  selectedEntry: LogicalEntry;
}) {
  const placements = selectedEntry.placements || [];

  return (
    <Stack spacing={1}>
      {placements.map((placement) => (
        <Card key={`${placement.driveKey}-${placement.itemId}`} variant="outlined">
          <CardContent sx={{ py: 1.5 }}>
            <Typography variant="subtitle2">{placement.email}</Typography>
            <Typography variant="caption" color="text.secondary">
              {placement.provider}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

export function InfoTab({
  selectedEntry,
  logicalFolder,
  onDelete,
  onCopy,
  onMove,
  onDownload,
}: InfoTabProps) {
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="overline" color="text.secondary">
          Selection
        </Typography>
        <Typography variant="h6" sx={{ mt: 0.25 }}>
          {selectedEntry.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {selectedEntry.kind === "folder" ? "Folder" : "File"} in {logicalFolder.name}
        </Typography>
      </Box>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Size
            </Typography>
            <Typography variant="subtitle2">
              {selectedEntry.kind === "folder"
                ? `${(logicalFolder.items || []).filter(
                    (entry) => entry.parentId === selectedEntry.id,
                  ).length} direct items`
                : formatBytes(selectedEntry.size)}
            </Typography>
            <Divider />
            <Typography variant="body2" color="text.secondary">
              Updated
            </Typography>
            <Typography variant="subtitle2">
              {formatDateTime(selectedEntry.updatedAt)}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Backing drives
        </Typography>
        <DrivePlacementList selectedEntry={selectedEntry} />
      </Box>

      <Stack direction="row" spacing={1}>
        <Button variant="outlined" fullWidth onClick={onCopy}>
          Copy
        </Button>
        <Button variant="outlined" fullWidth onClick={onMove}>
          Move
        </Button>
      </Stack>
      <Button variant="outlined" onClick={onDownload}>
        Download
      </Button>
      <Button variant="contained" color="error" onClick={onDelete}>
        Delete
      </Button>
    </Stack>
  );
}

export function SettingsTab() {
  const navigate = useNavigate();
  const { session, logout } = useSession();
  const { settings, setTheme } = useSettings();
  const runtime = useRuntime();

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar src={session.primaryDrive?.user?.picture}>
              {session.primaryDrive?.user?.name?.[0] || "S"}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle1" noWrap>
                {session.primaryDrive?.user?.name || session.primaryDrive?.email}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {session.primaryDrive?.email}
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="outlined"
            color="error"
            sx={{ mt: 2 }}
            onClick={() => {
              logout();
              navigate("/signin");
            }}
          >
            Log out
          </Button>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            App appearance
          </Typography>
          <FormControl fullWidth>
            <InputLabel id="theme-select-label">Theme</InputLabel>
            <Select
              labelId="theme-select-label"
              value={settings.theme}
              label="Theme"
              onChange={(event) =>
                setTheme(event.target.value as "light" | "dark" | "system")
              }
            >
              <MenuItem value="system">System</MenuItem>
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2">Runtime</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Environment: {runtime.kind}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tauri Version: {runtime?.tauriVersion || "Unknown"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            App Version: {import.meta.env.VITE_APP_VERSION || "Unknown"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Platform: {runtime.platform}
          </Typography>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            About
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Developer: A V Jefferson
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
            <MuiLink component={Link} to="/privacy" underline="hover">
              Privacy Policy
            </MuiLink>
            <Typography component="span" variant="body2" color="text.disabled">
              ·
            </Typography>
            <MuiLink component={Link} to="/terms" underline="hover">
              Terms of Service
            </MuiLink>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
            Built with love ❤️.
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}

export function TasksTab() {
  const { tasks } = useTasksState();
  const { retryTask, clearFinishedTasks } = useTasksActions();

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Tasks</Typography>
        <Button size="small" onClick={clearFinishedTasks}>
          Clear completed
        </Button>
      </Stack>

      {tasks.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Background uploads and file actions will appear here.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        tasks.map((task) => (
          <Card key={task.id} variant="outlined">
            <CardContent>
              <Typography variant="subtitle2">{task.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {task.status} · {task.progress}%
              </Typography>
              {task.error ? (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  {task.error}
                </Typography>
              ) : null}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                {task.microtasks.filter((microtask) => microtask.status === "completed").length} of{" "}
                {task.microtasks.length} microtasks complete
              </Typography>
              {task.status === "failed" ? (
                <Button sx={{ mt: 1.5 }} size="small" onClick={() => retryTask(task.id)}>
                  Retry
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))
      )}
    </Stack>
  );
}
