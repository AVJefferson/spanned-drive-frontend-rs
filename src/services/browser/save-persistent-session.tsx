import { Session } from "../../contexts/Session.tsx";

export default function SavePersistentSession(session: Session) {
  const sessionToSave = {
    primaryDrive: {
      email: session?.primaryDrive?.email,
      provider: session?.primaryDrive?.provider,
    },
    secondaryDrives: session.secondaryDrives.map((sd) => ({
      email: sd.email,
      provider: sd.provider,
    })),
  };

  localStorage.setItem("session", JSON.stringify(sessionToSave));

  return session;
}

export { SavePersistentSession };
