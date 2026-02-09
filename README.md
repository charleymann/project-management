# Project Management - Kanban Board

A lightweight Kanban board built with React, TypeScript, and Vite. Drag and drop cards between columns to track project tasks.

## Features

- **Kanban columns** - To Do, In Progress, and Done
- **Drag and drop** - Move cards between columns or reorder within a column (powered by @dnd-kit)
- **Card management** - Create, edit, and delete task cards
- **Priority levels** - Low, medium, and high with color-coded indicators
- **Persistent storage** - Board state saves automatically to localStorage

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

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
