import type { DriveUser } from "../../contexts/Drive";

export function decodeGoogleIdToken(token: string): DriveUser & {
  email?: string;
} | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(base64));
  } catch (error) {
    console.error("Invalid Google ID token", error);
    return null;
  }
}
