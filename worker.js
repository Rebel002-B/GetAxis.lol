// Cloudflare Worker: handles /api/chat (Groq proxy). Everything else is served as static assets.
// Secrets/vars: GROQ_API_KEY (secret, required), GROQ_MODEL (optional var).

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const KEY_HASH = "c0088e7d2f093796be1dc9ba0903987c303748937541b9b94520f357df449363"; // SHA-256 of the access key
const SYSTEM_PROMPT = "You are Axis, a friendly, concise assistant. Keep answers short unless asked for detail.";
const MAX_MESSAGES = 30;
const MAX_CHARS = 6000;
const MAX_BODY = 100000;
const RATE_LIMIT = 20;     // requests
const RATE_WINDOW = 60000; // per minute, per visitor (best-effort, per Worker instance)

const hits = new Map();

function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT;
}

async function handleChat(request, env) {
  if (request.method !== "POST") return json(405, { error: "Method not allowed." });

  if ((await sha256Hex(request.headers.get("X-Axis-Key") || "")) !== KEY_HASH) {
    return json(401, { error: "Not verified. Go back and enter the key again." });
  }
  if (limited(request.headers.get("CF-Connecting-IP") || "unknown")) {
    return json(429, { error: "Slow down a little and try again in a minute." });
  }
  if (!env.GROQ_API_KEY) return json(500, { error: "GROQ_API_KEY is not set on the Worker." });

  let messages;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY) throw new Error("too big");
    messages = JSON.parse(raw).messages
      .slice(-MAX_MESSAGES)
      .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
    if (!messages.length) throw new Error("empty");
  } catch {
    return json(400, { error: "Bad request." });
  }

  let res;
  try {
    res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: "Bearer " + env.GROQ_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });
  } catch {
    return json(502, { error: "Could not reach Groq." });
  }

  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    return json(502, { error: "Groq error " + res.status + ". " + ((data && data.error && data.error.message) || "") });
  }
  return json(200, { reply: data.choices[0].message.content });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/chat") return handleChat(request, env);
    return env.ASSETS.fetch(request);
  },
};
