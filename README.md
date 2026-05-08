# Yotuscript

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

Open http://localhost:9090

---

## Features

- **Watch YouTube videos** with synchronized transcripts
- **Dual-language view** (original + English translation)
- **Interactive vocabulary** - Hover words to see translations in tooltips
- **Grammar sentences** - 3-5 clickable grammar examples per video with explanations
- **Video summaries** - 4-6 sentence summaries in Spanish with original vocabulary
- **Statistics tracking** - Auto-tracks learned videos and total watch time
- **Drag and drop** transcripts between Available and Learned panels
- **Keyboard shortcuts** for quick playback control
- **Auto-synchronized** transcript scrolling

## Setup

```bash
node server.js
```

Open http://localhost:9090

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Pause/Play |
| `←` | Rewind 10s |
| `→` | Forward 10s |
| `D` | Toggle dual translation |
| `F` | Toggle fullscreen mode |
| `L` | Toggle learned status (resets progress) |
| `R` | Toggle segment repeat mode |
| `Enter` | Replay current segment (in repeat mode) |
| `Esc` | Close popup/modal |

## Statistics

The app automatically tracks your learning progress:

- **📚 Videos Learned**: Counts when you mark a video as learned (press `L`)
- **⏱️ Watch Time**: Tracks actual viewing time in hours (starts when you play, stops when you pause)

Stats are displayed below the control buttons and persist across sessions.

## Grammar Sentences

Each video includes 3-5 grammar sentences that demonstrate B1+ Spanish structures:

- **Clickable tags** in the "Grammar sentences" panel
- **Full sentence** with English translation in popup
- **Brief explanation** of the grammar structure used
- Examples: subjunctive mood, compound tenses, relative clauses

## Video Summaries

Each video includes a **4-6 sentence summary** in Spanish:

- 📋 **Summary icon** next to video title
- **Click to open** popup with full summary
- Uses **original vocabulary** from the transcript
- Captures main ideas and key points
- Perfect for quick review before watching

## Adding Transcripts

**Note:** There are many ways to add transcripts - use whatever method works best for you! Here are some options:

### Method 1: Browser Extensions

**YouTube Transcript Copier (Firefox)**
- Install the "YouTube Transcript Copier" extension for Firefox
- Open any YouTube video and copy the transcript
- Paste into a new file and save to the transcripts folder

**Other extensions** - Any extension that can extract YouTube transcripts will work. Choose whichever fits your workflow.

### Method 2: Obsidian Clipper

1. **Install** Obsidian Web Clipper extension: [Chrome](https://chromewebstore.google.com/detail/obsidian-web-clipper) | [Firefox](https://addons.mozilla.org/en-US/firefox/addon/obsidian-web-clipper/)

2. **Clip YouTube video**:
   - Open any YouTube video
   - Click the Clipper icon → Click **Clip**
   - Save file and put it in transcripts folder

3. **Rename file** to video ID:
   - transcripts/"Video Title.md" → transcripts/VIDEO_ID.md

**Note:** Obsidian creates transcripts as paragraphs (often with 2-5 lines of text), which isn't very usable for language learning. You may need to reformat the transcript to have one timestamp per line for the best experience.

The default template already includes title and URL, which is all you need.

### Method 3: Manual

Place transcript files in `/transcripts/` folder:

```markdown
---
title: "Video Title"
source: "https://www.youtube.com/watch?v=VIDEO_ID"
---

**0:00** First line of transcript
**0:05** Second line
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
- ✅ Extracts **multi-word phrases** (2-4 words) as primary vocabulary
- ✅ Creates **3-5 grammar sentences** with B1+ structures (you choose: 3, 4, 5, or custom)
- ✅ Writes **4-6 sentence summary** in Spanish using original vocabulary
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
# 1. Add transcript to transcripts/ folder
transcripts/VIDEO_ID.md

# 2. Tell AI to translate and create files
# "translate new"
# AI asks: "How many grammar sentences? (3, 4, 5, or custom)"

# 3. Watch and learn!
node server.js
# - Hover words for vocabulary
# - Click grammar tags for explanations
# - Click summary icon for video overview
# - Press L to mark as learned
# - Track your stats automatically
```

---

## Project Structure

```
├── transcripts/          # Spanish transcript files (.md)
│   ├── VIDEO_ID.md
│   └── VIDEO_ID_translation.md
├── vocab/               # Vocabulary files (.json)
│   └── VIDEO_ID_vocab.json
├── grammar/             # Grammar sentences (.json)
│   └── VIDEO_ID_grammar.json
├── summary/             # Video summaries (.json)
│   └── VIDEO_ID_summary.json
├── data/                # App data and exclusion lists
│   ├── a1-a2.json      # Basic words to exclude
│   ├── proper-nouns.json # Names/countries to exclude
│   ├── manual-exclude.json # Manual exclusions
│   ├── learned.json    # Learned videos list
│   ├── progress.json   # Video progress positions
│   └── stats.json      # Learning statistics
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

## License

MIT
