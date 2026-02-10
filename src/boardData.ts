import { Board } from "./types";

const STORAGE_KEY = "rk-storyboard";

export function loadBoard(): Board {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored) as Board;
  }
  return getDefaultBoard();
}

export function saveBoard(board: Board): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
}

function getDefaultBoard(): Board {
  return {
    columns: [
      { id: "story-feed", title: "Story Feed", cardIds: ["card-1", "card-2"] },
      { id: "shortlisted", title: "Shortlisted", cardIds: ["card-3"] },
      { id: "writing", title: "Writing", cardIds: [] },
      { id: "published", title: "Published", cardIds: [] },
    ],
    cards: {
      "card-1": {
        id: "card-1",
        title: "Landmark ruling reshapes corporate liability standards",
        description:
          'Inspired by: "A recent appeals court decision broadens the scope of director liability in negligence claims."\n\nStory angle for law firm content:',
        priority: "high",
        sourceName: "abajournal.com",
        createdAt: Date.now(),
      },
      "card-2": {
        id: "card-2",
        title: "Small businesses face new compliance hurdles in 2026",
        description:
          'Inspired by: "Updated federal regulations require small businesses to overhaul their data handling practices by Q3."\n\nStory angle for law firm content:',
        priority: "medium",
        sourceName: "law.com",
        createdAt: Date.now(),
      },
      "card-3": {
        id: "card-3",
        title: "How family law firms are adopting mediation-first strategies",
        description:
          "A growing number of family law practices are leading with mediation to reduce court backlogs and improve client outcomes. Great angle for a client-facing blog post.",
        priority: "low",
        createdAt: Date.now(),
      },
    },
  };
}
