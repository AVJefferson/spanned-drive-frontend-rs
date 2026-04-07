import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

export interface AccountData {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token: string;
  user?: any;
  acquired_at: number;
}

export interface Account {
  provider: string;
  email: string;
  data: AccountData;
}

export interface Session {
  primaryAccount: Account | null;
  secondaryAccounts: Account[];
  loggedIn: boolean;
}

interface SessionContextType {
  session: Session;
  setPrimaryAccount: (provider: string, email: string, data: any) => void;
  addSecondaryAccount: (provider: string, email: string, data: any) => void;
  removeAccount: (email: string) => void;
  logout: () => void;
  isExpired: (account: Account | null) => boolean;
}

const defaultSession: Session = {
  primaryAccount: null,
  secondaryAccounts: [],
  loggedIn: false,
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSessionState] = useState<Session>(defaultSession);

  useEffect(() => {
    // Load session from local storage on mount
    const storedSession = localStorage.getItem("session");
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        setSessionState(parsed);
      } catch (e) {
        console.error("Failed to parse session from local storage", e);
      }
    } else {
      // Migrate from old storage structure if it exists
      const oldPrimaryStr = localStorage.getItem("primary_account");
      const oldPrimaryProvider = localStorage.getItem(
        "primary_account_provider",
      );
      const oldPrimaryEmail = localStorage.getItem("primary_account_email");

      if (oldPrimaryStr && oldPrimaryProvider && oldPrimaryEmail) {
        try {
          const oldPrimary = JSON.parse(oldPrimaryStr);
          const newSession: Session = {
            primaryAccount: {
              provider: oldPrimaryProvider,
              email: oldPrimaryEmail,
              data: { ...oldPrimary, acquired_at: Date.now() },
            },
            secondaryAccounts: [], // Would need to parse Object.keys(localStorage) for secondaries in a real migration
            loggedIn: true,
          };
          setSessionState(newSession);
          localStorage.setItem("session", JSON.stringify(newSession));

          // Cleanup old keys
          localStorage.removeItem("primary_account");
          localStorage.removeItem("primary_account_provider");
          localStorage.removeItem("primary_account_email");
        } catch (e) {
          console.error("Failed to migrate old session", e);
        }
      }
    }
  }, []);

  const setPrimaryAccount = useCallback(
    (provider: string, email: string, data: any) => {
      setSessionState((prev) => {
        const newSession: Session = {
          ...prev,
          primaryAccount: {
            provider,
            email,
            data: { ...data, acquired_at: data.acquired_at || Date.now() },
          },
          loggedIn: true,
        };
        localStorage.setItem("session", JSON.stringify(newSession));
        return newSession;
      });
    },
    [],
  );

  const addSecondaryAccount = useCallback(
    (provider: string, email: string, data: any) => {
      setSessionState((prev) => {
        const existingIndex = prev.secondaryAccounts.findIndex(
          (a) => a.email === email && a.provider === provider,
        );
        const newSecondary = [...prev.secondaryAccounts];
        const newAccount = {
          provider,
          email,
          data: { ...data, acquired_at: data.acquired_at || Date.now() },
        };

        if (existingIndex >= 0) {
          newSecondary[existingIndex] = newAccount;
        } else {
          newSecondary.push(newAccount);
        }

        const newSession = {
          ...prev,
          secondaryAccounts: newSecondary,
        };
        localStorage.setItem("session", JSON.stringify(newSession));
        return newSession;
      });
    },
    [],
  );

  const removeAccount = useCallback((email: string) => {
    setSessionState((prev) => {
      if (prev.primaryAccount?.email === email) {
        localStorage.removeItem("session");
        return defaultSession;
      } else {
        const newSecondary = prev.secondaryAccounts.filter(
          (a) => a.email !== email,
        );
        const newSession = {
          ...prev,
          secondaryAccounts: newSecondary,
        };
        localStorage.setItem("session", JSON.stringify(newSession));
        return newSession;
      }
    });
  }, []);

  const logout = useCallback(() => {
    setSessionState(defaultSession);
    localStorage.removeItem("session");
  }, []);

  const isExpired = useCallback((account: Account | null) => {
    if (!account || !account.data || !account.data.expires_in) return true;
    const expiryTime =
      account.data.acquired_at + account.data.expires_in * 1000;
    return Date.now() > expiryTime - 60000; // 1 minute buffer
  }, []);

  return (
    <SessionContext.Provider
      value={{
        session,
        setPrimaryAccount,
        addSecondaryAccount,
        removeAccount,
        logout,
        isExpired,
      }}
    >
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
