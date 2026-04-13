import { Drives } from "../../contexts/Drive";

export default function RetreiveDrive(provider: string, email: string) {
  let driveString = localStorage.getItem(`drive-${provider}-${email}`);
  if (!driveString) return null;

  try {
    let drive = JSON.parse(driveString);
    return new Drives[provider](drive);
  } catch {
    return null;
  }
}
