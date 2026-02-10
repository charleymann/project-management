import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createHash, randomBytes } from "crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import OpenAI from "openai";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(join(__dirname, "dist")));

// ---------------------------------------------------------------------------
// User storage (JSON file – persists across restarts but resets on redeploy)
// ---------------------------------------------------------------------------
const DATA_DIR = join(__dirname, "data");
const USERS_FILE = join(DATA_DIR, "users.json");

function sha256(str) {
  return createHash("sha256").update(str).digest("hex");
}

function loadUsers() {
  try {
    return JSON.parse(readFileSync(USERS_FILE, "utf-8"));
  } catch {
    return null;
  }
}

function saveUsers(list) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(USERS_FILE, JSON.stringify(list, null, 2));
}

function initUsers() {
  let list = loadUsers();
  if (!list) {
    list = [
      {
        username: "admin",
        displayName: "Admin",
        role: "Administrator",
        passwordHash: sha256("admin"),
      },
      {
        username: "writer",
        displayName: "Writer",
        role: "Content Writer",
        passwordHash: sha256("writer"),
      },
      {
        username: "editor",
        displayName: "Editor",
        role: "Editor",
        passwordHash: sha256("editor"),
      },
    ];
    saveUsers(list);
  }
  return list;
}

let users = initUsers();

// ---------------------------------------------------------------------------
// Session management (in-memory – sessions clear on server restart)
// ---------------------------------------------------------------------------
const sessions = new Map();

function createSession(user) {
  const token = randomBytes(32).toString("hex");
  sessions.set(token, {
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  });
  return token;
}

// ---------------------------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------------------------
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authenticated." });
  }
  const token = header.slice(7);
  const session = sessions.get(token);
  if (!session) {
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }
  req.user = session;
  req.token = token;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "Administrator") {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
}

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }
  const normalized = username.trim().toLowerCase();
  const user = users.find((u) => u.username === normalized);
  if (!user || sha256(password) !== user.passwordHash) {
    return res.status(401).json({ error: "Invalid username or password." });
  }
  const token = createSession(user);
  res.json({
    token,
    user: {
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    },
  });
});

app.post("/api/auth/logout", requireAuth, (req, res) => {
  sessions.delete(req.token);
  res.json({ ok: true });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// ---------------------------------------------------------------------------
// User management (admin only)
// ---------------------------------------------------------------------------
app.get("/api/users", requireAuth, requireAdmin, (_req, res) => {
  res.json({
    users: users.map((u) => ({
      username: u.username,
      displayName: u.displayName,
      role: u.role,
    })),
  });
});

app.post("/api/users", requireAuth, requireAdmin, (req, res) => {
  const { username, displayName, password, role } = req.body;
  if (!username || !displayName || !password || !role) {
    return res.status(400).json({ error: "All fields are required." });
  }
  const normalized = username.trim().toLowerCase();
  if (users.find((u) => u.username === normalized)) {
    return res.status(409).json({ error: "Username already exists." });
  }
  const validRoles = ["Administrator", "Content Writer", "Editor"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role." });
  }
  const newUser = {
    username: normalized,
    displayName: displayName.trim(),
    role,
    passwordHash: sha256(password),
  };
  users.push(newUser);
  saveUsers(users);
  res.json({
    user: {
      username: newUser.username,
      displayName: newUser.displayName,
      role: newUser.role,
    },
  });
});

app.delete("/api/users/:username", requireAuth, requireAdmin, (req, res) => {
  const target = req.params.username;
  if (target === req.user.username) {
    return res.status(400).json({ error: "You cannot delete your own account." });
  }
  const index = users.findIndex((u) => u.username === target);
  if (index === -1) {
    return res.status(404).json({ error: "User not found." });
  }
  users.splice(index, 1);
  saveUsers(users);
  for (const [tok, sess] of sessions.entries()) {
    if (sess.username === target) sessions.delete(tok);
  }
  res.json({ ok: true });
});

app.post(
  "/api/users/:username/reset-password",
  requireAuth,
  requireAdmin,
  (req, res) => {
    const target = req.params.username;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 3) {
      return res
        .status(400)
        .json({ error: "Password must be at least 3 characters." });
    }
    const user = users.find((u) => u.username === target);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    user.passwordHash = sha256(newPassword);
    saveUsers(users);
    res.json({ ok: true });
  }
);

// ---------------------------------------------------------------------------
// Story research: Google News RSS → OpenAI curation
// ---------------------------------------------------------------------------
const MASTER_CONCEPT = `You are the research assistant for Red Kraken Creative, a content agency that helps law firms produce email newsletters for their client lists and referral sources.

Your job is to evaluate real news articles and select the ones that would work best as the basis for a law firm's email newsletter content. The ideal stories:
- Cover legal developments, regulatory changes, court decisions, or business news that affects a law firm's clients
- Can be rewritten into a 300-500 word article that demonstrates the firm's expertise
- Are timely and relevant — something a client or referral source would actually want to read
- Work for a professional audience (business owners, in-house counsel, other attorneys, or the general public receiving legal updates)
- Avoid overly sensational, crime-focused, or tabloid-style stories unless they have genuine legal significance`;

function extractTag(xml, tag) {
  const regex = new RegExp(
    `<${tag}[^>]*>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*<\\/${tag}>`
  );
  const m = xml.match(regex);
  if (!m) return "";
  return m[1]
    .trim()
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, "");
}

async function searchGoogleNews(query) {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
    query
  )}&hl=en-US&gl=US&ceid=US:en`;
  const response = await fetch(rssUrl);
  if (!response.ok) throw new Error("Failed to fetch news feed.");
  const xml = await response.text();

  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRegex.exec(xml)) !== null) {
    const block = m[1];
    const title = extractTag(block, "title");
    const linkMatch = block.match(/<link\s*\/?>\s*(https?:\/\/[^\s<]+)/);
    const link = linkMatch ? linkMatch[1].trim() : "";
    const pubDate = extractTag(block, "pubDate");
    const sourceMatch = block.match(/<source[^>]*>([\s\S]*?)<\/source>/);
    const source = sourceMatch
      ? sourceMatch[1].trim().replace(/<!\[CDATA\[|\]\]>/g, "")
      : "";

    if (title && link) {
      items.push({ title, link, pubDate, source });
    }
  }
  return items;
}

app.post("/api/research-stories", requireAuth, async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not configured." });
  }

  const { topic, practiceArea, notes } = req.body;

  let query = "";
  if (topic) query += topic + " ";
  if (practiceArea && practiceArea !== "Any") query += practiceArea + " ";
  query += "law legal";

  try {
    const newsItems = await searchGoogleNews(query);

    if (newsItems.length === 0) {
      return res
        .status(404)
        .json({ error: "No news articles found. Try different keywords." });
    }

    const top10 = newsItems.slice(0, 10);

    const articlesBlock = top10
      .map(
        (item, i) =>
          `[${i + 1}] "${item.title}"\n    URL: ${item.link}\n    Source: ${item.source}\n    Date: ${item.pubDate}`
      )
      .join("\n\n");

    let userMessage = `Here are real news articles from a recent search:\n\n${articlesBlock}\n\n`;
    userMessage += `Select the 3 best articles for a law firm email newsletter.`;
    if (practiceArea && practiceArea !== "Any") {
      userMessage += ` The firm's practice area focus is: ${practiceArea}.`;
    }
    if (notes) {
      userMessage += ` Additional guidance from the writer: ${notes}`;
    }
    userMessage += `\n\nFor each selected article, respond with a JSON array of exactly 3 objects:
- "title": the original article headline (do NOT modify it)
- "url": the original article URL (MUST be copied exactly from above)
- "source": the publication name
- "summary": 2-3 sentences explaining why this article is a good basis for a law firm newsletter piece and the angle a writer should take

Respond ONLY with the JSON array, no other text.`;

    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: MASTER_CONCEPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.4,
      max_tokens: 1200,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "[]";
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");

    const stories = JSON.parse(cleaned);

    if (!Array.isArray(stories) || stories.length === 0) {
      return res
        .status(500)
        .json({ error: "Could not evaluate articles. Please try again." });
    }

    res.json({ stories });
  } catch (err) {
    console.error("Research error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to research stories.";
    res.status(500).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// SPA fallback
// ---------------------------------------------------------------------------
app.get("/{*path}", (_req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
