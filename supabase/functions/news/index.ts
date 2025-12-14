// supabase/functions/news/index.ts
// Deploy: supabase functions deploy news --no-verify-jwt

import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

type VocabItem = { word: string; definition: string };

type Article = {
  title: string;
  summary: string;
  image: string;
  category: string;
  tone: string;
  tag: string;
  vocab: VocabItem[];

  // debug/meta
  source_url?: string;
  cache_key?: string;
  cache_hit?: boolean;
  generated_at?: string | null;
  generation_status?: string;
  generation_note?: string;
};

const API_URL = Deno.env.get("EXTERNAL_NEWS_API_URL") || "";
const API_KEY = Deno.env.get("EXTERNAL_NEWS_API_KEY") || "";

const AI_PROXY_URL = Deno.env.get("AI_PROXY_URL") || "";
const AI_PROXY_KEY = Deno.env.get("AI_PROXY_KEY") || "";
const AI_PROXY_FALLBACK_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { global: { fetch } })
    : null;

const NEWS_ARTICLE_TABLE = "news_article_cache";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const deriveProxyUrl = () => {
  const trimmedSupabaseUrl = (SUPABASE_URL || "").replace(/\/+$/, "");
  const trimmedOverride = (AI_PROXY_URL || "").replace(/\/+$/, "");

  // If override exists and is a valid URL, prefer it.
  if (trimmedOverride) {
    try {
      // warn if it points to a different host than SUPABASE_URL (common mistake)
      if (trimmedSupabaseUrl) {
        const supaHost = new URL(trimmedSupabaseUrl).host;
        const overrideHost = new URL(trimmedOverride).host;
        if (supaHost && overrideHost && supaHost !== overrideHost) {
          console.warn("[news] AI_PROXY_URL host differs from SUPABASE_URL host", {
            aiProxyUrl: trimmedOverride,
            supabaseUrl: trimmedSupabaseUrl,
          });
        }
      }
      return trimmedOverride;
    } catch {
      console.warn("[news] AI_PROXY_URL is set but malformed; ignoring it", { AI_PROXY_URL });
      // fall through to default
    }
  }

  // Default: use this project's domain.
  if (!trimmedSupabaseUrl) return "";
  return `${trimmedSupabaseUrl}/functions/v1/ai-proxy`;
};

const AI_PROXY_ENDPOINT = deriveProxyUrl();
const AI_ENABLED = Boolean(AI_PROXY_ENDPOINT && (AI_PROXY_KEY || AI_PROXY_FALLBACK_KEY));

const STOPWORDS = new Set<string>([
  "the","a","an","and","or","but","if","then","than","so","to","of","in","on","at","for","with","by","from",
  "as","is","are","was","were","be","been","being","it","this","that","these","those","they","them","their",
  "he","she","his","her","you","your","we","our","i","me","my","who","whom","which","what","when","where","why","how",
  "will","would","can","could","should","may","might","must","do","does","did","done","have","has","had",
  "more","most","less","least","very","also","just","only",
]);

const wordCount = (text: string) =>
  (text || "").trim().split(/\s+/).filter(Boolean).length;

const dedupeSentences = (text: string) => {
  const parts = (text || "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const s of parts) {
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(s);
  }
  return unique.join(" ");
};

const stripNoise = (text: string) =>
  (text || "").replace(/(only available in paid plans[\s.,;:-]*)+/gi, "");

const clampArticle = (text: string) => {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const words = clean.split(/\s+/).filter(Boolean);
  return words.slice(0, 260).join(" ");
};

const ensureArticleLength = (text: string) => {
  const cleaned = stripNoise(text);
  const deduped = dedupeSentences(cleaned);
  return clampArticle(deduped || cleaned);
};

const trimKnownText = (text: string, maxWords = 140) => {
  const words = (text || "").split(/\s+/).filter(Boolean);
  return words.slice(0, maxWords).join(" ");
};

const normalizeUrl = (raw: string) => {
  if (!raw) return "";
  try {
    const u = new URL(raw);
    ["utm_source","utm_medium","utm_campaign","utm_term","utm_content","fbclid","gclid"].forEach((p) =>
      u.searchParams.delete(p)
    );
    u.hash = "";
    u.hostname = u.hostname.toLowerCase();
    if (u.pathname !== "/" && u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);
    return u.toString();
  } catch {
    return raw.trim();
  }
};

const sha256 = async (input: string) => {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const buildCacheKey = async (a: any) => {
  const url = normalizeUrl(a?.link || a?.url || a?.source_url || "");
  const id = (a?.article_id || a?.id || "").toString().trim();
  if (url) return `news:${url}`;
  if (id) return `news:id:${id}`;
  const pub = (a?.pubDate || a?.publishedAt || a?.published_at || "").toString();
  const title = (a?.title || "Daily Update").toString();
  return `news:hash:${await sha256(`${title}::${pub}`)}`;
};

const cleanWord = (w: string) =>
  (w || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z\-]/g, "")
    .replace(/^-+|-+$/g, "");

const isGoodVocab = (w: string) => {
  if (!w) return false;
  if (w.length < 4) return false;
  if (STOPWORDS.has(w)) return false;
  if (["make","get","go","say","take","come","use","see","know","think","look","want"].includes(w)) return false;
  return true;
};

const buildFallbackVocab = (source: string): VocabItem[] => {
  const tokens = (source || "")
    .toLowerCase()
    .split(/[^a-z\-]+/g)
    .map(cleanWord)
    .filter(Boolean);

  const out: VocabItem[] = [];
  const seen = new Set<string>();

  for (const t of tokens) {
    if (!isGoodVocab(t)) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push({ word: t, definition: "Key word from the article" });
    if (out.length >= 8) break;
  }

  return out.length ? out : [{ word: "update", definition: "A report about something new or changing" }];
};

const parseJsonArray = (raw: string): any[] | null => {
  if (!raw) return null;
  const s = raw.trim();

  if (s.startsWith("[") && s.endsWith("]")) {
    try {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      // continue
    }
  }

  const start = s.indexOf("[");
  const end = s.lastIndexOf("]");
  if (start >= 0 && end > start) {
    const chunk = s.slice(start, end + 1);
    try {
      const parsed = JSON.parse(chunk);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return null;
};

type AIResult = { content: string | null; errorNote?: string };

const callAI = async (messages: any[], maxTokens: number): Promise<AIResult> => {
  const proxyAuth = AI_PROXY_KEY || AI_PROXY_FALLBACK_KEY;
  if (!AI_PROXY_ENDPOINT || !proxyAuth) return { content: null, errorNote: "ai_proxy_missing" };

  try {
    const res = await fetch(AI_PROXY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: proxyAuth,
        Authorization: `Bearer ${proxyAuth}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: maxTokens,
        messages,
      }),
    });

    const status = res.status;
    const bodyText = await res.text();

    if (!res.ok) {
      console.error("[news] AI proxy non-200", {
        endpoint: AI_PROXY_ENDPOINT,
        status,
        body: bodyText.slice(0, 500),
      });
      return { content: null, errorNote: `ai_proxy_http_${status}` };
    }

    let parsed: any = null;
    try {
      parsed = bodyText ? JSON.parse(bodyText) : null;
    } catch {
      parsed = null;
    }

    const candidates = [
      parsed?.content,
      parsed?.choices?.[0]?.message?.content,
      parsed?.data?.content,
      parsed?.result,
      parsed?.text,
      bodyText,
    ];

    const content = candidates.find((c) => typeof c === "string" && c.trim());
    if (typeof content === "string" && content.trim()) return { content: content.trim() };

    console.error("[news] AI proxy empty content", {
      endpoint: AI_PROXY_ENDPOINT,
      status,
      body: bodyText.slice(0, 500),
    });
    return { content: null, errorNote: "ai_proxy_empty_content" };
  } catch (err: any) {
    console.error("[news] AI proxy call failed", {
      endpoint: AI_PROXY_ENDPOINT,
      error: err?.message || String(err),
    });
    return { content: null, errorNote: "ai_proxy_call_failed" };
  }
};

const extractVocabFromArticle = async (articleBody: string): Promise<VocabItem[] | null> => {
  const body = (articleBody || "").trim();
  if (wordCount(body) < 60) return null;

  const messages = [
    {
      role: "system",
      content:
        `You are an English teacher choosing vocabulary for intermediate–advanced learners.
Extract 6–10 meaningful vocabulary words from the article (NOT names, NOT locations, NOT acronyms, NOT basic verbs, NOT stopwords).
For each item return:
- word (single word, lowercase, letters or hyphen only)
- definition (simple, 10–12 words max)
Return a JSON array only. No extra text.`,
    },
    { role: "user", content: `ARTICLE:\n${body}\n\nReturn JSON array only.` },
  ];

  const raw = await callAI(messages, 450);
  if (!raw.content) return null;

  const arr = parseJsonArray(raw.content);
  if (!arr) return null;

  const out: VocabItem[] = [];
  const seen = new Set<string>();

  for (const item of arr) {
    const w = cleanWord(item?.word || item?.term || "");
    const def = (item?.definition || item?.meaning || "").toString().trim();

    if (!isGoodVocab(w)) continue;
    if (!def || def.length < 6) continue;
    if (seen.has(w)) continue;

    seen.add(w);
    out.push({ word: w, definition: def.slice(0, 140) });
    if (out.length >= 10) break;
  }

  return out.length ? out : null;
};

async function expandWithAI(article: Article): Promise<Article> {
  const cleanedSummary = ensureArticleLength(article.summary || "");
  const knownText = trimKnownText(cleanedSummary || "", 140);

  if (!AI_ENABLED) {
    const fallback = cleanedSummary || article.summary || knownText || article.title || "Daily update";
    const finalSummary = ensureArticleLength(fallback);
    return {
      ...article,
      summary: finalSummary,
      vocab: buildFallbackVocab(finalSummary || article.title),
      generation_status: "fallback_source",
      generation_note: "ai_disabled_or_missing_proxy",
    };
  }

  try {
    const messages = [
      {
        role: "system",
        content: `
You are a news writer. Reconstruct concise, natural, journalistic articles using ONLY the headline and any partial sentences provided.
Paywall notices must be discarded.

Rules:
- Write 140–220 words.
- Keep it factual and neutral.
- Expand logically using world knowledge, without inventing specific fake facts.
- Add context, background, reactions, and implications.
- No bullet points, no headings — just paragraphs.
- Never repeat the headline.
- Make it feel like a real Reuters/AP-style article.
        `.trim(),
      },
      {
        role: "user",
        content: `
HEADLINE:
${article.title}

KNOWN TEXT:
${knownText}

TASK:
Write a concise news article (140–220 words). Ignore paywall/marketing boilerplate.
Avoid fiction and avoid specific unverifiable claims.
        `.trim(),
      },
    ];

    const firstResponse = await callAI(messages, 900);
    if (firstResponse.content) {
      const firstPass = ensureArticleLength(firstResponse.content);

      let finalSummary = firstPass;

      if (wordCount(firstPass) < 130) {
        const extendMessages = [
          { role: "system", content: "Expand news articles. Extend to 150–230 words. Plain text only." },
          { role: "user", content: `Extend this article to 150–230 words without changing facts:\n\n${firstPass}` },
        ];
        const secondResponse = await callAI(extendMessages, 900);
        const secondTxt = ensureArticleLength(secondResponse.content || "");
        if (wordCount(secondTxt) >= 130) finalSummary = secondTxt;
      }

      const aiVocab = await extractVocabFromArticle(finalSummary);
      const vocab = aiVocab?.length ? aiVocab : buildFallbackVocab(finalSummary || article.title);

      return { ...article, summary: finalSummary, vocab, generation_status: "ai_generated" };
    }

    return {
      ...article,
      summary: ensureArticleLength(cleanedSummary || article.summary || knownText || article.title || "Daily update"),
      vocab: buildFallbackVocab(cleanedSummary || article.summary || article.title || ""),
      generation_status: "fallback_source",
      generation_note: firstResponse.errorNote || "ai_call_failed_or_empty",
    };
  } catch {
    // fall through
  }

  const fallback = cleanedSummary || article.summary || knownText || article.title || "Daily update";
  const finalSummary = ensureArticleLength(fallback);
  return {
    ...article,
    summary: finalSummary,
    vocab: buildFallbackVocab(finalSummary || article.title),
    generation_status: "fallback_source",
    generation_note: "ai_call_failed_or_empty",
  };
}

const readArticleCache = async (cacheKey: string) => {
  if (!supabase) return null;

  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from(NEWS_ARTICLE_TABLE)
    .select("cache_key,title,source_url,category,image,summary,vocab,generated_at,expires_at")
    .eq("cache_key", cacheKey)
    .gt("expires_at", nowIso)
    .maybeSingle();

  if (error) return null;
  return data || null;
};

const readRecentArticles = async (limit = 12) => {
  if (!supabase) return [];
  const minGenerated = new Date(Date.now() - CACHE_TTL_MS).toISOString();
  const { data, error } = await supabase
    .from(NEWS_ARTICLE_TABLE)
    .select("cache_key,title,source_url,category,image,summary,vocab,generated_at,expires_at")
    .gt("generated_at", minGenerated)
    .order("generated_at", { ascending: false })
    .limit(limit);
  if (error || !Array.isArray(data)) return [];
  return data;
};

const writeArticleCache = async (row: {
  cache_key: string;
  title?: string;
  source_url?: string;
  category?: any;
  image?: string;
  summary?: string;
  vocab?: any;
  generated_at?: string;
  expires_at?: string;
}) => {
  if (!supabase) return;
  try {
    await supabase.from(NEWS_ARTICLE_TABLE).upsert(row, { onConflict: "cache_key" });
  } catch (err) {
    console.error("[news] upsert cache failed", err);
  }
};

serve(async (req) => {
  console.log("NEWS FUNCTION VERSION", "debug-ai-proxy-v2", {
    aiEnabled: AI_ENABLED,
    aiProxyEndpoint: AI_PROXY_ENDPOINT,
    hasKey: Boolean(AI_PROXY_KEY || AI_PROXY_FALLBACK_KEY),
  });

  if (!API_URL || !API_KEY) {
    return new Response(JSON.stringify({
      status: "error",
      message: "Missing API URL or KEY",
      articles: [],
      fetchedAt: null,
    }), { headers: { "Content-Type": "application/json" }, status: 500 });
  }

  if (!supabase) {
    return new Response(JSON.stringify({
      status: "error",
      message: "Supabase service role not configured",
      articles: [],
      fetchedAt: null,
    }), { headers: { "Content-Type": "application/json" }, status: 500 });
  }

  const url = new URL(req.url);
  const forceRefresh = url.searchParams.get("refresh") === "1";
  const limitRaw = Number(url.searchParams.get("limit") || "12");
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(12, limitRaw)) : 12;

  try {
    if (!forceRefresh) {
      const recent = await readRecentArticles(limit);
      if (recent.length > 0) {
        const articles = recent.map((row) => ({
          title: row.title || "Daily Update",
          summary: row.summary || "",
          image: row.image || "",
          category: Array.isArray(row.category) ? (row.category[0] || "general") : (row.category || "general"),
          tone: "neutral",
          tag: "Live",
          vocab: Array.isArray(row.vocab) ? row.vocab : buildFallbackVocab(row.summary || row.title || ""),
          source_url: row.source_url,
          cache_key: row.cache_key,
          cache_hit: true,
          generated_at: row.generated_at || null,
          generation_status: "cache_hit_recent",
        }));
        return new Response(JSON.stringify({
          status: "ok",
          source: "news_article_cache",
          fetchedAt: new Date().toISOString(),
          articles,
        }), { headers: { "Content-Type": "application/json" } });
      }
    }

    const finalUrl = `${API_URL}${API_URL.includes("?") ? "&" : "?"}apikey=${API_KEY}`;
    const upstream = await fetch(finalUrl, { headers: { Accept: "application/json" } });

    if (!upstream.ok) {
      return new Response(JSON.stringify({
        status: "error",
        message: `Upstream error: ${upstream.status}`,
        articles: [],
        fetchedAt: null,
      }), { headers: { "Content-Type": "application/json" }, status: upstream.status });
    }

    const data = await upstream.json();

    const rawArticles: any[] = Array.isArray((data as any)?.results)
      ? (data as any).results
      : Array.isArray((data as any)?.articles)
        ? (data as any).articles
        : [];

    const ttlExpiresAt = new Date(Date.now() + CACHE_TTL_MS).toISOString();
    const out: Article[] = [];

    for (const a of rawArticles.slice(0, limit)) {
      const title = a?.title || "Daily Update";
      const source_url = normalizeUrl(a?.link || a?.url || a?.source_url || "");
      const cache_key = await buildCacheKey(a);

      const categoryRaw = a?.category;
      const categoryArr = Array.isArray(categoryRaw)
        ? categoryRaw.map((c: any) => String(c || "").trim()).filter(Boolean)
        : typeof categoryRaw === "string" && categoryRaw.trim()
          ? [categoryRaw.trim()]
          : ["general"];
      const category = categoryArr[0] || "general";

      if (!forceRefresh) {
        const cached = await readArticleCache(cache_key);
        if (cached?.summary) {
          out.push({
            title: cached.title || title,
            summary: cached.summary,
            image: cached.image || (a?.image_url || a?.urlToImage || a?.image || ""),
            category: Array.isArray(cached.category) ? (cached.category[0] || "general") : (cached.category || category),
            tone: "neutral",
            tag: "Live",
            vocab: Array.isArray(cached.vocab) ? cached.vocab : buildFallbackVocab(cached.summary || title),
            source_url: cached.source_url || source_url,
            cache_key,
            cache_hit: true,
            generated_at: cached.generated_at || null,
            generation_status: "cache_hit",
          });
          continue;
        }
      }

      const parts = [
        a?.full_description || "",
        a?.content || "",
        a?.description || "",
        a?.summary || "",
      ].join(" ").replace(/\s+/g, " ").trim();

      const sentences = Array.from(new Set(
        parts.split(/(?<=[.!?])\s+/).map((s: string) => s.trim()).filter(Boolean)
      ));

      const merged = sentences.join(" ");
      const baseSummary = (merged || title).trim() || title;

      const image = a?.image_url || a?.urlToImage || a?.image || "";

      const base: Article = {
        title,
        summary: baseSummary,
        image,
        category,
        tone: "neutral",
        tag: "Live",
        vocab: buildFallbackVocab(baseSummary || title),
        source_url,
      };

      const expanded = await expandWithAI(base);

      const generated_at = new Date().toISOString();
      const generation_status = expanded.generation_status || "ai_generated";

      await writeArticleCache({
        cache_key,
        title: expanded.title,
        source_url,
        category: categoryArr,
        image: expanded.image,
        summary: expanded.summary,
        vocab: expanded.vocab,
        generated_at,
        expires_at: ttlExpiresAt,
      });

      out.push({
        ...expanded,
        source_url,
        cache_key,
        cache_hit: false,
        generated_at,
        generation_status,
      });
    }

    return new Response(JSON.stringify({
      status: "ok",
      source: "news_article_cache",
      fetchedAt: new Date().toISOString(),
      articles: out,
    }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({
      status: "error",
      message: String(err),
      articles: [],
      fetchedAt: null,
    }), { headers: { "Content-Type": "application/json" }, status: 500 });
  }
});