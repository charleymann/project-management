import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { User } from "./types";

/**
 * To use Google Sign-In, create a project at https://console.cloud.google.com,
 * enable the Google Identity Services API, create an OAuth 2.0 Client ID,
 * and set your client ID in a .env file:
 *
 *   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
 */

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as
  | string
  | undefined;
const SESSION_KEY = "kanban-session";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  signOut: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

/** Decode the payload of a JWT without verification (verification is done by Google's library). */
function decodeJwtPayload(token: string): Record<string, unknown> {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(json);
}

function extractUser(credential: string): User | null {
  try {
    const payload = decodeJwtPayload(credential);

    // Validate required fields
    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string"
    ) {
      return null;
    }

    // Validate token expiry
    if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) {
      return null;
    }

    // Validate audience matches our client ID
    if (GOOGLE_CLIENT_ID && payload.aud !== GOOGLE_CLIENT_ID) {
      return null;
    }

    // Validate issuer
    if (
      payload.iss !== "accounts.google.com" &&
      payload.iss !== "https://accounts.google.com"
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email,
      name: (payload.name as string) ?? payload.email,
      picture: (payload.picture as string) ?? "",
    };
  } catch {
    return null;
  }
}

/** Persist session credential to sessionStorage (not localStorage, for security). */
function saveSession(credential: string) {
  sessionStorage.setItem(SESSION_KEY, credential);
}

function loadSession(): User | null {
  const credential = sessionStorage.getItem(SESSION_KEY);
  if (!credential) return null;
  const user = extractUser(credential);
  if (!user) {
    sessionStorage.removeItem(SESSION_KEY);
  }
  return user;
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

// Extend Window to include Google Identity Services types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: string;
              size?: string;
              text?: string;
              width?: number;
            }
          ) => void;
          revoke: (hint: string, callback: () => void) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleCredentialResponse = useCallback(
    (response: { credential: string }) => {
      const parsed = extractUser(response.credential);
      if (parsed) {
        saveSession(response.credential);
        setUser(parsed);
      }
    },
    []
  );

  useEffect(() => {
    // Try restoring session
    const restored = loadSession();
    if (restored) {
      setUser(restored);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    // Load the Google Identity Services script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: true,
      });

      // Render button into the placeholder if present
      const btnEl = document.getElementById("google-signin-btn");
      if (btnEl) {
        window.google?.accounts.id.renderButton(btnEl, {
          theme: "outline",
          size: "large",
          text: "signin_with",
          width: 300,
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [handleCredentialResponse]);

  const signOut = useCallback(() => {
    if (user && window.google) {
      window.google.accounts.id.revoke(user.email, () => {});
      window.google.accounts.id.disableAutoSelect();
    }
    clearSession();
    setUser(null);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export { GOOGLE_CLIENT_ID };
