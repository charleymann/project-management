import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import OpenAI from "openai";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve the built Vite app
app.use(express.static(join(__dirname, "dist")));

// AI prompt generation endpoint
app.post("/api/generate-prompts", async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not configured." });
  }

  const { topic, practiceArea, notes } = req.body;

  const openai = new OpenAI({ apiKey });

  let userMessage = "Generate exactly 3 unique, compelling story prompt ideas for a law firm content writer.\n\n";

  if (topic) userMessage += `Topic/keyword focus: ${topic}\n`;
  if (practiceArea && practiceArea !== "Any")
    userMessage += `Practice area: ${practiceArea}\n`;
  if (notes) userMessage += `Additional guidance: ${notes}\n`;

  userMessage += `
Each prompt should be a specific, actionable story idea that a content writer could turn into a blog post, article, or thought-leadership piece for a law firm audience.

Respond with a JSON array of exactly 3 objects. Each object must have:
- "title": a concise headline (under 80 characters)
- "description": 2-3 sentences describing the story angle, audience, and key points to cover

Respond ONLY with the JSON array, no other text.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert legal content strategist who helps law firm marketing teams find timely, engaging story ideas. You produce practical, specific prompts grounded in current legal trends.",
        },
        { role: "user", content: userMessage },
      ],
      temperature: 0.9,
      max_tokens: 1024,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "[]";

    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

    const prompts = JSON.parse(cleaned);

    if (!Array.isArray(prompts) || prompts.length === 0) {
      return res
        .status(500)
        .json({ error: "AI returned an unexpected format. Please try again." });
    }

    res.json({ prompts });
  } catch (err) {
    console.error("OpenAI API error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to generate prompts.";
    res.status(500).json({ error: message });
  }
});

// SPA fallback — serve index.html for any unmatched route
app.get("*", (_req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
