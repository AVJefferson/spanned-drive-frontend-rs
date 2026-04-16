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
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import type { LogicalEntry, LogicalFolder } from "../../contexts/LogicalFolderTypes";
import { useRuntime } from "../../contexts/RuntimeContext";
import { useSession } from "../../contexts/SessionContext";
import { useSettings } from "../../contexts/SettingsContext";
import { useTasks } from "../../contexts/TasksContext";
import { formatBytes, formatDateTime } from "../../utils/formatting";
export { default as DrivesTab } from "./drives-tab";

interface InfoTabProps {
  selectedEntry: LogicalEntry;
  logicalFolder: LogicalFolder;
  onDelete: () => void;
  onCopy: () => void;
  onMove: () => void;
}

function DrivePlacementList({
  selectedEntry,
}: {
  selectedEntry: LogicalEntry;
}) {
  return (
    <Stack spacing={1}>
      {selectedEntry.placements.map((placement) => (
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
                ? `${logicalFolder.items.filter(
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
            Detected via: {runtime.via}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Platform: {runtime.platform}
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}

export function TasksTab() {
  const { tasks, retryTask, clearFinishedTasks } = useTasks();

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
