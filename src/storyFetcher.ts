import { Card } from "./types";

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

interface Rss2JsonResponse {
  status: string;
  items: RssItem[];
}

export interface SearchCriteria {
  topic: string;
  practiceArea: string;
  notes: string;
}

const LEGAL_RSS_FEEDS = [
  "https://feeds.abajournal.com/abajournal/topstories",
  "https://www.law.com/radar.rss",
  "https://abovethelaw.com/feed/",
];

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent?.trim() ?? "";
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "...";
}

function buildKeywords(criteria: SearchCriteria): string[] {
  const words: string[] = [];

  if (criteria.topic) {
    words.push(...criteria.topic.toLowerCase().split(/\s+/).filter(Boolean));
  }

  if (criteria.practiceArea && criteria.practiceArea !== "Any") {
    words.push(
      ...criteria.practiceArea
        .toLowerCase()
        .replace(/[/&]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );
  }

  if (criteria.notes) {
    words.push(
      ...criteria.notes
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );
  }

  return [...new Set(words)];
}

function scoreItem(item: RssItem, keywords: string[]): number {
  if (keywords.length === 0) return 1;

  const text = `${item.title} ${stripHtml(item.description)}`.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (text.includes(kw)) score++;
  }
  return score;
}

function buildPrompt(
  rawDesc: string,
  criteria: SearchCriteria
): string {
  let prompt = "";

  if (rawDesc) {
    prompt += `Inspired by: "${truncate(rawDesc, 200)}"\n\n`;
  }

  if (criteria.practiceArea && criteria.practiceArea !== "Any") {
    prompt += `Practice area: ${criteria.practiceArea}\n`;
  }
  if (criteria.topic) {
    prompt += `Focus: ${criteria.topic}\n`;
  }
  if (criteria.notes) {
    prompt += `Guidance: ${criteria.notes}\n`;
  }

  prompt += "\nStory angle for law firm content:";
  return prompt;
}

export async function fetchStoryIdeas(
  existingCards: Record<string, Card>,
  criteria: SearchCriteria
): Promise<Card[]> {
  const existingTitles = new Set(
    Object.values(existingCards).map((c) => c.title.toLowerCase())
  );

  const keywords = buildKeywords(criteria);

  // Fetch from all feeds in parallel and combine results
  const allItems: RssItem[] = [];

  const results = await Promise.allSettled(
    LEGAL_RSS_FEEDS.map(async (feed) => {
      const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed)}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data: Rss2JsonResponse = await res.json();
      if (data.status !== "ok" || !data.items?.length) return [];
      return data.items;
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      allItems.push(...result.value);
    }
  }

  if (allItems.length === 0) {
    throw new Error("No stories found. Try again in a moment.");
  }

  // Filter out duplicates against existing board cards
  const fresh = allItems.filter((item) => {
    const title = stripHtml(item.title);
    return title && !existingTitles.has(title.toLowerCase());
  });

  // Score and sort by relevance
  const scored = fresh
    .map((item) => ({ item, score: scoreItem(item, keywords) }))
    .sort((a, b) => b.score - a.score);

  // Take top 3
  const top = scored.slice(0, 3);

  if (top.length === 0) {
    throw new Error("No new stories matched your criteria. Try different keywords.");
  }

  return top.map(({ item }) => {
    const title = stripHtml(item.title);
    const rawDesc = stripHtml(item.description);
    const prompt = buildPrompt(rawDesc, criteria);

    let sourceName = "Legal News";
    try {
      sourceName = new URL(item.link).hostname.replace("www.", "");
    } catch {
      // keep default
    }

    return {
      id: `feed-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      description: prompt,
      priority: "medium" as const,
      sourceUrl: item.link,
      sourceName,
      createdAt: Date.now(),
    };
  });
}
