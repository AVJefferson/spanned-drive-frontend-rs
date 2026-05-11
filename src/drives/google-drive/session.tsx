import { GoogleDrive } from ".";
import tauriInvokeWithSdriveBackendFallback from "./client";
import { Session } from "../../contexts/session-context";

export async function getSession(
  this: GoogleDrive,
): Promise<Session | undefined> {
  const accessToken = await this.getAccessToken?.();
  if (!accessToken) throw new Error("No access token");

  try {
    return await tauriInvokeWithSdriveBackendFallback<Session>(
      "get_session",
      { access_token: accessToken },
      `/drive/${GoogleDrive.provider}/get_session`,
    );
  } catch {
    console.error("Error getting logical folders");
  }
}

export async function createSession(this: GoogleDrive, session: Session) {
  const accessToken = await this.getAccessToken?.();
  if (!accessToken) throw new Error("No access token");

  try {
    return await tauriInvokeWithSdriveBackendFallback<Session>(
      "create_session",
      { access_token: accessToken, session },
      `/drive/${GoogleDrive.provider}/create_session`,
    );
  } catch {
    console.error("Error creating session");
    return;
  }
}

export async function updateSession(this: GoogleDrive, session: Session) {
  const accessToken = await this.getAccessToken?.();
  if (!accessToken) throw new Error("No access token");

  try {
    return await tauriInvokeWithSdriveBackendFallback<Session>(
      "update_session",
      { access_token: accessToken, session },
      `/drive/${GoogleDrive.provider}/update_session`,
    );
  } catch {
    console.error("Error updating session");
    return;
  }
}

const session = {
  getSession,
  createSession,
  updateSession,
};
export default session;
