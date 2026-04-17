import { clearSessionScopedStorage, listStoredDriveReferences } from "./storage";
import { clearDriveRefreshSecrets } from "../security/secret-storage";

export function LogoutFromLocalStorage() {
  const connectedDrives = listStoredDriveReferences();
  void clearDriveRefreshSecrets(connectedDrives);
  clearSessionScopedStorage();
  return true;
}
