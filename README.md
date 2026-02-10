# Red Kraken Creative - Story Prompts

A story prompt curation board for law firm content writers. Fetch legal news, turn headlines into writing prompts, and track stories through your editorial workflow.

## Features

- **Team login** - Username/password authentication with SHA-256 hashed passwords (accounts: admin, writer, editor)
- **Branded home page** - Red Kraken Creative landing page with navigation to the story board
- **Story Feed column** - Pulls story ideas from legal news RSS feeds (ABA Journal, Law.com, Above the Law) with one click
- **Editorial workflow** - Four columns: Story Feed, Shortlisted, Writing, Published
- **Curation** - Edit fetched prompts, add notes, adjust priority, and drag between columns
- **Source links** - Each fetched card links back to the original article
- **Drag and drop** - Reorder and move cards between columns (powered by @dnd-kit)
- **Priority levels** - Low, medium, and high with color-coded indicators
- **Persistent storage** - Board state saves automatically to localStorage

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Default Team Accounts

| Username | Password | Role |
|---|---|---|
| `admin` | `admin` | Administrator |
| `writer` | `writer` | Content Writer |
| `editor` | `editor` | Editor |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm start` | Serve the production build (used by Render) |
| `npm run preview` | Preview the production build locally via Vite |

## Deploying on Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure the service:

| Setting | Value |
|---|---|
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |

Render automatically provides the `PORT` environment variable. The `npm start` script uses `serve` to host the built static files with SPA fallback (`-s` flag) on the correct port.

## Tech Stack

- [React](https://react.dev/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool
- [@dnd-kit](https://dndkit.com/) - Drag and drop
- [serve](https://github.com/vercel/serve) - Static file server for production
