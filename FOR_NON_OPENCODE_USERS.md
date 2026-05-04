# For Non-opencode Users

This project uses **AI for vocabulary translations**. Works with any AI service!

---

## Quick Workflow

```bash
# 1. Add transcript to transcripts/ folder

# 2. Prepare for AI
node server.js translate
# → Creates VOCAB_AI_PROMPT.md

# 3. Upload VOCAB_AI_PROMPT.md to your AI
# - ChatGPT: Click 📎 → Upload file → "Do what it says"
# - Claude: Drag & drop → "Follow instructions"
# - Gemini: Upload file → "Do what it says"

# 4. Save AI's JSON response as: ai-response.json

# 5. Apply translations
node server.js vocab-ai-apply ai-response.json

# 6. Watch!
node server.js
```

**Total time:** ~5 minutes  
**Cost:** $0 (use free AI tiers)

---

## Upload vs Copy/Paste

**Don't copy/paste!** Just upload the file:

| AI Service | How to Upload |
|------------|---------------|
| **ChatGPT** | Click 📎 icon → Select `VOCAB_AI_PROMPT.md` |
| **Claude** | Drag & drop file into chat |
| **Gemini** | Click 📎 → Upload file |

**What to say:**
- "Read this file and do what it says"
- "Follow the instructions in this file"
- "Translate these words as instructed"

AI will read the file and respond with JSON automatically!

---

## Troubleshooting

### AI gives markdown code blocks
Remove the \`\`\`json wrapper, keep only the JSON object.

### AI adds explanations
Just copy the JSON part, ignore extra text.

### Rate limited on free tier
- Try a different AI service
- Wait a few minutes and try again
- Use multiple AI accounts

---

## Cost Estimates

| Service | Cost per Video | Free Tier |
|---------|---------------|-----------|
| ChatGPT Free | $0 | ✅ Yes (rate limited) |
| Claude Free | $0 | ✅ Yes (rate limited) |
| Gemini Free | $0 | ✅ Yes |
| ChatGPT Plus | $0 | Included in $20/mo |
| Claude Pro | $0 | Included in $20/mo |

**Typical video:** ~250 words = ~500 tokens = fractions of a cent

---

**Questions?** See [WORKFLOW.md](WORKFLOW.md) for complete guide.
