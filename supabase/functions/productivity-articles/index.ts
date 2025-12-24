// supabase/functions/productivity-articles/index.ts
// Deploy: supabase functions deploy productivity-articles --no-verify-jwt

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

type VocabItem = { word: string; definition: string };

type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

type Article = {
  title: string;
  summary: string;
  image: string;
  category: string;
  tag: string;
  vocab: VocabItem[];
  quiz: QuizQuestion[];
  keyTakeaways: string[];
  dailyChallenge: string;
  generated_at: string;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { global: { fetch } })
  : null;

const CACHE_TABLE = "productivity_articles_cache";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Content-Type": "application/json",
};

// Productivity topics to cycle through
const PRODUCTIVITY_TOPICS = [
  { topic: "time management", tag: "Productivity" },
  { topic: "morning routine and habits", tag: "Lifestyle" },
  { topic: "focus and concentration techniques", tag: "Focus" },
  { topic: "goal setting and achievement", tag: "Goals" },
  { topic: "work-life balance", tag: "Balance" },
  { topic: "stress management and mental wellness", tag: "Wellness" },
  { topic: "learning and skill development", tag: "Learning" },
  { topic: "communication and relationships", tag: "Life Tips" },
  { topic: "personal finance and money habits", tag: "Finance" },
  { topic: "sleep and energy optimization", tag: "Health" },
  { topic: "mindfulness and meditation", tag: "Mindfulness" },
  { topic: "decision making and problem solving", tag: "Thinking" },
  { topic: "motivation and overcoming procrastination", tag: "Motivation" },
  { topic: "digital minimalism and screen time", tag: "Digital Life" },
  { topic: "building confidence and self-esteem", tag: "Growth" },
  { topic: "creativity and innovation", tag: "Creativity" },
];

// Unsplash images for different categories
const TOPIC_IMAGES: Record<string, string> = {
  "Productivity": "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1600&q=80",
  "Lifestyle": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1600&q=80",
  "Focus": "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1600&q=80",
  "Goals": "https://images.unsplash.com/photo-1504805572947-34fad45aed93?auto=format&fit=crop&w=1600&q=80",
  "Balance": "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1600&q=80",
  "Wellness": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1600&q=80",
  "Learning": "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1600&q=80",
  "Life Tips": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=1600&q=80",
  "Finance": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1600&q=80",
  "Health": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1600&q=80",
  "Mindfulness": "https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=1600&q=80",
  "Thinking": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1600&q=80",
  "Motivation": "https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&w=1600&q=80",
  "Digital Life": "https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&w=1600&q=80",
  "Growth": "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=1600&q=80",
  "Creativity": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1600&q=80",
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1483058712412-4245e9b90334?auto=format&fit=crop&w=1600&q=80";

// Get today's date key for caching
const getTodayKey = () => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
};

// Read cached articles from database
const readCachedArticles = async (): Promise<Article[] | null> => {
  if (!supabase) return null;

  const todayKey = getTodayKey();

  try {
    const { data, error } = await supabase
      .from(CACHE_TABLE)
      .select("articles, generated_at")
      .eq("date_key", todayKey)
      .maybeSingle();

    if (error || !data) return null;

    // Check if cache is still valid (within 24 hours)
    const generatedAt = new Date(data.generated_at).getTime();
    if (Date.now() - generatedAt > CACHE_TTL_MS) return null;

    return Array.isArray(data.articles) ? data.articles : null;
  } catch {
    return null;
  }
};

// Write articles to cache
const writeCachedArticles = async (articles: Article[]): Promise<void> => {
  if (!supabase) return;

  const todayKey = getTodayKey();
  const now = new Date().toISOString();

  try {
    await supabase.from(CACHE_TABLE).upsert({
      date_key: todayKey,
      articles,
      generated_at: now,
    }, { onConflict: "date_key" });
  } catch (err) {
    console.error("[productivity-articles] Cache write failed:", err);
  }
};

// Generate a single article using OpenAI
const generateArticle = async (topic: string, tag: string): Promise<Article | null> => {
  if (!OPENAI_API_KEY) return null;

  const prompt = `Write a helpful, practical article about "${topic}" for someone learning English and wanting to improve their life.

Requirements:
1. Title: Catchy, actionable title (5-10 words)
2. Content: 250-300 words, practical advice with specific tips
3. Tone: Friendly, encouraging, easy to understand (B1-B2 English level)
4. Structure: Introduction, 3-5 key points/tips, brief conclusion
5. Vocabulary: Include 4-5 useful English words/phrases with simple definitions
6. Quiz: Create 3 comprehension questions about the article (multiple choice, 4 options each)
7. Key Takeaways: 3 short bullet points summarizing main ideas
8. Daily Challenge: One simple action the reader can do today

Return ONLY valid JSON in this exact format:
{
  "title": "Your Article Title Here",
  "summary": "The full article content here (250-300 words)...",
  "vocab": [
    {"word": "example", "definition": "a simple definition"}
  ],
  "quiz": [
    {
      "question": "What is the main idea of this article?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0
    }
  ],
  "keyTakeaways": [
    "First key point",
    "Second key point",
    "Third key point"
  ],
  "dailyChallenge": "Try this simple action today..."
}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.8,
        max_tokens: 1200,
        messages: [
          {
            role: "system",
            content: "You are a helpful life coach and English teacher. Write practical, actionable articles that help people improve their lives. Always return valid JSON only, no markdown.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      console.error("[productivity-articles] OpenAI error:", response.status);
      return null;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim() || "";

    // Parse JSON from response
    let parsed: any;
    try {
      // Try to extract JSON if wrapped in markdown code blocks
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      console.error("[productivity-articles] Failed to parse JSON:", content.slice(0, 200));
      return null;
    }

    if (!parsed.title || !parsed.summary) return null;

    return {
      title: parsed.title,
      summary: parsed.summary,
      image: TOPIC_IMAGES[tag] || DEFAULT_IMAGE,
      category: "lifestyle",
      tag,
      vocab: Array.isArray(parsed.vocab) ? parsed.vocab.slice(0, 5) : [],
      quiz: Array.isArray(parsed.quiz) ? parsed.quiz.slice(0, 3) : [],
      keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways.slice(0, 3) : [],
      dailyChallenge: parsed.dailyChallenge || "",
      generated_at: new Date().toISOString(),
    };
  } catch (err) {
    console.error("[productivity-articles] Generation error:", err);
    return null;
  }
};

// Generate all 8 articles
const generateAllArticles = async (): Promise<Article[]> => {
  // Shuffle and pick 8 random topics
  const shuffled = [...PRODUCTIVITY_TOPICS].sort(() => Math.random() - 0.5);
  const selectedTopics = shuffled.slice(0, 8);

  console.log("[productivity-articles] Generating 8 articles...");

  const articles: Article[] = [];

  // Generate articles sequentially to avoid rate limits
  for (const { topic, tag } of selectedTopics) {
    const article = await generateArticle(topic, tag);
    if (article) {
      articles.push(article);
      console.log(`[productivity-articles] Generated: ${article.title}`);
    }
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`[productivity-articles] Generated ${articles.length} articles`);
  return articles;
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Check configuration
  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({
      status: "error",
      message: "OpenAI API key not configured",
      articles: [],
    }), { headers: corsHeaders, status: 500 });
  }

  const url = new URL(req.url);
  const forceRefresh = url.searchParams.get("refresh") === "1";

  try {
    // Try to return cached articles first
    if (!forceRefresh) {
      const cached = await readCachedArticles();
      if (cached && cached.length >= 4) {
        console.log("[productivity-articles] Returning cached articles");
        return new Response(JSON.stringify({
          status: "ok",
          source: "cache",
          fetchedAt: new Date().toISOString(),
          articles: cached,
        }), { headers: corsHeaders });
      }
    }

    // Generate fresh articles
    const articles = await generateAllArticles();

    if (articles.length === 0) {
      return new Response(JSON.stringify({
        status: "error",
        message: "Failed to generate articles",
        articles: [],
      }), { headers: corsHeaders, status: 500 });
    }

    // Cache the articles
    await writeCachedArticles(articles);

    return new Response(JSON.stringify({
      status: "ok",
      source: "generated",
      fetchedAt: new Date().toISOString(),
      articles,
    }), { headers: corsHeaders });

  } catch (err) {
    console.error("[productivity-articles] Error:", err);
    return new Response(JSON.stringify({
      status: "error",
      message: String(err),
      articles: [],
    }), { headers: corsHeaders, status: 500 });
  }
});
