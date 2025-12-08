// Supabase Edge Function: news
// Deploy with: supabase functions deploy news --no-verify-jwt
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

type Article = {
  title: string;
  summary: string;
  image: string;
  category: "technology" | "world" | "business";
  tone: "neutral" | "positive" | "negative";
  tag: string;
  vocab: { word: string; definition: string }[];
};

type NewsResponse = {
  status: "ok" | "stale" | "error";
  fetchedAt: string | null;
  articles: Article[];
};

const SUPABASE_URL =
  Deno.env.get("SUPABASEURL") || // fallback to new name
  Deno.env.get("SUPABASE_URL") || // existing name
  "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  Deno.env.get("SERVICE_ROLE_KEY") ||
  "";
const NEWS_URL = Deno.env.get("EXTERNAL_NEWS_API_URL");
const API_KEY = Deno.env.get("EXTERNAL_NEWS_API_KEY");
const MAX_AGE_MINUTES = 60; // cache freshness window

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function normalizeArticles(raw: any[]): Article[] {
  return (raw || []).slice(0, 12).map((a) => {
    const title = a?.title || a?.description || "Daily update";
    const summary = a?.content || a?.description || title;
    const vocab = (title as string)
      .split(/\s+/)
      .slice(0, 5)
      .map((w) => ({
        word: w.replace(/[^a-zA-Z]/g, ""),
        definition: "Key word from headline",
      }));
    return {
      title,
      summary,
      image: a?.urlToImage || "",
      category: "technology", // adjust mapping if needed
      tone: "neutral",        // adjust mapping if needed
      tag: "Live",
      vocab,
    };
  });
}

async function getLatest(): Promise<NewsResponse & { source_error?: string | null }> {
  const { data, error } = await supabase
    .from("news_feed")
    .select("status,fetched_at,payload,source_error")
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return { status: "error", fetchedAt: null, articles: [] };
  const payload = (data as any).payload || {};
  return {
    status: (data as any).status,
    fetchedAt: (data as any).fetched_at,
    articles: payload.articles || [],
    source_error: (data as any).source_error || null,
  };
}

function isFresh(fetchedAt: string | null) {
  if (!fetchedAt) return false;
  const ageMs = Date.now() - new Date(fetchedAt).getTime();
  return ageMs <= MAX_AGE_MINUTES * 60 * 1000;
}

async function fetchExternal(): Promise<{ articles: Article[]; fetchedAt: string }> {
  if (!NEWS_URL) throw new Error("Missing env: EXTERNAL_NEWS_API_URL");
  if (!API_KEY) throw new Error("Missing env: EXTERNAL_NEWS_API_KEY");

  let finalUrl = NEWS_URL;
  try {
    const u = new URL(NEWS_URL);
    if (!u.searchParams.get("pageSize")) u.searchParams.set("pageSize", "12");
    finalUrl = u.toString();
  } catch {
    // leave as-is if URL parsing fails
  }

  const res = await fetch(finalUrl, {
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": API_KEY,
    },
  });
  if (!res.ok) throw new Error(`status ${res.status}`);
  const data = await res.json();
  const articlesRaw = Array.isArray(data?.articles) ? data.articles : [];
  if (!articlesRaw.length) throw new Error("no articles");
  const articles = normalizeArticles(articlesRaw);
  const now = new Date().toISOString();
  return { articles, fetchedAt: now };
}

async function storeRow(
  status: "ok" | "stale" | "error",
  payload: { fetchedAt?: string | null; articles: Article[] },
  source_error?: string | null
) {
  await supabase.from("news_feed").insert({
    fetched_at: payload.fetchedAt || new Date().toISOString(),
    status,
    payload: { articles: payload.articles || [] },
    source_error: source_error || null,
  });
}

serve(async (req) => {
  const url = new URL(req.url);
  const isRefresh = req.method === "POST" || url.pathname.endsWith("/refresh");

  // GET: return cached; refresh if stale. POST: force refresh.
  if (!isRefresh && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const latest = await getLatest();
  const fresh = isFresh(latest.fetchedAt);

  if (!isRefresh && fresh && latest.status === "ok") {
    return new Response(
      JSON.stringify({
        status: "ok",
        fetchedAt: latest.fetchedAt,
        articles: latest.articles,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const refreshed = await fetchExternal();
    await storeRow("ok", refreshed);
    return new Response(
      JSON.stringify({
        status: "ok",
        fetchedAt: refreshed.fetchedAt,
        articles: refreshed.articles,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    if (latest.status !== "error") {
      await storeRow(
        "stale",
        { fetchedAt: latest.fetchedAt, articles: latest.articles },
        String(err?.message || err),
      );
      return new Response(
        JSON.stringify({
          status: "stale",
          fetchedAt: latest.fetchedAt,
          articles: latest.articles,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    } else {
      await storeRow(
        "error",
        { fetchedAt: new Date().toISOString(), articles: [] },
        String(err?.message || err),
      );
      return new Response(
        JSON.stringify({
          status: "error",
          fetchedAt: null,
          articles: [],
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }
  }
});
