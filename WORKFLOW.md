# Complete Workflow

## Quick Start

### 1. Add Transcript
```bash
# Place in transcripts/ folder and rename to video ID
mv "Video Title.md" transcripts/VIDEO_ID.md
```

### 2. Generate Files + AI Vocab
```bash
# Default: AI translations (recommended)
node server.js translate

# Or free: translate-shell
node server.js translate --free
```

### 3. Watch
```bash
node server.js
```
Open http://localhost:7070

---

**That's it!** The `translate` command does everything:
- ✅ Cleans transcripts
- ✅ Creates translation placeholders
- ✅ Generates AI vocabulary translations

**Optional commands:**
- `vocab-auto` — Re-translate vocab with AI (semi-automated)
- `vocab-ai` — Generate AI prompt for manual translation
- `vocab` — Free vocab with translate-shell

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
| `translate` (AI) | ⭐⭐⭐⭐⭐ | 5 min | $0 |
| `translate --free` | ⭐⭐⭐ | 1 min | Free |

---

**Not using opencode-go?** See [FOR_NON_OPENCODE_USERS.md](FOR_NON_OPENCODE_USERS.md)

**Need help?** See [DOCS_SUMMARY.md](DOCS_SUMMARY.md)
