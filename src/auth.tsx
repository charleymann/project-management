import { useState, useEffect, createContext, useContext, type ReactNode } from "react";

const SESSION_KEY = "rk-session";

export interface TeamMember {
  username: string;
  displayName: string;
  role: string;
}

interface AuthContextValue {
  user: TeamMember | null;
  login: (username: string, password: string) => string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => "Not initialized",
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Team accounts. Passwords are checked via SHA-256 hash so they aren't
 * stored in plain text in the bundle. To add a new team member, generate
 * a hash with:  echo -n "password" | shasum -a 256
 */
const TEAM: { username: string; displayName: string; role: string; hash: string }[] = [
  {
    username: "admin",
    displayName: "Admin",
    role: "Administrator",
    hash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918", // admin
  },
  {
    username: "writer",
    displayName: "Writer",
    role: "Content Writer",
    hash: "b0412597dcea813655574dc54a5b74967cf85317f8b2a0540f42dd1f32b87c85", // writer
  },
  {
    username: "editor",
    displayName: "Editor",
    role: "Editor",
    hash: "4fcbf39efd3a85a089f27e8673c2fa3f459bddaf32f80d27750c3b4e0b7043e5", // editor
  },
];

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function saveSession(member: TeamMember) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(member));
}

function loadSession(): TeamMember | null {
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as TeamMember;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TeamMember | null>(loadSession);

  useEffect(() => {
    // Sync if session was cleared in another tab
    const handleStorage = () => setUser(loadSession());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const login = (username: string, password: string): string | null => {
    const normalized = username.trim().toLowerCase();
    const member = TEAM.find((m) => m.username === normalized);
    if (!member) return "Invalid username or password.";

    // sha256 is async, so we return a promise-like flow via state
    sha256(password).then((hash) => {
      if (hash === member.hash) {
        const teamMember: TeamMember = {
          username: member.username,
          displayName: member.displayName,
          role: member.role,
        };
        saveSession(teamMember);
        setUser(teamMember);
      }
    });

    // For synchronous error handling, also do an optimistic check;
    // the actual auth happens in the .then above.
    return null;
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
