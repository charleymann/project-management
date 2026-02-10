export interface Card {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  sourceUrl?: string;
  sourceName?: string;
  createdAt: number;
}

export interface Column {
  id: string;
  title: string;
  cardIds: string[];
}

export interface Board {
  columns: Column[];
  cards: Record<string, Card>;
}

export interface User {
  sub: string;
  email: string;
  name: string;
  picture: string;
}
