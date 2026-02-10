import { useState, useEffect, createContext, useContext, type ReactNode } from "react";

const TOKEN_KEY = "rk-token";
const USER_KEY = "rk-user";

export interface TeamMember {
  username: string;
  displayName: string;
  role: string;
}

interface AuthContextValue {
  user: TeamMember | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => "Not initialized",
  logout: () => {},
  isAdmin: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

// ---------------------------------------------------------------------------
// Token-based fetch helper (exported for use by other modules)
// ---------------------------------------------------------------------------
let currentToken: string | null = sessionStorage.getItem(TOKEN_KEY);

export function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    },
  });
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TeamMember | null>(() => {
    const stored = sessionStorage.getItem(USER_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!!currentToken);

  // On mount, validate token against server
  useEffect(() => {
    if (!currentToken) {
      setLoading(false);
      return;
    }
    authFetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(({ user: u }) => {
        setUser(u);
        sessionStorage.setItem(USER_KEY, JSON.stringify(u));
      })
      .catch(() => {
        // Token invalid — clear everything
        currentToken = null;
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (
    username: string,
    password: string
  ): Promise<string | null> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      return data.error || "Login failed.";
    }
    currentToken = data.token;
    sessionStorage.setItem(TOKEN_KEY, data.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    return null;
  };

  const logout = () => {
    if (currentToken) {
      authFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    }
    currentToken = null;
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin: user?.role === "Administrator",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
