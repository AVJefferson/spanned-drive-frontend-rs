import { Drives } from "../../contexts/Drive";

export function RetreiveDrive(provider: string, email: string = "") {
  if (!provider) return null;

  let driveString = localStorage.getItem(`drive-${provider}-${email}`);
  if (!driveString) return null;

  try {
    let drive = JSON.parse(driveString);

    let driveObject = new Drives[provider](drive);

    if (!driveObject) return null;

    return driveObject;
  } catch {
    return null;
  }
}
