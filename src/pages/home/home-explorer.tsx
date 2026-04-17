import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { memo, useMemo } from "react";

import type { LogicalEntry, LogicalFolder } from "../../contexts/LogicalFolderTypes";
import { useTasksState } from "../../contexts/TasksContext";
import { formatBytes } from "../../utils/formatting";

interface HomeExplorerProps {
  logicalFolders: LogicalFolder[];
  activeLogicalFolder?: LogicalFolder;
  currentParentId: string | null;
  selectedEntryId: string | null;
  breadcrumbs: LogicalEntry[];
  onOpenLogicalFolder: (logicalFolderId: string) => void;
  onBackToRoot: () => void;
  onNavigateToFolder: (entryId: string) => void;
  onOpenEntry: (entry: LogicalEntry) => void;
  onOpenInfo: (entry: LogicalEntry) => void;
  onCreateLogicalFolder: () => void;
}

function folderIcon() {
  return "▣";
}

function fileIcon() {
  return "◆";
}

function infoIcon() {
  return "i";
}

function activeTaskSummary(activeTaskCount: number) {
  if (activeTaskCount === 0) {
    return "No active operations";
  }

  return `${activeTaskCount} background operation${activeTaskCount === 1 ? "" : "s"} running`;
}

const ExplorerEntryRow = memo(
  function ExplorerEntryRow({
    entry,
    selected,
    directChildrenCount,
    isBusy,
    onOpenEntry,
    onOpenInfo,
  }: {
    entry: LogicalEntry;
    selected: boolean;
    directChildrenCount: number;
    isBusy: boolean;
    onOpenEntry: (entry: LogicalEntry) => void;
    onOpenInfo: (entry: LogicalEntry) => void;
  }) {
    return (
      <Card
        sx={{
          borderRadius: 5,
          borderColor: selected ? "primary.main" : "divider",
        }}
      >
        <CardContent>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="h4">{entry.kind === "folder" ? folderIcon() : fileIcon()}</Typography>
            <Box
              sx={{ flex: 1, minWidth: 0, cursor: entry.kind === "folder" ? "pointer" : "default" }}
              onClick={() => onOpenEntry(entry)}
            >
              <Typography variant="subtitle1" noWrap>
                {entry.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {entry.kind === "folder"
                  ? `${directChildrenCount} direct items`
                  : formatBytes(entry.size)}
              </Typography>
            </Box>
            {isBusy ? <CircularProgress size={18} aria-label="Entry operation in progress" /> : null}
            {entry.kind === "folder" ? (
              <Button size="small" variant="outlined" onClick={() => onOpenEntry(entry)}>
                Open
              </Button>
            ) : null}
            <IconButton onClick={() => onOpenInfo(entry)} aria-label="Show details">
              <Typography component="span">{infoIcon()}</Typography>
            </IconButton>
          </Stack>
        </CardContent>
      </Card>
    );
  },
  (prev, next) =>
    prev.entry.id === next.entry.id &&
    prev.entry.name === next.entry.name &&
    prev.entry.kind === next.entry.kind &&
    prev.entry.size === next.entry.size &&
    prev.selected === next.selected &&
    prev.directChildrenCount === next.directChildrenCount &&
    prev.isBusy === next.isBusy,
);

export function HomeExplorer({
  logicalFolders,
  activeLogicalFolder,
  currentParentId,
  selectedEntryId,
  breadcrumbs,
  onOpenLogicalFolder,
  onBackToRoot,
  onNavigateToFolder,
  onOpenEntry,
  onOpenInfo,
  onCreateLogicalFolder,
}: HomeExplorerProps) {
  const { tasks } = useTasksState();
  const activeTasks = useMemo(
    () =>
      tasks.filter(
        (task) => task.status === "queued" || task.status === "running",
      ),
    [tasks],
  );
  const busyEntryIds = useMemo(() => {
    const ids = new Set<string>();

    activeTasks.forEach((task) => {
      task.microtasks.forEach((microtask) => {
        if (microtask.status !== "queued" && microtask.status !== "running") {
          return;
        }

        switch (microtask.kind) {
          case "create-folder":
            ids.add(microtask.entry.id);
            if (microtask.entry.parentId) {
              ids.add(microtask.entry.parentId);
            }
            break;
          case "upload-file":
            if (microtask.entry.parentId) {
              ids.add(microtask.entry.parentId);
            }
            break;
          case "copy-file":
            ids.add(microtask.sourceEntryId);
            if (microtask.entry.parentId) {
              ids.add(microtask.entry.parentId);
            }
            break;
          case "remove-manifest":
            ids.add(microtask.entryId);
            break;
          default:
            break;
        }
      });
    });

    return ids;
  }, [activeTasks]);

  if (!activeLogicalFolder) {
    return (
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h4">Logical folders</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.75 }}>
            Create logical folders to span uploads across multiple drives.
          </Typography>
        </Box>

        {logicalFolders.length === 0 ? (
          <Card
            sx={(theme) => ({
              borderRadius: 6,
              borderStyle: "dashed",
              background: alpha(theme.palette.primary.main, 0.05),
            })}
          >
            <CardContent sx={{ py: 6, textAlign: "center" }}>
              <Typography variant="h6">No logical folders yet</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Pick the drives you want to combine, then upload into that shared logical space.
              </Typography>
              <Button sx={{ mt: 2 }} variant="contained" onClick={onCreateLogicalFolder}>
                + Create logical folder
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2}>
            {logicalFolders.map((logicalFolder) => (
              <Card key={logicalFolder.id} sx={{ borderRadius: 5 }}>
                <CardActionArea onClick={() => onOpenLogicalFolder(logicalFolder.id)}>
                  <CardContent>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Typography variant="h3" component="div">
                        {folderIcon()}
                      </Typography>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" noWrap>
                          {logicalFolder.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {logicalFolder.backends.length} backend drive
                          {logicalFolder.backends.length === 1 ? "" : "s"} ·{" "}
                          {logicalFolder.items.length} items
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        {logicalFolder.backends.map((backend) => (
                          <Chip
                            key={backend.driveKey}
                            label={backend.email.split("@")[0]}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>
    );
  }

  const entries = activeLogicalFolder.items.filter(
    (entry) => entry.parentId === currentParentId,
  );
  const childCountByParent = useMemo(() => {
    const counts = new Map<string, number>();
    activeLogicalFolder.items.forEach((item) => {
      if (!item.parentId) {
        return;
      }

      counts.set(item.parentId, (counts.get(item.parentId) || 0) + 1);
    });
    return counts;
  }, [activeLogicalFolder.items]);

  return (
    <Stack spacing={2.5}>
      {activeTasks.length > 0 ? (
        <Card variant="outlined">
          <CardContent sx={{ py: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {activeTaskSummary(activeTasks.length)}
            </Typography>
            <LinearProgress sx={{ mt: 1 }} />
          </CardContent>
        </Card>
      ) : null}
      <Stack spacing={1}>
        <Typography variant="h4">{activeLogicalFolder.name}</Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          <Chip label="All logical folders" onClick={onBackToRoot} />
          {breadcrumbs.map((crumb) => (
            <Chip
              key={crumb.id}
              label={crumb.name}
              onClick={() => onNavigateToFolder(crumb.id)}
            />
          ))}
        </Stack>
      </Stack>

      {entries.length === 0 ? (
        <Card
          sx={(theme) => ({
            borderRadius: 6,
            borderStyle: "dashed",
            background: alpha(theme.palette.primary.main, 0.04),
          })}
        >
          <CardContent sx={{ py: 6, textAlign: "center" }}>
            <Typography variant="h6">This folder is empty</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Use the upload action to add files or a folder tree here.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {entries.map((entry) => (
            <ExplorerEntryRow
              key={entry.id}
              entry={entry}
              selected={selectedEntryId === entry.id}
              directChildrenCount={childCountByParent.get(entry.id) || 0}
              isBusy={busyEntryIds.has(entry.id)}
              onOpenEntry={onOpenEntry}
              onOpenInfo={onOpenInfo}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
