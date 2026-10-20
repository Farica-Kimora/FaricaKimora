// Play counts and loves for tracks played from the Farica☆Kimora sites' own players.
// GET  /api/stats?ids=lord-of-flies/01,singles/03   -> { "lord-of-flies/01": { plays, loves }, ... }
// POST /api/stats { id, action: "play" | "love" | "unlove" } -> { [id]: { plays, loves } }
import { getStore } from "@netlify/blobs";

const ID = /^[a-z0-9-]{1,40}\/\d{2}$/; // album-slug/track-number
const ACTIONS = new Set(["play", "love", "unlove"]);
const headers = {
  "Access-Control-Allow-Origin": "*", // every Farica site (and GitHub Pages copies) may read and count
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers });

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });

  const store = getStore({ name: "track-stats", consistency: "strong" });
  const read = async (id) => (await store.get(id, { type: "json" })) || { plays: 0, loves: 0 };

  if (req.method === "GET") {
    const ids = (new URL(req.url).searchParams.get("ids") || "").split(",").filter((id) => ID.test(id)).slice(0, 80);
    const entries = await Promise.all(ids.map(async (id) => [id, await read(id)]));
    return json(Object.fromEntries(entries));
  }

  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }
    const { id, action } = body || {};
    if (!ID.test(id || "") || !ACTIONS.has(action)) return json({ error: "bad request" }, 400);

    const s = await read(id);
    if (action === "play") s.plays += 1;
    if (action === "love") s.loves += 1;
    if (action === "unlove") s.loves = Math.max(0, s.loves - 1);
    await store.setJSON(id, s);
    return json({ [id]: s });
  }

  return json({ error: "method not allowed" }, 405);
};

export const config = { path: "/api/stats" };
