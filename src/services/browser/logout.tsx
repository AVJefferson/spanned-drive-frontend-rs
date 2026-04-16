export function LogoutFromLocalStorage() {
  sessionStorage.clear();
  const sessionString = localStorage.getItem("session");

  if (!sessionString) {
    localStorage.clear();
    return true;
  }

  try {
    let session = JSON.parse(sessionString);

    localStorage.clear();
    if (!session.primaryDrive) return true;

    localStorage.setItem("pri_email", session.primaryDrive.email);
    localStorage.setItem("pri_provider", session.primaryDrive.provider);
  } catch {
    localStorage.clear();
    return false;
  }

  return true;
}
