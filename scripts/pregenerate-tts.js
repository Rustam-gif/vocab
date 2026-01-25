#!/usr/bin/env node
/**
 * Script to pre-generate TTS audio for all words in sets and upload to Supabase storage
 * This eliminates the need for users to cache audio on first play
 *
 * Usage: node scripts/pregenerate-tts.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://auirkjgyattnvqaygmfo.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VOICE = 'shimmer';
const RATE = 0.95;
const BUCKET_NAME = 'tts-cache';

// Stats
let stats = {
  total: 0,
  generated: 0,
  skipped: 0,
  failed: 0,
  errors: []
};

// Helper to create SHA-256 hash (same as Supabase function)
function hashString(str) {
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
}

// Check if file exists in Supabase storage
async function fileExists(fileName) {
  try {
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET_NAME}/tts?search=${fileName}`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      }
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking file existence:', error.message);
    return false;
  }
}

// Generate TTS audio using OpenAI
async function generateTTS(text) {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice: VOICE,
      input: text,
      response_format: 'mp3',
      speed: RATE
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  return await response.arrayBuffer();
}

// Upload to Supabase storage
async function uploadToStorage(fileName, audioBuffer) {
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${fileName}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.byteLength.toString()
    },
    body: audioBuffer
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload error: ${response.status} - ${error}`);
  }

  return await response.json();
}

// Process a single word
async function processWord(word, index, total) {
  const cacheKey = hashString(`${word}-${VOICE}-${RATE}`);
  const fileName = `${cacheKey}.mp3`;
  const filePath = `tts/${fileName}`;

  console.log(`[${index + 1}/${total}] Processing: "${word}"`);

  try {
    // Check if already exists
    const exists = await fileExists(fileName);
    if (exists) {
      console.log(`  ✓ Already cached, skipping`);
      stats.skipped++;
      return;
    }

    // Generate TTS
    console.log(`  → Generating TTS...`);
    const audioBuffer = await generateTTS(word);
    console.log(`  → Generated ${audioBuffer.byteLength} bytes`);

    // Upload to storage
    console.log(`  → Uploading to storage...`);
    await uploadToStorage(filePath, audioBuffer);
    console.log(`  ✓ Uploaded successfully`);

    stats.generated++;

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  } catch (error) {
    console.error(`  ✗ Failed: ${error.message}`);
    stats.failed++;
    stats.errors.push({ word, error: error.message });
  }
}

// Extract all unique words from levels
function extractWordsFromLevels() {
  const levelsPath = path.join(__dirname, '../app/quiz/data/levels.ts');

  if (!fs.existsSync(levelsPath)) {
    console.error('Error: levels.ts not found at', levelsPath);
    process.exit(1);
  }

  const content = fs.readFileSync(levelsPath, 'utf8');

  // Extract word objects with regex
  const wordMatches = content.matchAll(/word:\s*['"]([^'"]+)['"]/g);
  const words = new Set();

  for (const match of wordMatches) {
    words.add(match[1].trim());
  }

  return Array.from(words).sort();
}

// Main function
async function main() {
  console.log('='.repeat(60));
  console.log('TTS Pre-generation Script');
  console.log('='.repeat(60));
  console.log();

  // Validate environment variables
  if (!OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable is required');
    process.exit(1);
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    process.exit(1);
  }

  console.log('Configuration:');
  console.log(`  Supabase URL: ${SUPABASE_URL}`);
  console.log(`  Voice: ${VOICE}`);
  console.log(`  Rate: ${RATE}`);
  console.log(`  Bucket: ${BUCKET_NAME}`);
  console.log();

  // Extract words
  console.log('Extracting words from levels...');
  const words = extractWordsFromLevels();
  stats.total = words.length;
  console.log(`Found ${words.length} unique words`);
  console.log();

  if (words.length === 0) {
    console.error('Error: No words found in levels.ts');
    process.exit(1);
  }

  // Process all words
  console.log('Starting TTS generation...');
  console.log();

  const startTime = Date.now();

  for (let i = 0; i < words.length; i++) {
    await processWord(words[i], i, words.length);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  // Print summary
  console.log();
  console.log('='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Total words:     ${stats.total}`);
  console.log(`Generated:       ${stats.generated} (${((stats.generated / stats.total) * 100).toFixed(1)}%)`);
  console.log(`Already cached:  ${stats.skipped} (${((stats.skipped / stats.total) * 100).toFixed(1)}%)`);
  console.log(`Failed:          ${stats.failed} (${((stats.failed / stats.total) * 100).toFixed(1)}%)`);
  console.log(`Duration:        ${duration}s`);
  console.log();

  if (stats.errors.length > 0) {
    console.log('Errors:');
    stats.errors.forEach(({ word, error }) => {
      console.log(`  - "${word}": ${error}`);
    });
    console.log();
  }

  console.log('Done!');
  console.log('='.repeat(60));
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
