import { Card } from "./types";
import { authFetch } from "./auth";

export interface SearchCriteria {
  topic: string;
  practiceArea: string;
  notes: string;
}

interface ResearchedStory {
  title: string;
  url: string;
  source: string;
  summary: string;
}

export async function fetchStoryIdeas(
  existingCards: Record<string, Card>,
  criteria: SearchCriteria
): Promise<Card[]> {
  const res = await authFetch("/api/research-stories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(criteria),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(
      data?.error || `Server error (${res.status}). Please try again.`
    );
  }

  const { stories }: { stories: ResearchedStory[] } = await res.json();

  const existingTitles = new Set(
    Object.values(existingCards).map((c) => c.title.toLowerCase())
  );

  return stories
    .filter((s) => s.title && !existingTitles.has(s.title.toLowerCase()))
    .map((s) => ({
      id: `news-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: s.title,
      description: s.summary,
      priority: "medium" as const,
      sourceUrl: s.url,
      sourceName: s.source || "News",
      createdAt: Date.now(),
    }));
}
