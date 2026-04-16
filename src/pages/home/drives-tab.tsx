import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Slider,
  Stack,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

import { Drives, type Drive } from "../../contexts/Drive";
import { createDriveKey } from "../../utils/ids";
import { formatBytes, formatPercent } from "../../utils/formatting";

interface DrivesTabProps {
  primaryDrive: Drive;
  secondaryDrives: Drive[];
  onChangeUsageLimit: (driveKey: string, usageLimitPercent: number) => void;
}

function usageStats(drive: Drive) {
  const total = Number(drive.drive_details.totalSpace || 0);
  const used = Number(drive.drive_details.usedSpace || 0);
  const limitPercent =
    Number(
      drive.drive_settings.usageLimitPercent ??
        drive.drive_settings.allowed_space_usage_percent,
    ) || 85;
  const allowed = total ? (total * limitPercent) / 100 : 0;
  const usableRemaining = allowed ? Math.max(allowed - used, 0) : 0;

  return {
    total,
    used,
    allowed,
    usableRemaining,
    usedPercent: total ? (used / total) * 100 : 0,
    allowedPercent: total ? (allowed / total) * 100 : limitPercent,
    limitPercent,
  };
}

function SecondaryDriveCard({
  drive,
  onChangeUsageLimit,
}: {
  drive: Drive;
  onChangeUsageLimit: (driveKey: string, usageLimitPercent: number) => void;
}) {
  const stats = usageStats(drive);

  return (
    <Card variant="outlined" sx={{ borderRadius: 4 }}>
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <Avatar sx={{ bgcolor: "transparent", width: 40, height: 40 }}>
            {drive.provider_icon()}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle2" noWrap>
              {drive.user?.name || drive.email}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {drive.providerLabel}
            </Typography>
          </Box>
        </Stack>

        <Typography variant="caption" color="text.secondary">
          Current usage
        </Typography>
        <LinearProgress
          variant="determinate"
          value={stats.usedPercent}
          sx={{ mt: 0.75, mb: 0.75, height: 10, borderRadius: 999 }}
        />
        <Typography variant="body2" color="text.secondary">
          {formatBytes(stats.used)} used of {formatBytes(stats.total)}
        </Typography>

        <Box sx={{ mt: 2.5 }}>
          <Typography variant="caption" color="text.secondary">
            Spanned Drive usage cap
          </Typography>
          <Slider
            min={10}
            max={100}
            step={5}
            value={stats.limitPercent}
            onChange={(_, value) =>
              onChangeUsageLimit(
                createDriveKey(drive.provider, drive.email),
                Array.isArray(value) ? value[0] : value,
              )
            }
            sx={{ mt: 0.5 }}
          />
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Limit: {formatPercent(stats.limitPercent)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Free for SDrive: {formatBytes(stats.usableRemaining)}
            </Typography>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DrivesTab({
  primaryDrive,
  secondaryDrives,
  onChangeUsageLimit,
}: DrivesTabProps) {
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);

  const primaryStats = usageStats(primaryDrive);
  const secondaryTotals = useMemo(() => {
    return secondaryDrives.reduce(
      (accumulator, drive) => {
        const stats = usageStats(drive);
        accumulator.used += stats.used;
        accumulator.allowed += stats.allowed;
        return accumulator;
      },
      {
        used: 0,
        allowed: 0,
      },
    );
  }, [secondaryDrives]);

  return (
    <Stack spacing={2}>
      <Card
        sx={{
          borderRadius: 5,
          background:
            "linear-gradient(155deg, rgba(3,105,161,0.22), rgba(14,165,233,0.05))",
        }}
      >
        <CardContent>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: "transparent", width: 48, height: 48 }}>
              {primaryDrive.provider_icon()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="overline" color="text.secondary">
                Primary drive
              </Typography>
              <Typography variant="h6" noWrap>
                {primaryDrive.user?.name || primaryDrive.email}
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={primaryStats.usedPercent}
              sx={{ height: 12, borderRadius: 999 }}
            />
            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{ mt: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                {formatBytes(primaryStats.used)} used
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatBytes(primaryStats.total)} total
              </Typography>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 4 }}>
        <CardContent>
          <Typography variant="subtitle2">Secondary combined usage</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {secondaryDrives.length === 0
              ? "Add secondary drives to spread uploads across more storage."
              : `${formatBytes(secondaryTotals.used)} of ${formatBytes(secondaryTotals.allowed)} within configured SDrive limits.`}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={
              secondaryTotals.allowed
                ? (secondaryTotals.used / secondaryTotals.allowed) * 100
                : 0
            }
            sx={{ mt: 1.5, height: 10, borderRadius: 999 }}
          />
        </CardContent>
      </Card>

      <Stack spacing={1.5}>
        {secondaryDrives.map((drive) => (
          <SecondaryDriveCard
            key={createDriveKey(drive.provider, drive.email)}
            drive={drive}
            onChangeUsageLimit={onChangeUsageLimit}
          />
        ))}
      </Stack>

      <Button variant="contained" onClick={() => setProviderDialogOpen(true)}>
        Add secondary drive
      </Button>

      <Dialog
        open={providerDialogOpen}
        onClose={() => setProviderDialogOpen(false)}
        fullWidth
      >
        <DialogTitle>Select a provider</DialogTitle>
        <List sx={{ pt: 0 }}>
          {Object.values(Drives).map((DriveImplementation) => (
            <ListItem disablePadding key={DriveImplementation.provider}>
              <ListItemButton
                onClick={() => {
                  setProviderDialogOpen(false);
                  DriveImplementation.oauth_redirect({
                    accountType: "secondary",
                    hint: primaryDrive.email,
                  });
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: "transparent" }}>
                    {new DriveImplementation({}).provider_icon()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={DriveImplementation.provider_label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Dialog>
    </Stack>
  );
}
