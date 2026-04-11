import { Drive } from "../../contexts/Drive.tsx";

const extractLocalData = (drive: Drive | null) => {
  if (!drive) return null;
  return {
    provider: drive.provider,
    email: drive.email,

    isPrimary: drive.isPrimary,
    isSecondary: drive.isSecondary,

    parent_drive: drive.parent_drive,
    associated_drives: drive.associated_drives,

    refresh_token: drive.refresh_token,
    scope: drive.scope,

    user: drive.user,

    drive_settings: drive.drive_settings,
  };
};

const extractSessionData = (drive: Drive | null) => {
  if (!drive) return null;
  return {
    provider: drive.provider,
    email: drive.email,

    isPrimary: drive.isPrimary,
    isSecondary: drive.isSecondary,

    parent_drive: drive.parent_drive,
    associated_drives: drive.associated_drives,

    access_token: drive.access_token,
    expires_in: drive.expires_in,
    acquired_at: drive.acquired_at,

    total_space: drive.total_space,
    used_space: drive.used_space,

    user: drive.user,
    drive_settings: drive.drive_settings,
  };
};

export { extractLocalData, extractSessionData };
