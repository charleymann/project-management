# Red Kraken Creative - Story Prompts

A story prompt curation board for law firm content writers. Fetch legal news, turn headlines into writing prompts, and track stories through your editorial workflow.

## Features

- **Story Feed column** - Pulls story ideas from legal news RSS feeds (ABA Journal, Law.com, Above the Law) with one click
- **Editorial workflow** - Four columns: Story Feed, Shortlisted, Writing, Published
- **Curation** - Edit fetched prompts, add notes, adjust priority, and drag between columns
- **Source links** - Each fetched card links back to the original article
- **Google Sign-In** - Authenticate with Google; board data is scoped per user
- **Drag and drop** - Reorder and move cards between columns (powered by @dnd-kit)
- **Priority levels** - Low, medium, and high with color-coded indicators
- **Persistent storage** - Board state saves automatically to localStorage

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Authentication Setup

Create a `.env` file in the project root:

```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Get a client ID from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |

## Tech Stack

- [React](https://react.dev/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool
- [@dnd-kit](https://dndkit.com/) - Drag and drop
- [Google Identity Services](https://developers.google.com/identity/gsi/web) - Authentication
