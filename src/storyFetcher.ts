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

export async function fetchStoryIdeas(
  existingCards: Record<string, Card>
): Promise<Card[]> {
  const existingTitles = new Set(
    Object.values(existingCards).map((c) => c.title.toLowerCase())
  );

  const feed = LEGAL_RSS_FEEDS[Math.floor(Math.random() * LEGAL_RSS_FEEDS.length)];

  const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed)}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch stories (${res.status})`);
  }

  const data: Rss2JsonResponse = await res.json();
  if (data.status !== "ok" || !data.items?.length) {
    throw new Error("No stories found. Try again in a moment.");
  }

  const cards: Card[] = [];

  for (const item of data.items) {
    const title = stripHtml(item.title);
    if (!title || existingTitles.has(title.toLowerCase())) continue;

    const rawDesc = stripHtml(item.description);
    const prompt = rawDesc
      ? `Inspired by: "${truncate(rawDesc, 200)}"\n\nStory angle for law firm content:`
      : "Story angle for law firm content:";

    let sourceName = "Legal News";
    try {
      sourceName = new URL(item.link).hostname.replace("www.", "");
    } catch {
      // keep default
    }

    cards.push({
      id: `feed-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      description: prompt,
      priority: "medium",
      sourceUrl: item.link,
      sourceName,
      createdAt: Date.now(),
    });

    existingTitles.add(title.toLowerCase());
  }

  return cards;
}
