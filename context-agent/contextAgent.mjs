#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd(), 'context-agent');
const MEMORY_PATH = path.join(ROOT, 'memory.json');
const CONFIG_PATH = path.join(ROOT, 'agent-config.json');

function loadJson(filePath, fallback) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
      return fallback;
    }
    throw error;
  }
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function printSummary(memory) {
  const config = loadJson(CONFIG_PATH, {});
  console.log(`Agent: ${config.agentName || 'Context Agent'} (${config.role || 'advisor'})`);
  if (config.mission) console.log(`Mission: ${config.mission}`);
  console.log('\nGoals');
  memory.goals.slice(-5).forEach((item, idx) => {
    console.log(`${idx + 1}. ${item.title} — ${item.detail}`);
  });
  if (!memory.goals.length) console.log('  (none logged)');

  console.log('\nDecisions');
  memory.decisions.slice(-5).forEach((item, idx) => {
    console.log(`${idx + 1}. [${item.when}] ${item.title} — ${item.detail}`);
  });
  if (!memory.decisions.length) console.log('  (none logged)');

  console.log('\nStyle Notes');
  const styles = memory.style.length ? memory.style : (config.styleRules || []);
  styles.forEach((item, idx) => {
    if (typeof item === 'string') console.log(`${idx + 1}. ${item}`);
    else console.log(`${idx + 1}. ${item.title}: ${item.detail}`);
  });
  if (!styles.length) console.log('  (none logged)');
}

function addEntry(memory, bucket, title, detail) {
  const timestamp = new Date().toISOString();
  const entry = { title, detail, when: timestamp };
  memory[bucket].push(entry);
  saveJson(MEMORY_PATH, memory);
  console.log(`Added ${bucket.slice(0, -1)}: ${title}`);
}

function parseArgs() {
  const [,, command, bucket, ...rest] = process.argv;
  return { command, bucket, rest };
}

function main() {
  const memory = loadJson(MEMORY_PATH, { decisions: [], goals: [], style: [] });
  const { command, bucket, rest } = parseArgs();

  if (!command || command === 'summary') {
    printSummary(memory);
    return;
  }

  if (command === 'add') {
    if (!['decision', 'goal', 'style'].includes(bucket)) {
      console.error('Usage: node context-agent/contextAgent.mjs add <decision|goal|style> "Title" "Detail"');
      process.exit(1);
    }
    const [title = '', detail = ''] = rest;
    if (!title) {
      console.error('Please provide a title for the entry.');
      process.exit(1);
    }
    const text = detail || title;
    addEntry(memory, bucket === 'decision' ? 'decisions' : bucket === 'goal' ? 'goals' : 'style', title, text);
    return;
  }

  console.error('Unknown command. Supported commands: summary, add');
  process.exit(1);
}

main();
