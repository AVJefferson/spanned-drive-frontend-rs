import { Drive } from "../../contexts/Drive";

export default function saveDrive(drive: Drive) {
  localStorage.setItem(
    `drive-${drive.provider}-${drive.email}`,
    JSON.stringify(drive),
  );
}
