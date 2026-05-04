# AI Transcript Translation Instructions

You are translating Spanish YouTube transcripts to English. Follow these instructions **exactly**.

---

## Quick Workflow

**Simple command:** Just say "**translate new**" to translate all untranslated transcripts.

Or manually:
1. **Find** transcript files in `transcripts/` folder (e.g., `087XVp3JIpk.md`)
2. **Skip** if `[ID]_translation.md` already exists
3. **Create** two files for each new transcript:
   - `transcripts/[ID]_translation.md` — Full English translation
   - `vocab/[ID]_vocab.json` — Vocabulary with contextual translations

---

## Step 1: Identify Files to Process

### ✅ Process these files:
- Files in `transcripts/` folder
- End with `.md`
- Do NOT contain `_translation` in filename
- Do NOT have a matching `[ID]_translation.md`

### ❌ Skip these files:
- `*_translation.md` (already translated)
- Files without YouTube source URL
- Non-transcript markdown files (README, etc.)

### Extract Video ID:
From filename or source URL:
```
Filename: 087XVp3JIpk.md → Video ID: 087XVp3JIpk
Source: https://www.youtube.com/watch?v=087XVp3JIpk → Video ID: 087XVp3JIpk
```

---

## Step 2: Parse Transcript Format

**Input format:**
```markdown
---
title: "Video Title in Spanish"
source: "https://www.youtube.com/watch?v=VIDEO_ID"
---

**0:00** · Primera línea en español
**0:05** · Segunda línea en español
**1:23** · Tercera línea en español
```

**Timestamp formats:**
- `**M:SS**` — minutes:seconds (most common)
- `**H:MM:SS**` — hours:minutes:seconds (for long videos)

---

## Step 3: Create Translation File

**Output:** `transcripts/[VIDEO_ID]_translation.md`

```markdown
---
title: "Video Title in Spanish (English Translation)"
source: "https://www.youtube.com/watch?v=VIDEO_ID"
---

**0:00** · First line in English
**0:05** · Second line in English
**1:23** · Third line in English
```

### Translation Guidelines

**DO:**
- ✅ Translate naturally, like a human speaker
- ✅ Preserve the speaker's tone (casual, formal, humorous, etc.)
- ✅ Keep cultural references clear (add brief context if needed)
- ✅ Maintain timestamp alignment with original Spanish
- ✅ Use proper English punctuation and capitalization
- ✅ Translate idioms to their English equivalents

**DON'T:**
- ❌ Translate word-for-word (sounds robotic)
- ❌ Skip sentences or paragraphs
- ❌ Change the meaning or add opinions

**Example:**
```
Spanish: **0:15** · ¡Qué padre! Vamos al cine.
English: **0:15** · How cool! Let's go to the movies.

Spanish: **1:30** · Estoy hasta la madre de esto.
English: **1:30** · I'm fed up with this. (Mexican slang)
```

---

## Step 4: Create Vocabulary File

**Output:** `vocab/[VIDEO_ID]_vocab.json`

```json
{
  "palabra": {
    "translation": "english meaning",
    "pos": "part of speech",
    "context": "original sentence or phrase"
  }
}
```

### Word Extraction Rules

**Extract words that are:**
- ✅ B1 level or higher (intermediate to advanced)
- ✅ Specific to the topic/context
- ✅ Idiomatic expressions
- ✅ Regional slang or colloquialisms
- ✅ Technical or specialized vocabulary

**DO NOT extract (skip these):**

#### 1. Basic A1-A2 Words
Read `data/a1-a2.json` for the complete exclusion list (~680 words). These include:
- Articles: el, la, los, las, un, una, unos, unas
- Pronouns: yo, tú, él, ella, nosotros, vosotros, ellos, me, te, se, nos, os
- Basic verbs: ser, estar, tener, haber, hacer, poder, decir, ir, ver, dar, saber, querer
- Common adjectives: bueno, malo, grande, pequeño, alto, bajo, nuevo, viejo
- Time words: hoy, ayer, mañana, ahora, siempre, nunca, cuando, donde
- Conjunctions: y, o, pero, porque, si, aunque, mientras
- Basic nouns: casa, agua, comida, día, tiempo, año, persona, cosa

#### 2. Proper Nouns
Read `data/proper-nouns.json` for exclusions:
- Country names: España, México, Estados Unidos, Argentina, etc.
- Human names: María, Juan, Carlos, Ana, José, etc.
- Place names: Amazonia, Alaska, Arizona, etc.

#### 3. Manual Exclusions
Read `data/manual-exclude.json` for additional exclusions:
- podcast, español, okay, tren, mafia, washington, etc.

#### 4. English Loanwords
Skip words that are the same or similar in English:
- podcast, internet, chat, online, video, audio
- okay, cool, boom, surprise, obviously, useful, make sense

#### 5. Very Short Words
- Skip words with 3 or fewer letters (unless important)
- Skip verb conjugations of basic verbs (tengo, tienes, tiene → all from "tener")

### Translation Quality

**For each vocabulary word:**

1. **translation** — Use 1-5 words, lowercase
   - Good: "masticar" → "to chew"
   - Bad: "masticar" → "chew, masticate, grind food with teeth"

2. **pos** — Part of speech (optional but helpful)
   - noun, verb, adjective, adverb, expression, slang

3. **context** — The original Spanish phrase where the word appears (optional)
   - Helps remember the usage later

**Example vocab entry:**
```json
{
  "masticar": {
    "translation": "to chew",
    "pos": "verb",
    "context": "para masticar alimentos duros"
  },
  "hasta la madre": {
    "translation": "fed up / completely full",
    "pos": "expression",
    "context": "Mexican slang - estar hasta la madre de algo"
  },
  "muela del juicio": {
    "translation": "wisdom tooth",
    "pos": "noun",
    "context": "los dientes que salen cuando tenemos más sabiduría"
  }
}
```

---

## Step 5: File Creation

### Create Both Files

For each transcript, create **both** files:

1. **Translation file** in `transcripts/` folder
2. **Vocab file** in `vocab/` folder

### Naming Convention

```
transcripts/087XVp3JIpk.md          ← Original (you read this)
transcripts/087XVp3JIpk_translation.md  ← Translation (you create this)
vocab/087XVp3JIpk_vocab.json       ← Vocabulary (you create this)
```

---

## Example: Complete Translation

### Input: `transcripts/087XVp3JIpk.md`
```markdown
---
title: "Un diente menos"
source: "https://www.youtube.com/watch?v=087XVp3JIpk"
---

**0:00** · Hola a todos y bienvenidos a un nuevo episodio
**0:05** · de nuestro podcast para aprender español
**0:10** · aquí hablamos español de una manera no muy rápida
```

### Output: `transcripts/087XVp3JIpk_translation.md`
```markdown
---
title: "Un diente menos (English Translation)"
source: "https://www.youtube.com/watch?v=087XVp3JIpk"
---

**0:00** · Hello everyone and welcome to a new episode
**0:05** · of our podcast to learn Spanish
**0:10** · here we speak Spanish in a not very fast way
```

### Output: `vocab/087XVp3JIpk_vocab.json`
```json
{
  "bienvenidos": {
    "translation": "welcome",
    "pos": "adjective"
  },
  "episodio": {
    "translation": "episode",
    "pos": "noun"
  },
  "manera": {
    "translation": "way / manner",
    "pos": "noun"
  }
}
```

---

## Contextual Translation Tips

**Same word, different contexts:**

| Spanish | Context | English Translation |
|---------|---------|---------------------|
| **sacar** | dental | to extract (a tooth) |
| **sacar** | general | to take out |
| **sacar** | photos | to take (a photo) |
| **diente** | anatomy | tooth |
| **diente** | garlic | clove |
| **raíz** | tooth | root |
| **raíz** | plant | root |
| **raíz** | math | square root |

**Always consider the context when translating vocabulary!**

---

## Quality Checklist

Before finishing, verify:

- [ ] Translation file has same timestamps as original
- [ ] All sentences are translated (no `[TRANSLATION NEEDED]` placeholders)
- [ ] Vocabulary excludes A1-A2 words (check `data/a1-a2.json`)
- [ ] Vocabulary excludes proper nouns (check `data/proper-nouns.json`)
- [ ] Vocabulary excludes manual exclusions (check `data/manual-exclude.json`)
- [ ] Vocabulary translations are contextual (not dictionary definitions)
- [ ] JSON is valid (proper commas, quotes, brackets)
- [ ] Files are saved in correct folders

---

## Common Mistakes to Avoid

❌ **Including basic words:**
- Don't add: "hola", "adiós", "gracias", "por favor", "bien", "mal"
- Do add: "bienvenidos", "episodio", "masticar", "sabiduría"

❌ **Literal translations:**
- Don't: "I have hunger" (from "tengo hambre")
- Do: "I'm hungry"

❌ **Missing context:**
- Don't: "raíz" → "root" (too vague)
- Do: "raíz" → "root (of tooth)" or "root (of plant)"

❌ **Inconsistent timestamps:**
- Don't change timestamps from original
- Do keep exact same format: `**M:SS**` or `**H:MM:SS**`

---

## When You're Done

After creating the files:

1. **Confirm** both files were created successfully
2. **List** what you created:
   ```
   ✅ Created: transcripts/087XVp3JIpk_translation.md
   ✅ Created: vocab/087XVp3JIpk_vocab.json
   ```
3. **Ask** if you should continue with more transcripts

---

## Summary

**Your job:**
1. Read `transcripts/[ID].md`
2. Create `transcripts/[ID]_translation.md` (full English translation)
3. Create `vocab/[ID]_vocab.json` (B1+ vocabulary with context)
4. Skip files that already have translations
5. Exclude basic words (see `data/a1-a2.json`), proper nouns (see `data/proper-nouns.json`), and manual exclusions (see `data/manual-exclude.json`)

**Goal:** Help language learners understand Spanish YouTube videos with accurate, contextual translations.

---

## Lint & Cleanup Commands

In addition to translation, you can also run maintenance checks. Just say the command:

### "check files" or "lint"

Performs validation and cleanup:

**What it checks:**
1. **Frontmatter validation** - Every transcript must have:
   - `title:` field
   - `source:` field with YouTube URL
2. **Orphaned files** - Vocab/translation files without matching transcript
3. **Empty translations** - Translation files with `[TRANSLATION NEEDED]` placeholders
4. **Vocabulary cleanup** - Remove A1-A2 words from vocab files

**How to run:**
Just say: `"check files"` or `"lint"`

The AI will:
- Scan all files in `transcripts/` and `vocab/`
- Report any issues found
- Optionally fix them (with your approval)

**Example report:**
```
=== LINT REPORT ===

✅ All transcripts have complete frontmatter
✅ No orphaned files
⚠️  2 translation(s) need content:
   - NEWVIDEO1_translation.md
   - NEWVIDEO2_translation.md
🧹 Cleaned 1 vocabulary file(s):
   - VIDEO1_vocab.json: removed 3/150 words

=== LINT COMPLETE ===
```

**Auto-fix options:**
- `"fix frontmatter"` - Add missing title/source fields
- `"clean vocab"` - Remove A1-A2 words from all vocab files
- `"remove orphans"` - Delete orphaned vocab/translation files

---

### Delete Transcript
**Command:** `"delete VIDEO_ID"` or `"remove VIDEO_ID"`

Removes a transcript and all associated files:
- `transcripts/VIDEO_ID.md`
- `transcripts/VIDEO_ID_translation.md`
- `vocab/VIDEO_ID_vocab.json`
- Progress data
- Learned status

**How to use:**
Just say: `"delete 087XVp3JIpk"` or `"remove Psb9g9UxqZs"`

The AI will:
- Confirm which files will be deleted
- Ask for your confirmation
- Delete all associated files
- Report what was removed

**Note:** This cannot be undone! Make sure you want to delete before confirming.

---

**Ready to work! Just say:**
- `"translate new"` - Translate all new transcripts
- `"check files"` - Run validation and cleanup
- `"delete VIDEO_ID"` - Remove a transcript
