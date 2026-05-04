# AI Vocabulary Translation Workflow

## Overview
Generate high-quality vocabulary translations using Qwen3.5 Plus via opencode-go.

**Cost:** $0 (covered by your $10/month opencode-go subscription)  
**Time:** ~5 minutes per video  
**Quality:** Contextual translations with part-of-speech tags and examples

---

## Step-by-Step Workflow

### Step 1: Generate AI Prompt
```bash
node server.js vocab-ai
```

This creates `VOCAB_AI_PROMPT.md` with all untranslated words grouped by video.

**Output:**
```
=== AI VOCAB REPORT ===
📊 Total unique words to translate: 1189
📝 AI prompt saved to: VOCAB_AI_PROMPT.md
```

---

### Step 2: Copy Prompt to AI

1. Open `VOCAB_AI_PROMPT.md`
2. Copy the entire content
3. Paste to your AI assistant (Qwen3.5 Plus via opencode-go)

**Example AI prompt:**
```
Translate these Spanish words to English with context from YouTube video transcripts.
Respond ONLY with a valid JSON object...
```

---

### Step 3: Save AI Response

Save the AI's JSON response to a file, e.g., `ai-translations.json`

**Example AI response:**
```json
{
  "gato": {
    "translation": "cat",
    "pos": "noun"
  },
  "correr": {
    "translation": "to run",
    "pos": "verb"
  },
  "banco": {
    "translation": "bank",
    "pos": "noun"
  }
}
```

---

### Step 4: Apply Translations
```bash
node server.js vocab-ai-apply ai-translations.json
```

**Output:**
```
=== AI VOCAB APPLY REPORT ===
✅ Applied 1189/1189 translations
📁 Updated 5 vocab file(s)
```

---

### Step 5: Verify
```bash
node server.js
```

Open http://localhost:7070 and hover over vocabulary words to see:
- English translation
- Part of speech (if provided)

---

## Tips

### Batch Processing
- Process all videos at once for efficiency
- The prompt groups words by video for better context

### Quality Control
- Review AI output before applying
- Fix any obvious errors in the JSON
- Add missing part-of-speech tags manually if needed

### Incremental Updates
- Run `vocab-ai` anytime to find new untranslated words
- Only translate what's missing
- Already-translated words are preserved

### Cost Management
- ~1000 words ≈ 1 API call
- Your subscription: 50,500 requests/month
- Typical video: 200-300 words
- **Estimated cost per video: $0** (well within subscription limits)

---

## Troubleshooting

### "Words not found in any vocab file"
The AI translated words that don't exist in your vocab files yet. Run `node server.js translate` first to create base vocab files, then apply AI translations.

### JSON Parse Error
Ensure the AI response is valid JSON:
- No markdown code blocks (```json ... ```)
- No extra text before/after the JSON object
- Proper comma placement

### Missing Translations
Some words might not get translated if the AI couldn't determine the meaning. These will remain as `[translation needed]` and can be translated in the next batch.

---

## Comparison: AI vs translate-shell

| Feature | AI (vocab-ai) | translate-shell |
|---------|---------------|-----------------|
| Context | ✅ Understands context | ❌ Literal only |
| Part of speech | ✅ Included | ❌ None |
| Examples | ✅ Optional | ❌ None |
| Idioms | ✅ Handled well | ❌ Often wrong |
| Speed | ~5 min (manual) | ~1 min (auto) |
| Cost | $0 (subscription) | Free |

**Recommendation:** Use AI for best quality, translate-shell for quick drafts.
