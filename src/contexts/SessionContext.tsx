import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Session {
  loggedIn: boolean;
  isExpired: () => boolean;
  [key: string]: any;
}

interface SessionContextType {
  session: Session | null;
  setSession: (session: Session | null) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSessionState] = useState<Session | null>(null);

  useEffect(() => {
    const storedSession = localStorage.getItem("session");
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        // Reconstruct the isExpired method since it's lost during JSON serialization
        parsed.isExpired = () => false; // Adjust this logic as needed for your app
        setSessionState(parsed);
      } catch (e) {
        // TODO: Handle JSON parsing error if needed
      }
    }
  }, []);

  const setSession = (newSession: Session | null) => {
    setSessionState(newSession);
    if (newSession) {
      // Remove the function before serializing
      const { isExpired, ...dataToStore } = newSession;
      localStorage.setItem("session", JSON.stringify(dataToStore));
    } else {
      localStorage.removeItem("session");
    }
  };

  return (
    <SessionContext.Provider value={{ session, setSession }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
