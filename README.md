# YT-trans

A YouTube video transcript viewer with bilingual support.

## Quick Start (Obsidian Clipper)

```bash
# 1. Clip YouTube video with Obsidian Clipper → saves to transcripts/

# 2. Rename file to video ID
mv transcripts/Video\ Title.md transcripts/VIDEO_ID.md

# 3. Generate vocab + translation files
node server.js translate

# 4. Get AI vocabulary translations (choose one):

#    Option A: opencode-go users
node server.js vocab-auto

#    Option B: Any AI (ChatGPT, Claude, Gemini)
node server.js vocab-ai
# Then copy VOCAB_AI_PROMPT.md to your AI, save response, apply with:
node server.js vocab-ai-apply ai-response.json

#    Option C: Free automated (install translate-shell first)
node server.js vocab

# 5. Watch!
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

### Vocab (Free, Automated)
```bash
# Install translate-shell first:
# Ubuntu/Debian: sudo apt install translate-shell
# macOS: brew install translate-shell

node server.js vocab
```

**Cost:** Free  
**Time:** ~1 minute  
**Quality:** Basic literal translations (word-level, no context)

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

## Translation Systems

This project has three complementary translation options:

| | **`vocab-auto`** | **`vocab-ai`** | **`vocab`** |
|---|---|---|---|
| **For** | opencode-go users | Any AI (ChatGPT, Claude, etc.) | Everyone (free) |
| **What it does** | AI vocab (automated) | AI vocab (manual) | Auto vocab (translate-shell) |
| **Output** | `vocab/*_vocab.json` | `vocab/*_vocab.json` | `vocab/*_vocab.json` |
| **Quality** | ⭐⭐⭐⭐⭐ Contextual + POS | ⭐⭐⭐⭐⭐ Contextual + POS | ⭐⭐⭐ Literal, word-level |
| **Cost** | $0 (subscription) | $0 (free AI tier) | Free |
| **Speed** | ~5 min | ~5 min | ~1 min |
| **When to use** | You have opencode-go | You have any AI account | Quick free setup |

**Not using opencode-go?** See [FOR_NON_OPENCODE_USERS.md](FOR_NON_OPENCODE_USERS.md) for complete setup guide.

**Recommended workflow:**
1. **opencode-go users:** `node server.js vocab-auto`
2. **Non-opencode users:** `node server.js vocab-ai` + any AI (ChatGPT, Claude, Gemini)
3. **Free automated:** Install translate-shell, then `node server.js vocab`
