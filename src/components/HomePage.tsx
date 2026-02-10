import { useAuth } from "../auth";

interface Props {
  onGoToBoard: () => void;
}

export default function HomePage({ onGoToBoard }: Props) {
  const { user, logout } = useAuth();

  return (
    <div className="home-page">
      <header className="app-header">
        <div className="brand">
          <h1>Red Kraken Creative</h1>
          <span className="brand-sub">Story Prompts for Law Firms</span>
        </div>
        <div className="user-info">
          <span className="user-name">
            {user?.displayName} &middot; {user?.role}
          </span>
          <button className="sign-out-btn" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="home-content">
        <div className="home-hero">
          <h2>Welcome back, {user?.displayName}</h2>
          <p>
            Find and curate compelling story ideas for your law firm clients.
            Fetch the latest legal news, shortlist the best angles, and track
            your writing through to publication.
          </p>
          <button className="home-cta" onClick={onGoToBoard}>
            Open Story Board
          </button>
        </div>

        <div className="home-cards">
          <div className="home-info-card">
            <h3>Fetch</h3>
            <p>
              Pull the latest legal headlines from ABA Journal, Law.com, and
              Above the Law directly into your Story Feed.
            </p>
          </div>
          <div className="home-info-card">
            <h3>Curate</h3>
            <p>
              Review story ideas, edit prompts, set priorities, and shortlist
              the strongest angles for your writers.
            </p>
          </div>
          <div className="home-info-card">
            <h3>Publish</h3>
            <p>
              Track each story from first draft through to publication. Keep
              your whole team on the same page.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
