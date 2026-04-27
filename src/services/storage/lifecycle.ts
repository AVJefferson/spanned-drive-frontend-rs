import { clearDriveRefreshSecrets } from "../../platform/secret-storage";
import { clearSessionScopedStorage, listStoredDriveReferences } from "./storage";

export function logoutFromLocalStorage() {
  const connectedDrives = listStoredDriveReferences();
  void clearDriveRefreshSecrets(connectedDrives);
  clearSessionScopedStorage();
  return true;
}

export function emptyLocalStorage() {
  localStorage.clear();
  sessionStorage.clear();
  return true;
}
