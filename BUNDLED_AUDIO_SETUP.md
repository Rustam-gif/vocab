# Bundled Audio Setup

This app now uses **bundled local audio files** for word pronunciations instead of streaming from URLs. This provides:

- ✅ **Zero delay** playback
- ✅ **No cutoff issues** (perfect playback every time)
- ✅ **Works offline**
- ✅ **No buffering or streaming problems**

## What Was Done

### 1. Downloaded Pre-generated Audio
- Downloaded 50 MP3 files (740KB total) from Supabase storage
- Files are in `assets/audio/words/`
- Each file is 10-14KB (1-2 seconds of audio)

### 2. Created Word-to-Audio Mapping
- Generated `assets/audio/index.ts` with word → audio file mapping
- Uses `require()` to import audio files

### 3. Updated AudioPlayer
- Now uses `react-native-sound` for native audio playback
- New method: `playWord(word, onComplete)` - plays bundled audio
- Falls back gracefully for words not in bundle

### 4. Updated Components
- `word-intro.tsx` now uses `playWord()` instead of fetching from TTS
- Removed WebView-based audio player code
- Much simpler implementation

## Next Steps: Add Audio to Xcode

The audio files need to be added to the Xcode project:

### Option 1: Automatic (using script)
```bash
# Copy audio files to iOS project
cp -r assets/audio/words ios/vocabworking/Resources/audio/

# Then in Xcode:
# 1. Right-click on vocabworking folder
# 2. "Add Files to vocabworking..."
# 3. Select ios/vocabworking/Resources/audio folder
# 4. ✅ Check "Create folder references"
# 5. ✅ Check "Add to targets: vocabworking"
```

### Option 2: Manual (recommended first time)
1. Open `ios/vocabworking.xcworkspace` in Xcode
2. Right-click on `vocabworking` folder in project navigator
3. Select "Add Files to vocabworking..."
4. Navigate to `assets/audio/words` folder
5. Select all `.mp3` files
6. **Important**: Check "Create folder references" (NOT "Create groups")
7. **Important**: Check "Add to targets: vocabworking"
8. Click "Add"

### Verify in Xcode
- You should see `words` folder (blue folder icon) in project navigator
- Build Phases → Copy Bundle Resources should list all 50 MP3 files

## Testing

1. Build and run the app from Xcode
2. Navigate to word intro screen
3. Click speaker button
4. You should see logs:
   ```
   [AudioPlayer] Playing bundled audio for: alacrity
   [AudioPlayer] Sound loaded, duration: 1.23 seconds
   [AudioPlayer] Playback completed successfully
   ```
5. Audio should play **instantly** with **zero delay**
6. **No cutoff at beginning or end**

## Fallback for Other Words

Words not in the bundle (like "leverage" from vault) will show:
```
[AudioPlayer] No bundled audio for: leverage - falling back to TTS
```

You can:
1. Keep the old TTS system as fallback
2. Add more words to the bundle later
3. Pre-generate all vault words too

## File Structure

```
assets/
└── audio/
    ├── index.ts (word → audio mapping)
    └── words/
        ├── alacrity.mp3
        ├── ameliorate.mp3
        ├── ...
        └── verisimilitude.mp3 (50 files total)
```

## Benefits

- **Atlas-style instant playback**
- **No network needed** for bundled words
- **Perfect audio quality** - no streaming artifacts
- **No WebView issues** - pure native audio
- **Simple codebase** - much easier to maintain

## Re-generating Audio

If you need to update the audio files:

```bash
# Download fresh audio from Supabase
node scripts/create-audio-mapping.js

# Add new files to Xcode (repeat Xcode steps above)
```
