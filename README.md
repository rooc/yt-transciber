# YT-trans

A YouTube video transcript viewer with bilingual support.

## Quick Start (Obsidian Clipper)

```bash
# 1. Clip YouTube video → saves to transcripts/

# 2. Rename to video ID
mv transcripts/Video\ Title.md transcripts/VIDEO_ID.md

# 3. Prepare for AI translation
node server.js translate
# → Creates translation placeholder
# → Creates vocab with [translation needed]
# → Generates VOCAB_AI_PROMPT.md

# 4. Get AI translations (EASY WAY)
# Upload VOCAB_AI_PROMPT.md to AI:
# - ChatGPT: Click 📎 → Upload file → "Do what it says"
# - Claude: Drag & drop file → "Follow instructions"
# - Qwen3.5 Plus: opencode run --model "opencode-go/qwen3.5-plus"
# Save JSON response as: ai-response.json

# 5. Apply translations
node server.js vocab-ai-apply ai-response.json

# 6. Watch!
node server.js
```

Open http://localhost:7070

**Not using opencode-go?** See [FOR_NON_OPENCODE_USERS.md](FOR_NON_OPENCODE_USERS.md)

---

## Features

- Watch YouTube videos with synchronized transcripts
- Toggle dual-language view (original + English translation)
- Keyboard shortcuts for playback control
- Hover transcript to see vocabulary translation

## Setup

```bash
node server.js
```

Open http://localhost:7070

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Pause/Play |
| `←` | Rewind 10s |
| `S` | Sync video to transcript |
| `D` | Toggle dual translation |
| `F` | Toggle fullscreen mode |
| `L` | Mark video as learned |

## Adding Transcripts

### Method 1: Obsidian Clipper (Recommended)

1. **Install Obsidian Clipper** browser extension
   - [Chrome Web Store](https://chromewebstore.google.com/detail/obsidian-web-clipper)
   - [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/obsidian-web-clipper/)

2. **Configure Clipper** (first time only):
   - Open extension settings
   - Set **Vault location** to this project folder
   - Set **Folder** to `transcripts`

3. **Clip YouTube video**:
   - Open YouTube video
   - Click Obsidian Clipper extension icon
   - Click **Clip** (uses default template with title + URL)

4. **Rename file** to video ID:
   ```bash
   mv transcripts/Video\ Title.md transcripts/VIDEO_ID.md
   ```

### Obsidian Clipper Template

Create this template in Obsidian for automatic frontmatter:

```markdown
---
title: "{{title}}"
source: "{{url}}"
created: {{date}}
---

{{content}}
```

---

### Method 2: Manual

Place transcript files in `/transcripts/` folder:

```markdown
---
title: "Video Title"
source: "https://www.youtube.com/watch?v=VIDEO_ID"
---

**0:00** · First line of transcript
**0:05** · Second line
```

---

For sentence-by-sentence translation, create `VIDEO_ID_translation.md` with English text.

## Commands

### Translate (Prepare for AI)
```bash
node server.js translate
```

**What it does:**
1. ✅ Cleans transcript markdown
2. ✅ Creates `*_translation.md` placeholder
3. ✅ Creates `*_vocab.json` with `[translation needed]`
4. ✅ Generates `VOCAB_AI_PROMPT.md` for AI

**Next:** Copy `VOCAB_AI_PROMPT.md` to AI, then apply with `vocab-ai-apply`

---

### Vocab AI Apply
```bash
node server.js vocab-ai-apply ai-response.json
```

**What it does:**
- Applies AI translations from JSON file
- Updates vocab files with contextual translations

---

### Vocab AI (Alternative)
```bash
node server.js vocab-ai
```

**What it does:**
- Same as `translate` but vocab-only
- Use if you already have cleaned transcripts

### Vocab AI (Manual 2-step)
Run `node server.js vocab-ai` to generate prompt, then `node server.js vocab-ai-apply <file.json>` to apply.

### Translate (automated, free)
Run `node server.js translate` to:
- Clean transcript markdown
- Generate missing vocabulary files (`vocab/VIDEO_ID_vocab.json`)
- Add rough machine translations for vocabulary words (via translate-shell)
- Create translation placeholders if missing

**Note:** This produces rough word translations for quick lookup.

### Lint
Run `node server.js lint` to check and clean up transcripts:

- **Frontmatter validation** - Ensures title and source fields are present
- **Orphaned files** - Finds vocab/translation files without matching transcripts
- **Empty translations** - Identifies translation files that need actual content
- **Vocabulary cleanup** - Removes A1-A2 level words from vocab files

### Vocab (update only)
Run `node server.js vocab` to update vocabulary files only (skip cleaning/translation placeholders).

## Workflow

```bash
# 1. Add transcript
transcripts/VIDEO_ID.md

# 2. Prepare (clean + placeholders)
node server.js translate

# 3. Get AI translations
# Copy VOCAB_AI_PROMPT.md → AI → Save as ai-response.json

# 4. Apply AI translations
node server.js vocab-ai-apply ai-response.json

# 5. Watch
node server.js
```

**Total time:** ~5 minutes  
**Cost:** $0 (use free AI tiers)
