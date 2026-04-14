import { Drives } from "../../contexts/Drive";

export function RetreiveDrive(provider: string, email: string = "") {
  if (!provider) return null;

  let driveString = localStorage.getItem(`drive-${provider}-${email}`);
  if (!driveString) return null;

  try {
    let drive = JSON.parse(driveString);
    return new Drives[provider](drive);
  } catch {
    return null;
  }
}
