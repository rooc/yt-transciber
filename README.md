# YT-trans

A YouTube video transcript viewer with bilingual support.

## Quick Start (Obsidian Clipper)

```bash
# 1. Clip YouTube video with Obsidian Clipper → saves to transcripts/

# 2. Rename file to video ID
mv transcripts/Video\ Title.md transcripts/VIDEO_ID.md

# 3. Generate everything (clean + translate vocab with AI)
node server.js translate

# 4. Watch!
node server.js
```

Open http://localhost:7070

**Want free instead?** `node server.js translate --free`

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

### Vocab Auto (Recommended - opencode-go users)
```bash
# Step 1: Generate prompt and get instructions
node server.js vocab-auto

# Step 2: Copy prompt to AI and save response
opencode run --model "opencode-go/qwen3.5-plus"
# Paste content from VOCAB_AI_PROMPT.md, save response as ai-response.json

# Step 3: Apply translations automatically
node server.js vocab-auto-apply ai-response.json
```

**What it does:**
- Extracts all untranslated vocabulary from transcripts
- Generates formatted AI prompt (`VOCAB_AI_PROMPT.md`)
- Applies AI's JSON response to vocab files

**Cost:** $0 (covered by your $10/month opencode-go subscription)  
**Time:** ~3-5 minutes total  
**Quality:** Contextual translations with part-of-speech tags

### Vocab AI (Any AI - Non-opencode users)
```bash
# Generate AI prompt
node server.js vocab-ai

# Copy VOCAB_AI_PROMPT.md to ChatGPT, Claude, Gemini, etc.
# Save AI's JSON response as: ai-response.json

# Apply translations
node server.js vocab-ai-apply ai-response.json
```

**Cost:** $0 (use free tier of ChatGPT/Claude/Gemini) or your existing AI subscription  
**Quality:** Same as opencode-go (uses same AI models)

### Translate (Default - AI)
```bash
# Uses AI (Qwen3.5 Plus) by default
node server.js translate

# Or use free translate-shell
node server.js translate --free
```

**What it does:**
- Cleans transcript markdown
- Creates translation placeholders (`*_translation.md`)
- Generates vocabulary with **AI translations** (contextual, with part-of-speech)
- Use `--free` flag for translate-shell instead

**Cost:** $0 (covered by subscription) or Free with `--free` flag  
**Time:** ~3-5 minutes (AI) or ~1 minute (free)

### Vocab AI (Manual 2-step)
Run `node server.js vocab-ai` to generate prompt, then `node server.js vocab-ai-apply <file.json>` to apply.

### Translate (automated, free)
Run `node server.js translate` to:
- Clean transcript markdown
- Generate missing vocabulary files (`vocab/VIDEO_ID_vocab.json`)
- Add rough machine translations for vocabulary words (via translate-shell)
- Create translation placeholders if missing

**Note:** This produces rough word translations for quick lookup. For high-quality sentence translations, see `TRANSLATE.md`.

### Lint
Run `node server.js lint` to check and clean up transcripts:

- **Frontmatter validation** - Ensures title and source fields are present
- **Orphaned files** - Finds vocab/translation files without matching transcripts
- **Empty translations** - Identifies translation files that need actual content
- **Vocabulary cleanup** - Removes A1-A2 level words from vocab files

### Vocab (update only)
Run `node server.js vocab` to update vocabulary files only (skip cleaning/translation placeholders).

## Translation Methods

| Command | What it does | Quality | Cost |
|---------|--------------|---------|------|
| **`translate`** | Clean + AI vocab | ⭐⭐⭐⭐⭐ | $0 |
| **`translate --free`** | Clean + shell vocab | ⭐⭐⭐ | Free |
| **`vocab-auto`** | AI vocab only | ⭐⭐⭐⭐⭐ | $0 |
| **`vocab-ai`** | Generate AI prompt | ⭐⭐⭐⭐⭐ | $0 |
| **`vocab`** | Shell vocab only | ⭐⭐⭐ | Free |

**Default workflow:** Just use `node server.js translate` — it does everything with AI!
