# TTS Pre-generation Script

This script pre-generates TTS audio for all words in the learning sets and uploads them to Supabase storage. This eliminates the need for users to cache audio on first play.

## Prerequisites

You need the following environment variables:

1. **OPENAI_API_KEY** - Your OpenAI API key
2. **SUPABASE_SERVICE_ROLE_KEY** - Your Supabase service role key (from Supabase Dashboard → Settings → API)

## Setup

1. Make sure the `tts-cache` bucket exists in Supabase Storage:
   - Go to https://supabase.com/dashboard/project/auirkjgyattnvqaygmfo/storage/buckets
   - Verify the `tts-cache` bucket exists and is set to **Public**

2. Export environment variables:

```bash
export OPENAI_API_KEY="sk-..."
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
```

## Usage

Run the script:

```bash
npm run tts:pregenerate
```

Or directly:

```bash
node scripts/pregenerate-tts.js
```

## What It Does

1. **Extracts all unique words** from `app/quiz/data/levels.ts`
2. **Checks for existing cache** - skips words that are already uploaded
3. **Generates TTS audio** using OpenAI TTS API (shimmer voice, 0.95 rate)
4. **Uploads to Supabase Storage** at `tts-cache/tts/{hash}.mp3`
5. **Shows progress** with detailed logs and summary

## Cache Key

The script uses the same cache key format as the app:
- Hash: SHA-256 of `"word-shimmer-0.95"`
- Filename: `tts/{hash}.mp3`

This ensures the pre-generated audio will be used when users click speaker buttons.

## Output Example

```
============================================================
TTS Pre-generation Script
============================================================

Configuration:
  Supabase URL: https://auirkjgyattnvqaygmfo.supabase.co
  Voice: shimmer
  Rate: 0.95
  Bucket: tts-cache

Extracting words from levels...
Found 847 unique words

Starting TTS generation...

[1/847] Processing: "multinational"
  → Generating TTS...
  → Generated 24576 bytes
  → Uploading to storage...
  ✓ Uploaded successfully

[2/847] Processing: "sustainable"
  ✓ Already cached, skipping

...

============================================================
Summary
============================================================
Total words:     847
Generated:       423 (49.9%)
Already cached:  412 (48.6%)
Failed:          12 (1.4%)
Duration:        156.3s

Done!
============================================================
```

## Rate Limiting

The script includes a 100ms delay between requests to avoid OpenAI rate limiting. For large vocabularies, this may take several minutes.

## Cost Estimate

OpenAI TTS pricing (as of 2026):
- **tts-1 model**: $0.015 per 1,000 characters

For ~850 words (average 10 characters each):
- Characters: 850 × 10 = 8,500
- Cost: ~$0.13 USD

## Troubleshooting

### Error: OPENAI_API_KEY environment variable is required
Make sure you exported the API key:
```bash
export OPENAI_API_KEY="sk-..."
```

### Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required
Export the service role key (NOT the anon key):
```bash
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
```

### Upload errors
Check that:
1. The `tts-cache` bucket exists
2. The bucket is set to **Public**
3. Your service role key has storage permissions

### Rate limiting
If you hit OpenAI rate limits, the script will show errors. You can:
1. Wait a few minutes and run again (it will skip already-generated audio)
2. Increase the delay in the script (line with `setTimeout(resolve, 100)`)
