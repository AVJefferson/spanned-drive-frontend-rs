import {
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import type { Drive } from "../../contexts/Drive";
import { createDriveKey } from "../../utils/ids";
import { formatBytes } from "../../utils/formatting";

export function CreateLogicalFolderDialog({
  open,
  drives,
  selectedDriveKeys,
  name,
  error,
  creating,
  onClose,
  onNameChange,
  onToggleDrive,
  onCreate,
}: {
  open: boolean;
  drives: Drive[];
  selectedDriveKeys: string[];
  name: string;
  error: string;
  creating: boolean;
  onClose: () => void;
  onNameChange: (value: string) => void;
  onToggleDrive: (driveKey: string) => void;
  onCreate: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Create logical folder</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Logical folder name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            autoFocus
          />
          <Typography variant="subtitle2">Backend drives</Typography>
          <Stack spacing={1}>
            {drives.map((drive) => {
              const driveKey = createDriveKey(drive.provider, drive.email);
              const selected = selectedDriveKeys.includes(driveKey);
              return (
                <Card key={driveKey} variant="outlined" sx={{ borderRadius: 4 }}>
                  <CardActionArea onClick={() => onToggleDrive(driveKey)}>
                    <CardContent>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Checkbox checked={selected} />
                        <Stack sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" noWrap>
                            {drive.user?.name || drive.email}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {drive.providerLabel}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {formatBytes(drive.drive_details.freeSpace || 0)} free
                        </Typography>
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })}
          </Stack>
          {error ? (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onCreate} disabled={creating}>
          {creating ? "Creating..." : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function DestinationDialog({
  open,
  mode,
  options,
  selectedDestinationId,
  onClose,
  onSelect,
  onConfirm,
}: {
  open: boolean;
  mode: "copy" | "move" | null;
  options: { id: string | null; label: string }[];
  selectedDestinationId: string | null;
  onClose: () => void;
  onSelect: (destinationId: string | null) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>{mode === "move" ? "Move item" : "Copy item"}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.25} sx={{ mt: 1 }}>
          {options.map((option) => (
            <Card
              key={option.id || "root"}
              variant="outlined"
              sx={{
                borderRadius: 4,
                borderColor:
                  selectedDestinationId === option.id ? "primary.main" : "divider",
              }}
            >
              <CardActionArea onClick={() => onSelect(option.id)}>
                <CardContent>
                  <Typography variant="subtitle2">{option.label}</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onConfirm}>
          {mode === "move" ? "Move" : "Copy"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
