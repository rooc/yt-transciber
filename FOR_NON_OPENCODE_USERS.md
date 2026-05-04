# For Non-opencode Users

This project works perfectly **without opencode-go**! You have two options:

---

## Option 1: Use Any AI (ChatGPT, Claude, Gemini) - Recommended

**Quality:** ⭐⭐⭐⭐⭐ (Best)  
**Cost:** $0 (free tiers available)  
**Time:** ~5 minutes

### Steps

```bash
# 1. Add your transcript to transcripts/ folder
# 2. Generate base files
node server.js translate

# 3. Generate AI translation prompt
node server.js vocab-ai
```

This creates `VOCAB_AI_PROMPT.md` with all words to translate.

```bash
# 4. Copy content from VOCAB_AI_PROMPT.md
# 5. Paste to your AI of choice:
#    - ChatGPT: https://chat.openai.com
#    - Claude: https://claude.ai
#    - Gemini: https://gemini.google.com
#    - Or any other AI

# Example prompt (already formatted in VOCAB_AI_PROMPT.md):
"""
Translate these Spanish words to English.
Respond ONLY with a valid JSON object.

Words to translate: gato, perro, casa, ...

Format:
{
  "gato": { "translation": "cat", "pos": "noun" },
  "perro": { "translation": "dog", "pos": "noun" }
}
"""

# 6. Save AI's JSON response as: ai-response.json

# 7. Apply translations
node server.js vocab-ai-apply ai-response.json

# 8. Watch!
node server.js
```

### Cost Breakdown

| AI Service | Cost |
|------------|------|
| ChatGPT Free | $0 (rate limited) |
| Claude Free | $0 (rate limited) |
| Gemini Free | $0 |
| ChatGPT Plus | $0 (included in $20/mo) |
| Claude Pro | $0 (included in $20/mo) |
| API usage | ~$0.01-0.03 per video |

---

## Option 2: Free Automated (translate-shell)

**Quality:** ⭐⭐⭐ (Basic)  
**Cost:** Free  
**Time:** ~1 minute

### Install translate-shell

```bash
# Ubuntu/Debian
sudo apt install translate-shell

# macOS
brew install translate-shell

# Arch Linux
sudo pacman -S translate-shell

# Or download from: https://www.soimort.org/translate-shell
```

### Run

```bash
# 1. Add your transcript to transcripts/ folder

# 2. Generate files + vocab translations
node server.js translate
```

That's it! Vocab files are generated automatically.

### Quality Comparison

| Feature | AI (Option 1) | translate-shell (Option 2) |
|---------|---------------|---------------------------|
| Context | ✅ Understands context | ❌ Literal only |
| Part of speech | ✅ Included | ❌ None |
| Idioms | ✅ Handled well | ❌ Often wrong |
| Speed | ~5 min | ~1 min |
| Cost | $0 (free tier) | Free |

---

## Complete Workflow (Non-opencode)

```bash
# === SETUP (one time) ===

# Install translate-shell (for Option 2)
sudo apt install translate-shell  # Ubuntu/Debian
brew install translate-shell      # macOS

# Or set up AI account (for Option 1)
# - ChatGPT: https://chat.openai.com (free)
# - Claude: https://claude.ai (free)
# - Gemini: https://gemini.google.com (free)


# === FOR EACH VIDEO ===

# 1. Clip video with Obsidian Clipper
# → Saves to: transcripts/Video Title.md

# 2. Rename to video ID
mv "transcripts/Video Title.md" transcripts/VIDEO_ID.md

# 3. Generate base files
node server.js translate

# 4a. Get AI translations (Option 1 - Recommended)
node server.js vocab-ai
# Copy VOCAB_AI_PROMPT.md to AI
# Save response as ai-response.json
node server.js vocab-ai-apply ai-response.json

# OR

# 4b. Use translate-shell (Option 2 - Free automated)
node server.js vocab

# 5. Watch!
node server.js
```

---

## Example Session (Using ChatGPT Free)

```bash
# 1. Add transcript
cp ~/Downloads/lesson.md transcripts/ABC123xyz.md

# 2. Generate files
node server.js translate

# 3. Generate AI prompt
node server.js vocab-ai
# → "📊 Total unique words to translate: 250"

# 4. Open VOCAB_AI_PROMPT.md
# Copy entire content

# 5. Go to https://chat.openai.com
# Paste prompt
# Copy JSON response
# Save as ai-response.json

# 6. Apply translations
node server.js vocab-ai-apply ai-response.json

# 7. Watch!
node server.js
# Open http://localhost:7070
```

**Total time:** ~5 minutes  
**Total cost:** $0 (ChatGPT free tier)

---

## Example Session (Using translate-shell)

```bash
# 1. Add transcript
cp ~/Downloads/lesson.md transcripts/ABC123xyz.md

# 2. Generate files + vocab
node server.js translate
# OR just vocab: node server.js vocab

# 3. Watch!
node server.js
```

**Total time:** ~1 minute  
**Total cost:** Free

---

## Troubleshooting

### "Command not found: translate-shell"

Install it:
```bash
sudo apt install translate-shell  # Ubuntu/Debian
brew install translate-shell      # macOS
```

Or use Option 1 (any AI).

### AI response has markdown code blocks

Some AIs wrap JSON in \`\`\`json ... \`\`\`. Remove them:

**Before:**
```json
{
  "gato": "cat"
}
```

**After (save this):**
```json
{
  "gato": "cat"
}
```

### "Words not found in any vocab file"

Run `node server.js translate` first to create base vocab files.

### AI won't give JSON

Add this to your prompt:
```
Respond ONLY with JSON. No explanations, no markdown, no code blocks.
Start with { and end with }.
```

---

## Sharing This Project

To share with someone who doesn't use opencode:

1. **Send them this file** (`FOR_NON_OPENCODE_USERS.md`)
2. **They choose:** Option 1 (any AI) or Option 2 (translate-shell)
3. **Follow the workflow** above

No opencode-go required!

---

## Comparison: opencode-go vs Non-opencode

| Feature | opencode-go | Non-opencode (Any AI) | Non-opencode (translate-shell) |
|---------|-------------|----------------------|-------------------------------|
| Setup | Already configured | Use existing AI account | Install translate-shell |
| Quality | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Cost | $10/mo subscription | $0 (free tier) | Free |
| Speed | ~5 min | ~5 min | ~1 min |
| Automation | Semi-auto | Semi-auto | Fully auto |
| Best for | Heavy users | Occasional users | Quick setup |

**Recommendation:**
- **You use opencode-go:** Use `vocab-auto` command
- **You have ChatGPT/Claude/Gemini:** Use `vocab-ai` + any AI
- **You want fully automated:** Install translate-shell, use `vocab` command

All methods produce the same result: vocabulary files for the viewer!
