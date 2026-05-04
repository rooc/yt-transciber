# Complete Workflow

## Quick Start

### 1. Add Transcript
```bash
# Place in transcripts/ folder and rename to video ID
mv "Video Title.md" transcripts/VIDEO_ID.md
```

### 2. Generate Files
```bash
node server.js translate
```

### 3. Get Vocab Translations (Choose One)

**Option A: opencode-go**
```bash
node server.js vocab-auto
# Follow terminal instructions
```

**Option B: Any AI (ChatGPT, Claude, Gemini)**
```bash
node server.js vocab-ai
# Copy VOCAB_AI_PROMPT.md to AI
# Save JSON response as ai-response.json
node server.js vocab-ai-apply ai-response.json
```

**Option C: Free Automated**
```bash
# Install: sudo apt install translate-shell
node server.js vocab
```

### 4. Watch
```bash
node server.js
```
Open http://localhost:7070

---

## Obsidian Clipper Setup

1. Install extension (Chrome/Firefox)
2. Set vault to this project folder
3. Set folder to `transcripts`
4. Clip YouTube videos → auto-saves with title + URL
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

---

## Translation Methods

| Method | Quality | Time | Cost |
|--------|---------|------|------|
| opencode-go | ⭐⭐⭐⭐⭐ | 5 min | $0 |
| Any AI | ⭐⭐⭐⭐⭐ | 5 min | $0 |
| translate-shell | ⭐⭐⭐ | 1 min | Free |

---

**Not using opencode-go?** See [FOR_NON_OPENCODE_USERS.md](FOR_NON_OPENCODE_USERS.md)

**Need help?** See [DOCS_SUMMARY.md](DOCS_SUMMARY.md)
