/*
 tools/agent_responses.js
 Minimal safe agent using the Responses API + gpt-5-codex.
 Usage:
   export OPENAI_API_KEY="sk-..."
   node tools/agent_responses.js "Fix: short description of task"
*/
import fs from "fs";
import { execSync } from "child_process";
import readline from "readline";

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error("Set OPENAI_API_KEY in your env and re-run");
  process.exit(1);
}

function sh(cmd) {
  try { return execSync(cmd, { encoding: "utf8" }).trim(); }
  catch (e) { return (e.stdout || e.message || "").toString(); }
}

const ctx = fs.existsSync("project_context.md") ? fs.readFileSync("project_context.md","utf8") : "";
const fileList = sh("git ls-files | sed -n '1,200p'");

function buildPrompt(task) {
  return [
`You are a careful code agent. OUTPUT ONLY a valid unified git patch (git diff) that implements the requested change. If no safe change is needed, output EXACTLY: NOTHING_TO_CHANGE
Project context:
${ctx}

Repo files (first 200 lines):
${fileList}

Task: ${task}

Rules:
- Keep changes minimal and local to the files needed.
- Do not refactor unrelated files.
- Do not run or suggest shell commands here; only output a git-style unified diff.
- If you cannot safely produce a patch, return NOTHING_TO_CHANGE.
`
  ].join("\n");
}

async function callResponses(prompt) {
  const resp = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-5-codex",
      input: prompt,
      
      max_output_tokens: 3000
    })
  });
  const j = await resp.json();
  if (j.error) throw new Error(JSON.stringify(j.error));
  // Extract text pieces
  const outputs = j.output || [];
  const texts = [];
  for (const item of outputs) {
    if (item.type === "message" || item.type === "output_text") {
      if (item.content) {
        for (const c of item.content) {
          if (c.type === "output_text" && c.text) texts.push(c.text);
          if (c.type === "message" && c.text) texts.push(c.text);
        }
      }
      if (item.text) texts.push(item.text);
    }
  }
  // fallback to j.output_text or j.output[0].text
  if (texts.length === 0 && j.output?.length) {
    for (const o of j.output) {
      if (o.type === "message" && o.content) {
        for (const c of o.content) if (c.text) texts.push(c.text);
      }
    }
  }
  return texts.join("\n\n").trim();
}

async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(res => rl.question(question, ans => { rl.close(); res(ans.trim()); }));
}

async function main() {
  const task = process.argv.slice(2).join(" ");
  if (!task) {
    console.log("Usage: node tools/agent_responses.js \"<task description>\"");
    process.exit(0);
  }
  console.log("Generating patch for:", task);
  const prompt = buildPrompt(task);
  const out = await callResponses(prompt);
  if (!out) { console.log("No output from model."); process.exit(0); }
  if (out.includes("NOTHING_TO_CHANGE")) {
    console.log("Agent returned NOTHING_TO_CHANGE");
    process.exit(0);
  }
  fs.writeFileSync("agent_proposed.patch", out, "utf8");
  console.log("\n--- Proposed patch saved to agent_proposed.patch ---\n");
  console.log(out.split("\n").slice(0,200).join("\n"));
  console.log("\n--- (truncated preview) ---\n");
  const ok = await ask("Apply patch? (yes/no) ");
  if (!/^y|yes$/i.test(ok)) {
    console.log("Patch not applied. Inspect agent_proposed.patch and apply manually if desired.");
    process.exit(0);
  }
  const branch = `agent/${Date.now()}`;
  sh(`git checkout -b ${branch}`);
  try {
    sh(`git apply --check agent_proposed.patch`);
  } catch (e) {
    console.error("Patch check failed:", e.toString());
    sh("git checkout -");
    process.exit(1);
  }
  sh(`git apply agent_proposed.patch`);
  sh(`git add -A`);
  sh(`git commit -m "chore(agent): automated patch: ${task.substring(0,80)}"`);
  console.log("Patch applied on branch:", branch);
  console.log("Push it with: git push -u origin", branch);
}

main().catch(err => { console.error(err); process.exit(1); });
