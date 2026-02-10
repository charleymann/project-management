import { useState, useEffect } from "react";
import { authFetch } from "../auth";

interface User {
  username: string;
  displayName: string;
  role: string;
}

interface Props {
  onBack: () => void;
}

const ROLES = ["Administrator", "Content Writer", "Editor"];

export default function AdminPanel({ onBack }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add user form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("Content Writer");

  // Reset password
  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  const fetchUsers = async () => {
    const res = await authFetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    const res = await authFetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: newUsername,
        displayName: newDisplayName,
        password: newPassword,
        role: newRole,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setSuccess(`User "${newUsername}" created.`);
    setShowAddForm(false);
    setNewUsername("");
    setNewDisplayName("");
    setNewPassword("");
    setNewRole("Content Writer");
    fetchUsers();
  };

  const handleDelete = async (username: string) => {
    clearMessages();
    const res = await authFetch(`/api/users/${encodeURIComponent(username)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setSuccess(`User "${username}" deleted.`);
    fetchUsers();
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    clearMessages();
    const res = await authFetch(
      `/api/users/${encodeURIComponent(resetTarget)}/reset-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: resetPassword }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setSuccess(`Password reset for "${resetTarget}".`);
    setResetTarget(null);
    setResetPassword("");
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>Manage Users</h2>
        <button className="nav-btn admin-back-btn" onClick={onBack}>
          Back to Board
        </button>
      </div>

      {error && <p className="admin-msg admin-error">{error}</p>}
      {success && <p className="admin-msg admin-success">{success}</p>}

      <div className="admin-actions">
        <button
          className="admin-add-btn"
          onClick={() => {
            setShowAddForm(!showAddForm);
            clearMessages();
          }}
        >
          {showAddForm ? "Cancel" : "+ Add User"}
        </button>
      </div>

      {showAddForm && (
        <form className="admin-form" onSubmit={handleAddUser}>
          <label>
            Username
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
              placeholder="e.g. jsmith"
            />
          </label>
          <label>
            Display Name
            <input
              type="text"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              required
              placeholder="e.g. Jane Smith"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={3}
              placeholder="Min. 3 characters"
            />
          </label>
          <label>
            Role
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="save-btn">
            Create User
          </button>
        </form>
      )}

      {resetTarget && (
        <form className="admin-form" onSubmit={handleResetPassword}>
          <h4>Reset password for "{resetTarget}"</h4>
          <label>
            New Password
            <input
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              required
              minLength={3}
              autoFocus
              placeholder="Min. 3 characters"
            />
          </label>
          <div className="admin-form-actions">
            <button
              type="button"
              onClick={() => {
                setResetTarget(null);
                setResetPassword("");
              }}
            >
              Cancel
            </button>
            <button type="submit" className="save-btn">
              Reset Password
            </button>
          </div>
        </form>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Display Name</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.username}>
              <td>{u.username}</td>
              <td>{u.displayName}</td>
              <td>{u.role}</td>
              <td className="admin-row-actions">
                <button
                  className="admin-action-btn"
                  onClick={() => {
                    setResetTarget(u.username);
                    setResetPassword("");
                    clearMessages();
                  }}
                >
                  Reset Password
                </button>
                <button
                  className="admin-action-btn admin-delete-btn"
                  onClick={() => handleDelete(u.username)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
