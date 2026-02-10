import { Card } from "./types";

export interface SearchCriteria {
  topic: string;
  practiceArea: string;
  notes: string;
}

interface AiPrompt {
  title: string;
  description: string;
}

export async function fetchStoryIdeas(
  existingCards: Record<string, Card>,
  criteria: SearchCriteria
): Promise<Card[]> {
  const res = await fetch("/api/generate-prompts", {
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

  const { prompts }: { prompts: AiPrompt[] } = await res.json();

  // Deduplicate against existing board cards
  const existingTitles = new Set(
    Object.values(existingCards).map((c) => c.title.toLowerCase())
  );

  return prompts
    .filter((p) => p.title && !existingTitles.has(p.title.toLowerCase()))
    .map((p) => ({
      id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: p.title,
      description: p.description,
      priority: "medium" as const,
      sourceName: "AI Generated",
      createdAt: Date.now(),
    }));
}
