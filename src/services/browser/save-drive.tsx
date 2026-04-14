import { Drive } from "../../contexts/Drive";

export function SaveDrive(drive: Drive) {
  localStorage.setItem(
    `drive-${drive.provider}-${drive.email}`,
    JSON.stringify(drive),
  );
}
