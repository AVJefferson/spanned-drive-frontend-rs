import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import type { LogicalEntry, LogicalFolder } from "../../contexts/LogicalFolderTypes";
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

  return (
    <Stack spacing={2.5}>
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
            <Card
              key={entry.id}
              sx={{
                borderRadius: 5,
                borderColor: selectedEntryId === entry.id ? "primary.main" : "divider",
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
                        ? `${activeLogicalFolder.items.filter((item) => item.parentId === entry.id).length} direct items`
                        : formatBytes(entry.size)}
                    </Typography>
                  </Box>
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
          ))}
        </Stack>
      )}
    </Stack>
  );
}
