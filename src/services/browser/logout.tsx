import { clearSessionScopedStorage } from "./storage";

export function LogoutFromLocalStorage() {
  clearSessionScopedStorage();
  return true;
}
