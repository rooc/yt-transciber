# YT-trans

A YouTube video transcript viewer with bilingual support.

## Quick Start (New AI Workflow)

```bash
# 1. Add transcript manually
mv "Video Title.md" transcripts/VIDEO_ID.md

# 2. Tell AI to translate (just say: "translate new")
# AI reads OPENCODE.md and creates both files automatically

# 3. Watch!
node server.js
```

Open http://localhost:7070

---

## Features

- Watch YouTube videos with synchronized transcripts
- Toggle dual-language view (original + English translation)
- Drag and drop transcripts between Available and Learned panels
- Keyboard shortcuts for playback control
- Hover transcript to see vocabulary translation
- Auto-synchronized transcript scrolling

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
| `→` | Forward 10s |
| `D` | Toggle dual translation |
| `F` | Toggle fullscreen mode |
| `L` | Toggle learned status (resets progress) |

## Adding Transcripts

### Method 1: Obsidian Clipper (Recommended)

1. **Install** Obsidian Web Clipper extension: [Chrome](https://chromewebstore.google.com/detail/obsidian-web-clipper) | [Firefox](https://addons.mozilla.org/en-US/firefox/addon/obsidian-web-clipper/)

2. **Clip YouTube video**:
   - Open any YouTube video
   - Click the Clipper icon → Click **Clip**
   - Save file and put it in transcipts folder

3. **Rename file** to video ID:
   - transcripts/"Video Title.md" transcripts/VIDEO_ID.md

The default template already includes title and URL, which is all you need.

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

## AI Translation

The workflow uses AI directly via `OPENCODE.md`:

### Simple Steps:

1. **Add transcript** to `transcripts/` folder
2. **Tell AI**: "translate new"
3. **AI automatically creates**:
   - `VIDEO_ID_translation.md` — Full English translation
   - `vocab/VIDEO_ID_vocab.json` — Vocabulary with contextual translations

### What AI Does:

- ✅ Translates naturally (not word-for-word)
- ✅ Preserves speaker's tone and style
- ✅ Explains cultural references
- ✅ Extracts B1+ vocabulary only
- ✅ Provides contextual translations
- ✅ Excludes basic words, proper nouns, and English loanwords

### OPENCODE.md

The `OPENCODE.md` file contains all instructions for the AI. It specifies:
- File format and structure
- Translation guidelines
- Vocabulary extraction rules
- Word exclusions (A1-A2, proper nouns, etc.)

Just tell the AI to read it and translate!

## AI Commands

All operations are AI-driven through `OPENCODE.md`:

### Translate
**Command:** `"translate new"`

Translates all untranslated transcripts automatically.

### Check / Lint
**Command:** `"check files"` or `"lint"`

Validates and cleans up:
- Frontmatter completeness
- Orphaned files
- Empty translations  
- Vocabulary cleanup

### Manage Learned Videos

Drag and drop transcript tags between panels:
- **Available transcripts** → **Learned transcripts**: Mark as learned (resets progress)
- **Learned transcripts** → **Available transcripts**: Unmark as learned (resets progress)

Or use the `L` keyboard shortcut to toggle the current video.

### Delete Transcript
**Command:** `"delete VIDEO_ID"` or `"remove VIDEO_ID"` (AI only)

Removes a transcript and all associated files (translation, vocab, progress, learned status). This operation is only available through AI commands, not via the web interface.

## Workflow

```bash
# 1. Add transcript
transcripts/VIDEO_ID.md

# 2. Tell AI to translate
# "translate new"

# 3. Watch
node server.js
```

---

## Project Structure

```
├── transcripts/          # Spanish transcript files (.md)
│   ├── VIDEO_ID.md
│   └── VIDEO_ID_translation.md
├── vocab/               # Vocabulary files (.json)
│   └── VIDEO_ID_vocab.json
├── data/                # Exclusion lists
│   ├── a1-a2.json      # Basic words to exclude
│   ├── proper-nouns.json # Names/countries to exclude
│   └── manual-exclude.json # Manual exclusions
├── src/                 # Source code
│   ├── routes.js       # HTTP routes
│   ├── store.js        # Data access layer
│   ├── config.js       # Configuration
│   └── exclusions.js   # Word filtering
├── public/              # Web UI files
│   ├── index.html
│   ├── app.js
│   └── style.css
├── OPENCODE.md         # AI instructions (ALL operations)
└── server.js           # Entry point (web server only)
```

## Troubleshooting

**Translation not showing?**
- Check that `VIDEO_ID_translation.md` exists
- Verify timestamps match the original file

**Vocabulary not appearing?**
- Check `vocab/VIDEO_ID_vocab.json` exists
- Ensure words are B1+ level (not in exclusion lists)

**Server won't start?**
- Check port 7070 is available
- Verify Node.js is installed

## License

MIT
