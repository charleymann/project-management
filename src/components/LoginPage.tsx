import { useState, useRef } from "react";
import { useAuth } from "../auth";

interface Props {
  onSuccess: () => void;
}

export default function LoginPage({ onSuccess }: Props) {
  const { login, user } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (user) {
    setTimeout(onSuccess, 50);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setIsLoading(true);
    const err = await login(username, password);
    if (err) {
      setError(err);
    }
    setIsLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Red Kraken Creative</h1>
        <p>Sign in to access story prompts</p>
        <form ref={formRef} onSubmit={handleSubmit} className="login-form">
          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
              placeholder="Enter your username"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Enter your password"
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <button
          className="forgot-link"
          onClick={() => setShowForgot(!showForgot)}
        >
          Forgot your password?
        </button>
        {showForgot && (
          <p className="forgot-msg">
            Contact your administrator to have your password reset.
          </p>
        )}
      </div>
    </div>
  );
}
