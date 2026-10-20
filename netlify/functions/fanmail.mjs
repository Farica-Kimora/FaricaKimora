// Fan mail for Farica☆Kimora, sent from any of her sites.
// POST   /api/fanmail { name?, email?, message, from?, website? }  -> { ok: true }   (anyone)
// GET    /api/fanmail                                                -> [messages]   (needs the key)
// DELETE /api/fanmail?id=...                                         -> { ok: true }  (needs the key)
// The key is the FANMAIL_KEY environment variable set in Netlify; without it nobody can read the mail.
import { getStore } from "@netlify/blobs";
import { createHash, randomUUID } from "node:crypto";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers });
const clip = (v, n) => String(v ?? "").trim().slice(0, n);
const GAP = 60 * 1000; // one message per minute from the same visitor

export default async (req, context) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });

  const store = getStore({ name: "fan-mail", consistency: "strong" });

  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }
    if (body.website) return json({ ok: true }); // honeypot: bots fill the hidden field; pretend it worked

    const message = clip(body.message, 2000);
    if (message.length < 2) return json({ error: "Write a message first." }, 400);

    // light rate limit keyed on a hash of the visitor's IP (the IP itself isn't stored)
    const who = createHash("sha256").update(String(context.ip || "unknown")).digest("hex").slice(0, 16);
    const last = await store.get(`rate/${who}`, { type: "json" });
    if (last && Date.now() - last.t < GAP) return json({ error: "Slow down — try again in a minute." }, 429);
    await store.setJSON(`rate/${who}`, { t: Date.now() });

    const id = `${Date.now()}-${randomUUID().slice(0, 8)}`;
    await store.setJSON(`mail/${id}`, {
      id,
      at: new Date().toISOString(),
      name: clip(body.name, 80) || "Anonymous",
      email: clip(body.email, 120),
      from: clip(body.from, 80),
      message,
    });
    return json({ ok: true });
  }

  // reading and deleting need the key
  const key = Netlify.env.get("FANMAIL_KEY");
  if (!key || req.headers.get("authorization") !== `Bearer ${key}`) return json({ error: "not allowed" }, 403);

  if (req.method === "GET") {
    const { blobs } = await store.list({ prefix: "mail/" });
    const keys = blobs.map((b) => b.key).sort().reverse().slice(0, 300); // newest first
    const mail = await Promise.all(keys.map((k) => store.get(k, { type: "json" })));
    return json(mail.filter(Boolean));
  }

  if (req.method === "DELETE") {
    const id = new URL(req.url).searchParams.get("id") || "";
    if (!/^\d+-[0-9a-f]{8}$/.test(id)) return json({ error: "bad id" }, 400);
    await store.delete(`mail/${id}`);
    return json({ ok: true });
  }

  return json({ error: "method not allowed" }, 405);
};

export const config = { path: "/api/fanmail" };
