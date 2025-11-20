// Lightweight spell-suggest utilities for on-device OCR cleanup

function norm(s: string): string {
  return (s || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z'\-]/g, '')
    .replace(/^['\-]+|['\-]+$/g, '');
}

// Levenshtein with optional early-exit threshold
export function levenshtein(a: string, b: string, max: number = 3): number {
  a = norm(a);
  b = norm(b);
  const al = a.length, bl = b.length;
  if (Math.abs(al - bl) > max) return max + 1;
  if (al === 0) return Math.min(bl, max + 1);
  if (bl === 0) return Math.min(al, max + 1);

  const v0 = new Array(bl + 1);
  const v1 = new Array(bl + 1);
  for (let i = 0; i <= bl; i++) v0[i] = i;

  for (let i = 0; i < al; i++) {
    v1[0] = i + 1;
    let best = v1[0];
    const ca = a.charCodeAt(i);
    for (let j = 0; j < bl; j++) {
      const cost = ca === b.charCodeAt(j) ? 0 : 1;
      const m = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
      v1[j + 1] = m;
      if (m < best) best = m;
    }
    if (best > max) return max + 1; // early exit
    for (let j = 0; j <= bl; j++) v0[j] = v1[j];
  }
  return v1[bl];
}

export function buildDictionary(base: string[], extras?: string[]): string[] {
  const set = new Set<string>();
  base.forEach(w => { const s = norm(w); if (s) set.add(s); });
  (extras || []).forEach(w => { const s = norm(w); if (s) set.add(s); });
  return Array.from(set);
}

export function suggestClosest(input: string, dict: string[]): { word: string; distance: number } | null {
  const w = norm(input);
  if (!w) return null;
  let best: string | null = null;
  let bestDist = 10_000;

  // Dynamic threshold based on length (more permissive for longer tokens)
  const thr = w.length <= 4 ? 1 : w.length <= 6 ? 2 : w.length >= 8 ? 4 : 3;

  for (let i = 0; i < dict.length; i++) {
    const d = dict[i];
    if (Math.abs(d.length - w.length) > thr) continue;
    // Cheap bigram prefix gate to avoid wild mismatches
    if (d.length > 4 && w.length > 4) {
      if (d[0] !== w[0]) continue;
      if (d[1] !== w[1]) continue;
    } else if (d[0] && w[0] && d[0] !== w[0]) continue;
    const dist = levenshtein(w, d, thr);
    if (dist <= thr && dist < bestDist) {
      bestDist = dist; best = d;
      if (bestDist === 0) break;
    }
  }
  return best ? { word: best, distance: bestDist } : null;
}

export function correctTokens(tokens: string[], dict: string[]): string[] {
  const out: string[] = [];
  const inDict = new Set(dict);
  const seen = new Set<string>();
  for (const t of tokens) {
    const w = norm(t);
    if (!w) continue;
    let pick = w;
    if (!inDict.has(w)) {
      const s = suggestClosest(w, dict);
      if (s) pick = s.word; else continue; // drop non-words
    }
    if (!seen.has(pick)) { out.push(pick); seen.add(pick); }
  }
  return out;
}

export default { levenshtein, buildDictionary, suggestClosest, correctTokens };
