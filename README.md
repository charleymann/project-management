# Red Kraken Creative - Story Prompts

A story prompt curation board for law firm content writers. Uses AI to generate tailored story ideas based on your topic, practice area, and guidance — then lets you curate them through an editorial workflow.

## Features

- **AI-powered story ideas** - Uses OpenAI (GPT-4o-mini) to generate 3 targeted prompts per search based on topic, practice area, and writer guidance
- **Suggestion review** - Preview AI-generated prompts and select which ones to add to your board
- **Team login** - Username/password authentication with SHA-256 hashed passwords (accounts: admin, writer, editor)
- **Branded home page** - Red Kraken Creative landing page with navigation to the story board
- **Editorial workflow** - Four columns: Story Feed, Shortlisted, Writing, Published
- **Curation** - Edit prompts, add notes, adjust priority, and drag between columns
- **Drag and drop** - Reorder and move cards between columns (powered by @dnd-kit)
- **Priority levels** - Low, medium, and high with color-coded indicators
- **Persistent storage** - Board state saves automatically to localStorage

## Getting Started

```bash
npm install
```

For local development, start both the API server and the Vite dev server:

```bash
# Terminal 1 — API server (needs your OpenAI key)
OPENAI_API_KEY=sk-your-key-here npm start

# Terminal 2 — Vite dev server (proxies /api to the Express server)
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
| `npm run dev` | Start Vite dev server (with API proxy to port 3000) |
| `npm run build` | Type-check and build for production |
| `npm start` | Start the Express server (serves app + API) |
| `npm run preview` | Preview the production build locally via Vite |

## Deploying on Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure the service:

| Setting | Value |
|---|---|
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |

4. Add your API key in Render's **Environment** settings:

| Variable | Value |
|---|---|
| `OPENAI_API_KEY` | Your OpenAI API key (starts with `sk-`) |

Render automatically provides the `PORT` environment variable. The Express server serves both the built static files and the `/api/generate-prompts` endpoint.

## Tech Stack

- [React](https://react.dev/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool
- [Express](https://expressjs.com/) - API server
- [OpenAI](https://platform.openai.com/) - AI prompt generation (GPT-4o-mini)
- [@dnd-kit](https://dndkit.com/) - Drag and drop
