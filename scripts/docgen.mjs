#!/usr/bin/env node
// Minimal doc generator: scans source roots and writes Markdown docs.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const defaultConfig = {
  roots: ['app'],
  outDir: 'docs',
  include: ['.ts', '.tsx'],
  exclude: ['.disabled'],
  adrTag: 'ADR:',
  noteTag: '@doc:'
};

const cwd = process.cwd();

function readConfig() {
  const cfgPath = path.resolve(cwd, 'docgen.config.json');
  if (fs.existsSync(cfgPath)) {
    try {
      const raw = fs.readFileSync(cfgPath, 'utf8');
      const parsed = JSON.parse(raw);
      return { ...defaultConfig, ...parsed };
    } catch (err) {
      console.warn('[docgen] Failed to parse docgen.config.json, using defaults.', err);
    }
  }
  return defaultConfig;
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      walk(p, files);
    } else {
      files.push(p);
    }
  }
  return files;
}

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function rel(p) {
  return path.relative(cwd, p).split(path.sep).join('/');
}

function extractComponentName(source, filePath) {
  const exportFn = source.match(/export\s+default\s+function\s+([A-Z][A-Za-z0-9_]*)/);
  if (exportFn) return exportFn[1];
  const fn = source.match(/function\s+([A-Z][A-Za-z0-9_]*)\s*\(/);
  if (fn) return fn[1];
  const base = path.basename(filePath).replace(/\.(tsx|ts)$/i, '');
  return base ? base[0].toUpperCase() + base.slice(1) : 'Component';
}

function extractPropsInterface(source) {
  const names = new Set();
  const propsMatch = source.match(/(interface|type)\s+([A-Za-z0-9_]*Props)\b([\s\S]*?)\n\}/);
  if (propsMatch) {
    const body = propsMatch[3] || '';
    const fields = body.match(/\n\s*([A-Za-z0-9_]+)\??:/g) || [];
    fields.forEach((field) => {
      const cleaned = field.replace(/\n|\s|\??:|:/g, '');
      if (cleaned) names.add(cleaned);
    });
  } else {
    const paramMatch = source.match(/\((\{[\s\S]*?\})\)\s*=>/);
    if (paramMatch) {
      const body = paramMatch[1];
      const fields = body.match(/[A-Za-z0-9_]+/g) || [];
      fields.forEach((f) => names.add(f));
    }
  }
  return Array.from(names);
}

function extractNotes(source, noteTag) {
  const notes = [];
  const re = new RegExp(`//\\s*${noteTag}\\s*(.*)`, 'g');
  let match;
  while ((match = re.exec(source))) {
    notes.push(match[1].trim());
  }
  return notes;
}

function readPackageScripts() {
  const pkgPath = path.resolve(cwd, 'package.json');
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return pkg.scripts || {};
  } catch (err) {
    console.warn('[docgen] Unable to read package.json scripts.', err);
    return {};
  }
}

function generateComponentDoc(filePath, source, cfg) {
  const name = extractComponentName(source, filePath);
  const props = extractPropsInterface(source);
  const notes = extractNotes(source, cfg.noteTag);
  const relPath = rel(filePath);
  const lines = [
    `# ${name}`,
    `File: ${relPath}`,
    '',
    '## Props',
    props.length ? props.map((p) => `- ${p}`).join('\n') : '- (none detected)',
    '',
    '## Notes',
    notes.length ? notes.map((n) => `- ${n}`).join('\n') : '- (none)',
    '',
    '## Overview',
    '- Auto-generated. Add // @doc: note=... lines in source to enrich.'
  ];
  return lines.join('\n') + '\n';
}

function generateArchitecture(files) {
  const groups = new Map();
  files.forEach((file) => {
    const dir = path.dirname(rel(file));
    if (!groups.has(dir)) groups.set(dir, []);
    groups.get(dir).push(path.basename(file));
  });
  const lines = ['# Architecture', '', 'Directories and files discovered under configured roots:'];
  Array.from(groups.keys()).sort().forEach((dir) => {
    lines.push(`- ${dir}`);
    groups.get(dir).sort().forEach((file) => {
      lines.push(`  - ${file}`);
    });
  });
  lines.push('', '## Build & Run');
  const scripts = readPackageScripts();
  const names = Object.keys(scripts);
  if (names.length) {
    lines.push('- package.json scripts:');
    names.forEach((name) => {
      lines.push(`  - ${name}: ${scripts[name]}`);
    });
  } else {
    lines.push('- No scripts found.');
  }
  return lines.join('\n') + '\n';
}

function collectADR(cfg, codeFiles) {
  const items = [];
  try {
    const out = execSync('git log -n 50 --pretty=%s', { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    out.split('\n').forEach((line) => {
      if (line.includes(cfg.adrTag)) items.push(line.trim());
    });
  } catch (err) {
    console.warn('[docgen] git log unavailable for ADR collection.', err);
  }

  codeFiles.forEach((file) => {
    const src = fs.readFileSync(file, 'utf8');
    const lines = src.split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (!line.includes(cfg.noteTag) || !line.includes('decision(')) return;
      const decisionIndex = line.indexOf('decision(');
      if (decisionIndex === -1) return;
      const start = decisionIndex + 'decision('.length;
      const end = line.indexOf(')', start);
      const payload = (end >= 0 ? line.slice(start, end) : line.slice(start)).trim();
      items.push(`decision(${payload}) @ ${rel(file)}:${idx + 1}`);
    });
  });

  return items;
}

function writeDecisions(cfg, codeFiles, outDir) {
  const adrs = collectADR(cfg, codeFiles);
  const md = ['# Decisions', '', adrs.length ? adrs.map((a) => `- ${a}`).join('\n') : '- (none found)'].join('\n') + '\n';
  fs.writeFileSync(path.join(outDir, 'decisions.md'), md, 'utf8');
}

function writeIndex(outDir) {
  const lines = [
    '# Project Docs',
    '',
    '- docs/components/: per-file auto-generated notes.',
    '- docs/architecture.md: directory structure overview.',
    '- docs/decisions.md: ADR-style log from commits and @doc: decision(...) notes.'
  ];
  fs.writeFileSync(path.join(outDir, 'README.md'), lines.join('\n') + '\n', 'utf8');
}

function main() {
  const cfg = readConfig();
  const outDir = path.resolve(cwd, cfg.outDir);
  const compDir = path.join(outDir, 'components');

  ensureDir(outDir);
  ensureDir(compDir);

  const allFiles = [];
  cfg.roots.forEach((root) => {
    allFiles.push(...walk(path.resolve(cwd, root)));
  });

  const codeFiles = allFiles.filter((file) => {
    const normalized = file.toLowerCase();
    const allowed = cfg.include.some((ext) => normalized.endsWith(ext));
    const excluded = cfg.exclude.some((ext) => normalized.endsWith(ext));
    return allowed && !excluded;
  });

  codeFiles.forEach((file) => {
    const src = fs.readFileSync(file, 'utf8');
    const md = generateComponentDoc(file, src, cfg);
    const name = rel(file).replace(/[\/]/g, '_').replace(/\.(tsx|ts)$/i, '');
    const outPath = path.join(compDir, `${name}.md`);
    fs.writeFileSync(outPath, md, 'utf8');
  });

  const arch = generateArchitecture(codeFiles);
  fs.writeFileSync(path.join(outDir, 'architecture.md'), arch, 'utf8');

  writeDecisions(cfg, codeFiles, outDir);
  writeIndex(outDir);
}

main();
