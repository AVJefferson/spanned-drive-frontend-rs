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

import { Drives } from "../../services/drives/registry";
import type { Drive, DriveReference } from "../../services/drives/types";
import { createDriveKey } from "../../utils/ids";
import { formatBytes, formatPercent } from "../../utils/formatting";
import { getEffectiveLimitPercent } from "../../services/drive-manager/quota-guard";

interface DrivesTabProps {
  primaryDrive: Drive;
  secondaryDrives: Drive[];
  knownSecondaryAccounts: DriveReference[];
  onChangeUsageLimit: (driveKey: string, usageLimitPercent: number) => void;
  onDisconnectSecondaryDrive: (drive: Drive) => void;
  onForgetRememberedSecondaryDrive: (account: DriveReference) => void;
}

function usageStats(drive: Drive) {
  const total = Number(drive.drive_details.totalSpace || 0);
  const used = Number(drive.drive_details.usedSpace || 0);
  const limitPercent =
    getEffectiveLimitPercent(
      Number(
      drive.drive_settings.usageLimitPercent ??
        drive.drive_settings.allowed_space_usage_percent,
      ) || 85,
    );
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
  onDisconnect,
}: {
  drive: Drive;
  onChangeUsageLimit: (driveKey: string, usageLimitPercent: number) => void;
  onDisconnect: (drive: Drive) => void;
}) {
  const stats = usageStats(drive);
  const sdrivePercent = stats.allowed ? (stats.used / stats.allowed) * 100 : 0;
  const isOverCap = stats.allowed > 0 && stats.used > stats.allowed;

  return (
    <Card variant="outlined" sx={{ borderRadius: 4 }}>
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <Avatar sx={{ bgcolor: "transparent", width: 40, height: 40 }}>
            {drive.provider_icon()}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle2" noWrap>
              {drive?.email?.split("@")[0] || drive.email || "Unknown"}
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
          <LinearProgress
            variant="determinate"
            value={Math.min(100, sdrivePercent)}
            color={isOverCap ? "error" : "primary"}
            sx={{ mt: 1, height: 6, borderRadius: 999 }}
          />
          {isOverCap ? (
            <Typography variant="caption" color="error" sx={{ mt: 0.75, display: "block" }}>
              Over configured limit by {formatBytes(stats.used - stats.allowed)}.
            </Typography>
          ) : null}
        </Box>
        <Button
          variant="outlined"
          color="error"
          sx={{ mt: 2 }}
          onClick={() => onDisconnect(drive)}
        >
          Log out drive
        </Button>
      </CardContent>
    </Card>
  );
}

export default function DrivesTab({
  primaryDrive,
  secondaryDrives,
  knownSecondaryAccounts,
  onChangeUsageLimit,
  onDisconnectSecondaryDrive,
  onForgetRememberedSecondaryDrive,
}: DrivesTabProps) {
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [reconnectingDriveKey, setReconnectingDriveKey] = useState<string | null>(
    null,
  );

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
  const secondaryUsagePercent = secondaryTotals.allowed
    ? (secondaryTotals.used / secondaryTotals.allowed) * 100
    : 0;
  const secondaryOverCap =
    secondaryTotals.allowed > 0 && secondaryTotals.used > secondaryTotals.allowed;
  const secondaryUnsignedAccounts = useMemo(() => {
    const connectedKeys = new Set(
      secondaryDrives.map((drive) => createDriveKey(drive.provider, drive.email)),
    );
    return knownSecondaryAccounts.filter(
      (account) =>
        !connectedKeys.has(createDriveKey(account.provider, account.email)),
    );
  }, [knownSecondaryAccounts, secondaryDrives]);

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
              ? "Add a secondary drive to increase available capacity."
              : secondaryOverCap
                ? `${formatBytes(secondaryTotals.used)} used vs ${formatBytes(secondaryTotals.allowed)} configured. Exceeds SDrive limit by ${formatBytes(secondaryTotals.used - secondaryTotals.allowed)}.`
                : `${formatBytes(secondaryTotals.used)} of ${formatBytes(secondaryTotals.allowed)} within configured SDrive limits.`}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, secondaryUsagePercent)}
            color={secondaryOverCap ? "error" : "primary"}
            sx={{ mt: 1.5, height: 10, borderRadius: 999 }}
          />
        </CardContent>
      </Card>

      {secondaryUnsignedAccounts.length > 0 ? (
        <Card variant="outlined" sx={{ borderRadius: 4 }}>
          <CardContent>
            <Typography variant="subtitle2">Remembered drives</Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              {secondaryUnsignedAccounts.map((account) => {
                const DriveImplementation = Drives[account.provider];
                return (
                  <Card key={createDriveKey(account.provider, account.email)} variant="outlined">
                    <CardContent sx={{ py: 1, px: 1.25 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ bgcolor: "transparent", width: 30, height: 30 }}>
                          {DriveImplementation
                            ? <DriveImplementation.provider_icon />
                            : "?"}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="subtitle2" noWrap>
                            {account.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Signed out
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={
                              reconnectingDriveKey ===
                              createDriveKey(account.provider, account.email)
                            }
                            onClick={() => {
                              const driveKey = createDriveKey(
                                account.provider,
                                account.email,
                              );
                              setReconnectingDriveKey(driveKey);
                              DriveImplementation?.oauth_redirect({
                                accountType: "secondary",
                                hint: account.email,
                              });
                            }}
                          >
                            {reconnectingDriveKey ===
                            createDriveKey(account.provider, account.email)
                              ? "..."
                              : "Sign in"}
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => onForgetRememberedSecondaryDrive(account)}
                          >
                            Forget
                          </Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          </CardContent>
        </Card>
      ) : null}

      <Stack spacing={1.5}>
        {secondaryDrives.map((drive) => (
          <SecondaryDriveCard
            key={createDriveKey(drive.provider, drive.email)}
            drive={drive}
            onChangeUsageLimit={onChangeUsageLimit}
            onDisconnect={onDisconnectSecondaryDrive}
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
                    accountType: "secondary"
                  });
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: "transparent" }}>
                    <DriveImplementation.provider_icon />
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
