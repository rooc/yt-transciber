# Complete Workflow

## Quick Start

### 1. Add Transcript
```bash
# Place in transcripts/ folder and rename to video ID
mv "Video Title.md" transcripts/VIDEO_ID.md
```

### 2. Prepare for AI
```bash
node server.js translate
```

**Creates:**
- Cleaned transcript
- `*_translation.md` placeholder
- `*_vocab.json` with `[translation needed]`
- `VOCAB_AI_PROMPT.md` (AI prompt)

### 3. Get AI Translations
1. Open `VOCAB_AI_PROMPT.md`
2. Copy entire content
3. Paste to AI:
   - **ChatGPT:** https://chat.openai.com
   - **Claude:** https://claude.ai
   - **Qwen3.5 Plus:** `opencode run --model "opencode-go/qwen3.5-plus"`
4. Save AI's JSON response as: `ai-response.json`

### 4. Apply Translations
```bash
node server.js vocab-ai-apply ai-response.json
```

### 5. Watch
```bash
node server.js
```

Open http://localhost:7070

---

## Obsidian Clipper

1. Install extension (Chrome/Firefox)
2. Set vault to this project
3. Set folder to `transcripts`
4. Clip YouTube videos
5. Rename: `mv "Video Title.md" VIDEO_ID.md`

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Pause/Play |
| `←` / `→` | Rewind 10s |
| `S` | Sync video |
| `D` | Dual translation |
| `F` | Fullscreen |
| `L` | Mark learned |
| `⌫` | Delete transcript |

---

## Example Session

```bash
# Clip video with Obsidian
# → transcripts/Spanish Lesson.md

# Rename
mv "transcripts/Spanish Lesson.md" transcripts/ABC123xyz.md

# Prepare for AI
node server.js translate
# → VOCAB_AI_PROMPT.md created (250 words)

# Get AI translations
# 1. Copy VOCAB_AI_PROMPT.md
# 2. Paste to ChatGPT/Claude
# 3. Save response as ai-response.json

# Apply
node server.js vocab-ai-apply ai-response.json
# → Vocab updated with AI translations

# Watch
node server.js
```

**Total time:** ~5 minutes  
**Cost:** $0 (free AI tiers available)

---

**Need help?** See [FOR_NON_OPENCODE_USERS.md](FOR_NON_OPENCODE_USERS.md)
