import type { Drive } from "../../contexts/Drive";
import type { LogicalFolder } from "../../contexts/LogicalFolderTypes";
import type { DriveCandidate, QuotaReservation } from "./types";

const DEFAULT_LIMIT_PERCENT = 85;
const HARD_SAFETY_CAP_PERCENT = 99;

const reservationsByDrive = new Map<string, number>();

export function getEffectiveLimitPercent(limitPercent: number) {
  const numeric = Number(limitPercent || DEFAULT_LIMIT_PERCENT);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return DEFAULT_LIMIT_PERCENT;
  }
  if (numeric >= 100) {
    return HARD_SAFETY_CAP_PERCENT;
  }
  return numeric;
}

export function buildDriveCandidates(
  logicalFolder: LogicalFolder,
  getDriveByKey: (driveKey: string) => Drive | undefined,
): DriveCandidate[] {
  return (logicalFolder.backends || [])
    .map((backend) => {
      const drive = getDriveByKey(backend.driveKey);
      if (!drive) {
        return null;
      }

      const totalSpace = Number(drive.drive_details.totalSpace || 0);
      const usedSpace = Number(drive.drive_details.usedSpace || 0);
      const limitPercent = getEffectiveLimitPercent(
        Number(
          drive.drive_settings.usageLimitPercent ??
            drive.drive_settings.allowed_space_usage_percent ??
            backend.usageLimitPercent ??
            DEFAULT_LIMIT_PERCENT,
        ),
      );
      const effectiveLimitBytes = (totalSpace * limitPercent) / 100;
      const reserved = reservationsByDrive.get(backend.driveKey) || 0;
      const availableBytes = Math.max(effectiveLimitBytes - usedSpace - reserved, 0);

      return {
        backendId: backend.backendId,
        driveKey: backend.driveKey,
        drive,
        limitPercent,
        totalSpace,
        usedSpace,
        effectiveLimitBytes,
        availableBytes,
      } satisfies DriveCandidate;
    })
    .filter(Boolean) as DriveCandidate[];
}

export function reserveDriveBytes(
  driveKey: string,
  bytes: number,
  candidates: DriveCandidate[],
): QuotaReservation | null {
  const candidate = candidates.find((item) => item.driveKey === driveKey);
  if (!candidate || candidate.availableBytes < bytes) {
    return null;
  }

  reservationsByDrive.set(driveKey, (reservationsByDrive.get(driveKey) || 0) + bytes);

  return {
    driveKey,
    bytes,
    release: () => {
      const current = reservationsByDrive.get(driveKey) || 0;
      const next = Math.max(current - bytes, 0);
      if (next === 0) {
        reservationsByDrive.delete(driveKey);
      } else {
        reservationsByDrive.set(driveKey, next);
      }
    },
  };
}
