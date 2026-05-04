# For Non-opencode Users

This project uses **AI for vocabulary translations**. Works with any AI service!

---

## Quick Workflow

```bash
# 1. Add transcript to transcripts/ folder

# 2. Prepare for AI
node server.js translate
# → Creates VOCAB_AI_PROMPT.md

# 3. Copy VOCAB_AI_PROMPT.md to your AI
# - ChatGPT: https://chat.openai.com (free)
# - Claude: https://claude.ai (free)
# - Gemini: https://gemini.google.com (free)

# 4. Save AI's JSON response as: ai-response.json

# 5. Apply translations
node server.js vocab-ai-apply ai-response.json

# 6. Watch!
node server.js
```

**Total time:** ~5 minutes  
**Cost:** $0 (use free AI tiers)

---

## AI Prompt Example

The `VOCAB_AI_PROMPT.md` file looks like this:

```
# AI Vocabulary Translation

Translate these 250 Spanish words to English.

## Format
Respond ONLY with valid JSON.

## JSON Structure
{
  "gato": { "translation": "cat", "pos": "noun" },
  "correr": { "translation": "to run", "pos": "verb" }
}

## Words to Translate
gato, perro, casa, correr, ...
```

---

## AI Response Example

Save this as `ai-response.json`:

```json
{
  "gato": { "translation": "cat", "pos": "noun" },
  "perro": { "translation": "dog", "pos": "noun" },
  "casa": { "translation": "house", "pos": "noun" },
  "correr": { "translation": "to run", "pos": "verb" }
}
```

---

## Using Free AI Tiers

### ChatGPT Free
1. Go to https://chat.openai.com
2. Paste `VOCAB_AI_PROMPT.md` content
3. Copy JSON response
4. Save as `ai-response.json`

### Claude Free
1. Go to https://claude.ai
2. Paste prompt
3. Copy JSON response
4. Save as `ai-response.json`

### Gemini Free
1. Go to https://gemini.google.com
2. Paste prompt
3. Copy JSON response
4. Save as `ai-response.json`

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
