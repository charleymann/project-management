import { Board } from "./types";

function storageKey(userId: string): string {
  return `kanban-board-${userId}`;
}

export function loadBoard(userId: string): Board {
  const stored = localStorage.getItem(storageKey(userId));
  if (stored) {
    return JSON.parse(stored) as Board;
  }
  return getDefaultBoard();
}

export function saveBoard(userId: string, board: Board): void {
  localStorage.setItem(storageKey(userId), JSON.stringify(board));
}

function getDefaultBoard(): Board {
  return {
    columns: [
      { id: "todo", title: "To Do", cardIds: ["card-1", "card-2"] },
      { id: "in-progress", title: "In Progress", cardIds: ["card-3"] },
      { id: "done", title: "Done", cardIds: [] },
    ],
    cards: {
      "card-1": {
        id: "card-1",
        title: "Set up project structure",
        description: "Initialize the repository and add build tooling.",
        priority: "high",
        createdAt: Date.now(),
      },
      "card-2": {
        id: "card-2",
        title: "Design database schema",
        description: "Define tables for users, projects, and tasks.",
        priority: "medium",
        createdAt: Date.now(),
      },
      "card-3": {
        id: "card-3",
        title: "Create landing page",
        description: "Build the initial landing page with hero section.",
        priority: "low",
        createdAt: Date.now(),
      },
    },
  };
}
