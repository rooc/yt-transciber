# Documentation Guide

Quick reference to all documentation files in this project.

---

## For Getting Started

| File | Who It's For | What It Covers |
|------|--------------|----------------|
| **[README.md](README.md)** | Everyone | Quick start, commands, features, Obsidian Clipper setup |
| **[WORKFLOW.md](WORKFLOW.md)** | Everyone | Step-by-step workflow from transcript to watching |

---

## For Vocabulary Translation

| File | Who It's For | What It Covers |
|------|--------------|----------------|
| **[FOR_NON_OPENCODE_USERS.md](FOR_NON_OPENCODE_USERS.md)** | Non-opencode users | How to use without opencode-go (ChatGPT, Claude, translate-shell) |
| **[AI_VOCAB_WORKFLOW.md](AI_VOCAB_WORKFLOW.md)** | AI users | Detailed AI vocabulary translation workflow |

---

## For Translation Guide

| File | Who It's For | What It Covers |
|------|--------------|----------------|
| **[TRANSLATE.md](TRANSLATE.md)** | AI users | Guide for creating sentence-by-sentence translations |

---

## Quick Decision Tree

### "I just want to get started"
→ Read [README.md](README.md)

### "I don't use opencode-go"
→ Read [FOR_NON_OPENCODE_USERS.md](FOR_NON_OPENCODE_USERS.md)

### "I want the complete workflow"
→ Read [WORKFLOW.md](WORKFLOW.md)

### "I want to use AI for vocab"
→ Read [AI_VOCAB_WORKFLOW.md](AI_VOCAB_WORKFLOW.md)

### "I want to create sentence translations"
→ Read [TRANSLATE.md](TRANSLATE.md)

---

## Command Quick Reference

```bash
# Generate base files (everyone)
node server.js translate

# Get vocab translations (choose one):

# opencode-go users
node server.js vocab-auto

# Any AI users (ChatGPT, Claude, Gemini)
node server.js vocab-ai
node server.js vocab-ai-apply ai-response.json

# Free automated (requires translate-shell)
node server.js vocab

# Watch
node server.js

# Lint/check files
node server.js lint
```

---

## File Structure

```
yt-transcriber/
├── README.md                      # Start here
├── WORKFLOW.md                    # Complete workflow
├── FOR_NON_OPENCODE_USERS.md      # Non-opencode guide
├── AI_VOCAB_WORKFLOW.md           # AI vocab details
├── TRANSLATE.md                   # Sentence translation guide
├── DOCS_SUMMARY.md                # This file
├── server.js                      # Main application
├── transcripts/                   # Your video transcripts
├── vocab/                         # Vocabulary files
├── public/                        # Frontend (HTML/CSS/JS)
└── src/                           # Backend code
```

---

## Sharing This Project

When sharing with someone:

1. **They use opencode-go:**
   - Send: README.md + WORKFLOW.md
   - They use: `vocab-auto` command

2. **They don't use opencode-go:**
   - Send: FOR_NON_OPENCODE_USERS.md
   - They use: `vocab-ai` + any AI, OR `vocab` + translate-shell

Obsidian Clipper setup is in README.md (no separate guide needed).

---

## Need Help?

1. Check the relevant documentation file above
2. Run `node server.js lint` to check for issues
3. See troubleshooting sections in each guide
