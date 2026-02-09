import { useEffect } from "react";
import { GOOGLE_CLIENT_ID } from "../AuthContext";

export default function LoginPage() {
  useEffect(() => {
    // Re-render the Google button once this component mounts
    const btnEl = document.getElementById("google-signin-btn");
    if (btnEl && window.google && GOOGLE_CLIENT_ID) {
      window.google.accounts.id.renderButton(btnEl, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        width: 300,
      });
    }
  }, []);

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Kanban Board</h1>
        <p>Sign in to manage your projects</p>
        {GOOGLE_CLIENT_ID ? (
          <div id="google-signin-btn" className="google-btn-container" />
        ) : (
          <div className="login-dev-notice">
            <p>
              <strong>Google Sign-In not configured.</strong>
            </p>
            <p>
              To enable authentication, create a{" "}
              <code>.env</code> file in the project root with:
            </p>
            <pre>VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com</pre>
            <p className="login-dev-hint">
              Get a client ID from the{" "}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Cloud Console
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
