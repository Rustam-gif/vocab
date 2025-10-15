import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
try {
  const r = await client.chat.completions.create({ model: "gpt-4o", messages: [{ role: "user", content: "say ok" }] });
  console.log("status", 200);
  console.log(r.choices?.[0]?.message?.content);
} catch (e) {
  console.error("status", e.status);
  console.error(e);
}
EOF
node /Users/rustamkarimov/Desktop/vocab/tmp-check.mjs | cat
