import type { Drive } from "../../contexts/Drive";

const extractLocalData = (drive: Drive | null) => {
  if (!drive) {
    return null;
  }

  return {
    provider: drive.provider,
    email: drive.email,
    refresh_token: drive.refresh_token,
    scope: drive.scope,
    user: drive.user,
    drive_settings: drive.drive_settings,
    drive_details: drive.drive_details,
  };
};

const extractSessionData = (drive: Drive | null) => {
  if (!drive) {
    return null;
  }

  return {
    provider: drive.provider,
    email: drive.email,
    access_token: drive.access_token,
    expires_in: drive.expires_in,
    acquired_at: drive.acquired_at,
    user: drive.user,
    drive_settings: drive.drive_settings,
    drive_details: drive.drive_details,
  };
};

export { extractLocalData, extractSessionData };
