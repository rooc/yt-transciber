# AI Transcript Translation Instructions

You are translating Spanish YouTube transcripts to English. Follow these instructions **exactly**.

---

## Quick Workflow

**Simple command:** Just say "**translate new**" to translate all untranslated transcripts.

**Automatic Validation:** Every input file is validated before translation starts. Files must have complete frontmatter (title + source URL) and proper timestamp format. See "Step 0: Input Validation" below for details.

**Important:** When extracting vocabulary, prioritize **multi-word phrases (2-4 words)** over single words. Phrases like "hacer caso", "en pocas palabras", "sistema inmunitario" are more useful than individual words. See vocabulary extraction rules below for details.

**Before translating, ask for grammar sentence count using clickable options:**

Present these options to the user:
- **3 sentences** (default/recommended)
- **4 sentences**
- **5 sentences**
- **Custom number** (user specifies)

Wait for user selection before proceeding with translation.

Or manually:
1. **Find** transcript files in `transcripts/` folder (e.g., `087XVp3JIpk.md`)
2. **Skip** if `[ID]_translation.md` already exists
3. **Create** three files for each new transcript:
   - `transcripts/[ID]_translation.md` — Full English translation
   - `vocab/[ID]_vocab.json` — Vocabulary with contextual translations
   - `grammar/[ID]_grammar.json` — Grammar sentences with explanations

---

## Step 0: Input Validation (REQUIRED Before Translation)

**CRITICAL:** Before starting any translation, the input file MUST pass ALL validation checks below. If any check fails, stop and report the issue.

### ✅ Validation Checklist (MUST PASS ALL):

1. **File Location & Extension**
   - [ ] File is in `transcripts/` folder
   - [ ] File ends with `.md` extension
   - [ ] File does NOT contain `_translation` in filename
   - [ ] File does NOT have a matching `[ID]_translation.md` already

2. **Frontmatter Required Fields**
   - [ ] Has `title:` field with non-empty value
   - [ ] Has `source:` field with valid YouTube URL (format: `https://www.youtube.com/watch?v=VIDEO_ID`)

3. **Content Format**
   - [ ] Has at least one timestamped line (format: `**M:SS**` or `**H:MM:SS**`)
   - [ ] Contains Spanish text content (not empty)

### ❌ Skip These Files (Do Not Process):
- `*_translation.md` files (already translated)
- Files without YouTube source URL in frontmatter
- Files missing required frontmatter fields (title or source)
- Non-transcript markdown files (README, TODO, etc.)
- Files with invalid or missing timestamps

### Validation Failure Messages:

If validation fails, report exactly what's wrong:
```
❌ VALIDATION FAILED: transcripts/VIDEO_ID.md
   - Missing: title field in frontmatter
   ❌ CANNOT PROCEED WITH TRANSLATION
```

```
❌ VALIDATION FAILED: transcripts/VIDEO_ID.md
   - Invalid source URL: "https://example.com/video"
   - Expected: YouTube URL (https://www.youtube.com/watch?v=...)
   ❌ CANNOT PROCEED WITH TRANSLATION
```

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

**0:00** Primera línea en español
**0:05** Segunda línea en español
**1:23** Tercera línea en español
```

**Timestamp formats:**
- `**M:SS**` — minutes:seconds (most common)
- `**H:MM:SS**` — hours:minutes:seconds (for long videos)

---

## Step 2b: Format Conversion (If Needed)

Some transcripts use an alternative "copy-paste" format and must be converted to the standard "obsidian" format before translation.

### Format Types:

**"obsidian" format (default):**
```markdown
---
title: "Video Title in Spanish"
source: "https://www.youtube.com/watch?v=VIDEO_ID"
---

**0:00** Primera línea en español
**0:05** Segunda línea en español
**1:23** Tercera línea en español
```

**"copy-paste" format:**
```markdown
---
title: "Video Title in Spanish"
source: "https://www.youtube.com/watch?v=VIDEO_ID"
type: "copy-paste"
---

Section Name
0:00
Text line 1
0:05
Text line 2
0:10
Text line 3
```

### Conversion Rules:

**If `type: "copy-paste"` is present in frontmatter:**
1. **Remove** the `type: "copy-paste"` line from frontmatter
2. **Convert** alternating timestamp/text lines to inline format:
   - Input: `0:00` followed by newline, then `Text line`
   - Output: `**0:00** Text line`
3. **Remove artifacts:**
   - Section headers (lines without timestamps that precede timestamps) - DELETE these
   - Audio markers like `[música]`, `[risas]`, `[aplausos]` - DELETE these
   - Empty lines between timestamped entries - DELETE these
 4. **Final format should be:** Only frontmatter + timestamped lines (`**M:SS** text`)

**Example conversion:**
```
Input:
---
title: "Video Title"
source: "https://www.youtube.com/watch?v=ID"
type: "copy-paste"
---

Intro
0:00
99% de las especies que han habitado la [música]
0:03
Tierra ya se extinguieron
Las Extinciones
0:06
Nueva sección aquí

Output:
---
title: "Video Title"
source: "https://www.youtube.com/watch?v=ID"
---

**0:00** 99% de las especies que han habitado la
**0:03** Tierra ya se extinguieron
**0:06** Nueva sección aquí
```

**Note:** Section headers ("Intro", "Las Extinciones") and audio markers (`[música]`) are removed.

**Files without `type` field are assumed to be "obsidian" format and don't need conversion.**

---

## Step 3: Create Translation File

**Output:** `transcripts/[VIDEO_ID]_translation.md`

```markdown
---
title: "Video Title in Spanish (English Translation)"
source: "https://www.youtube.com/watch?v=VIDEO_ID"
---

**0:00** First line in English
**0:05** Second line in English
**1:23** Third line in English
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
Spanish: **0:15** ¡Qué padre! Vamos al cine.
English: **0:15** How cool! Let's go to the movies.

Spanish: **1:30** Estoy hasta la madre de esto.
English: **1:30** I'm fed up with this. (Mexican slang)
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

### Vocabulary Extraction Rules (DEFAULT FOR ALL TRANSLATIONS)

**⚠️ CRITICAL:** You MUST extract multi-word phrases (2-4 words) as the PRIMARY vocabulary. Single words are secondary.

**Extract BOTH single words AND multi-word phrases:**

#### Single Words (B1+ LEVEL)
- Individual words at B1 level or higher
- Technical/specialized terms

**⚠️ IMPORTANT:** Vocabulary selection is based on **B1+ GRAMMAR COMPLEXITY**, not just word difficulty. This means:
- **Exclude** simple A1-A2 words when used in basic tenses (present, preterite)
- **INCLUDE** A1-A2 words when they appear in **B1+ grammatical structures** (subjunctive, conditional, compound tenses, etc.)

#### Multi-Word Phrases (2-4 words) - HIGH PRIORITY
These are often MORE useful than single words. **Extract phrases that demonstrate B1+ grammar, even if individual words are basic:**

**Complex Verb Phrases (2-3 words) - B1+ GRAMMAR RULE:**
Extract 2-3 word phrases containing **complex verb tenses and grammatical structures** EVEN if individual words are A1-A2 level. These demonstrate B1+ grammar and are valuable for learning:

**Include phrases with these B1+ structures:**
- **Subjunctive (present)**: "sin haberla visto" (without having seen her), "que tú digas" (that you say), "cuando vengas" (when you come)
- **Imperfect subjunctive**: "si tuviera" (if I had), "quisiera que fuera" (I would like it to be), "ojalá supiera" (I wish I knew) — very common in spoken Spanish, always extract
- **Past perfect subjunctive**: "si hubiera sabido" (if I had known), "ojalá hubiera podido" (I wish I could have)
- **Conditional**: "lo haría" (I would do it), "querrías venir" (would you want to come), "me gustaría" (I would like)
- **Future**: "lo haré" (I will do it), "qué será" (what will it be), "dirán que" (they will say that)
- **Imperfect**: "cuando era" (when I was), "lo hacía" (I used to do it), "si tenía" (if I had)
- **Compound tenses**: "había comido" (had eaten), "habría dicho" (would have said), "ha estado" (has been)
- **Conditional perfect with indirect object pronouns**: "les habría llevado" (it would have taken them), "nos habría costado" (it would have cost us), "te habría gustado" (you would have liked it) — the conditional perfect combined with indirect object pronouns creates complex B1+ verb phrases that should always be extracted
- **Gerund constructions**: "llevaba esperando" (had been waiting), "sigue hablando" (keeps talking), "sin saberlo" (without knowing it) — gerund is B1+ and often missed
- **Imperative + object pronoun**: "dime eso" (tell me that), "cuéntame" (tell me), "dámelo" (give it to me)
- **Relative clauses**: "el libro que compré" (the book that I bought), "la persona de quien hablamos" (the person we're talking about)
- **Reflexive pronouns + verbs**: "me acuerdo de" (I remember), "se olvidan de" (they forget)
- **Preposition + infinitive**: "antes de comer" (before eating), "después de llegar" (after arriving), "al entrar" (upon entering)
- **Subjunctive-triggering conjunctions + verb**: "aunque llueva" (even if it rains), "para que entiendas" (so that you understand), "a menos que vengas" (unless you come), "con tal de que funcione" (as long as it works) — the conjunction + subjunctive chunk is always extractable as a unit
- **Passive constructions** (ser/estar + past participle): "fue construido" (it was built), "está roto" (it's broken), "estaba perdido" (was lost) — distinguish from simple "es bueno / está aquí" which are excluded

**Examples to extract (B1+ grammar, even with basic words):**
- "sin haberla visto" — perfect infinitive with pronouns
- "que tú dirás" — future in subordinate clause
- "si hubiera sabido" — past perfect subjunctive
- "me lo estoy diciendo" — present progressive with double pronouns
- "lo he hecho" — present perfect (auxiliary + participle)
- "para que entiendas" — present subjunctive
- "aunque llueva" — subjunctive triggered by conjunction
- "si tuviera tiempo" — imperfect subjunctive
- "llevaba tres horas esperando" — durative past with gerund
- "cuando llegué" — preterite in time clause (advanced usage)
- "ojalá supiera" — imperfect subjunctive (very common in spoken Spanish)
- "ojalá hubiera podido" — past perfect subjunctive
- "con tal de que funcione" — subjunctive-triggering conjunction + verb
- "les habría llevado" — conditional perfect with indirect object pronoun (would have taken them)

**Key principle:** A word like "decir" (A1) in simple present "yo digo" is excluded. But "que dirás" is included because it demonstrates B1+ grammar (future in subordinate clause).

**Verb + Preposition combinations:**
- "hacer caso" (to pay attention)
- "tener en cuenta" (to take into account)
- "dar la lata" (to annoy/bother)
- "ponerse a" (to start doing)
- "acabar de" (to have just done)
- "contar con" (to count on)
- "soñar con" (to dream about)
- "acordarse de" (to remember)
- "pensar en" (to think about)
- "depender de" (to depend on)

**Common collocations:**
- "muela del juicio" (wisdom tooth)
- "cuenta bancaria" (bank account)
- "tiempo libre" (free time)
- "lugar común" (common place/cliché)

**Idiomatic expressions:**
- "hasta la madre" (fed up)
- "en el quinto pino" (in the middle of nowhere)
- "costar un ojo de la cara" (to cost an arm and a leg)

#### Reflexive Verbs with Meaning Shift

**Always extract reflexive forms when they have a distinct meaning from the base verb**, even if the base verb is A1-A2:

- "ir" → "irse" (to leave/take off)
- "dormir" → "dormirse" (to fall asleep)
- "poner" → "ponerse" (to become / to put on)
- "llevar" → "llevarse" (to take away / to get along with)
- "quedar" → "quedarse" (to stay / to remain)

These are B1+ semantics regardless of the base verb's level.

#### Morphological Forms to Include

Even when the base word is A1-A2, include the following morphological forms:

- **Superlatives (-ísimo)**: "rapidísimo", "grandísimo", "chiquitísimo" — the form itself is B1+
- **Non-standard diminutives**: "chiquitito", "ahorita" (especially in Latin American Spanish)
- **Nominalizations of basic verbs**: "el saber", "el querer" — gerund/infinitive used as a noun

**DO NOT extract simple phrases:**
- Simple present: "yo digo", "él come", "tú tienes"
- Simple preterite: "yo dije", "él comió", "tú tuviste"
- Basic ser/estar: "es bueno", "está aquí"
- These don't demonstrate B1+ grammar complexity

**DO NOT extract overly simple multi-word phrases:**
Even 2-3 word phrases should be excluded if they consist entirely of A1-A2 basic components without B1+ grammatical complexity. These are too simple:

- **Negative + basic verb in simple tense**: "no entiendo", "no sé", "no creo"
- **Pronoun + simple past**: "me dijo", "te vi", "nos contó" — basic preterite with indirect objects
- **Basic verb + preposition**: "voy a", "es para", "tengo que" — A1-level combinations
- **Simple subordinate clauses with indicative**: "no sé si", "creo que", "dice que" — **but only when followed by a simple indicative clause**. If the same opener is followed by subjunctive, conditional, or a complex structure — include the whole phrase. Examples:
  - "no sé si vendrá" → include (future)
  - "creo que hubiera sido mejor" → include (past perfect subjunctive)
  - "no sé si viene" → exclude (simple present)
- **Subject + simple verb**: "tú eres", "yo digo", "él tiene" — elementary sentence structure

**Key rule:** If ALL words in the phrase are A1-A2 basic AND the grammatical structure is elementary (present, preterite, basic word order), **skip it**. Only include multi-word phrases that demonstrate B1+ grammar complexity OR contain at least one B1+ word.

**DO NOT extract (skip these):

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
- Skip single words with 3 or fewer letters (unless important)
- Skip verb conjugations of basic verbs (tengo, tienes, tiene → all from "tener")

### Translation Quality

**For each vocabulary entry:**

1. **translation** — Use 1-5 words, lowercase
   - Good: "masticar" → "to chew"
   - Good: "hacer caso" → "to pay attention"
   - Bad: "masticar" → "chew, masticate, grind food with teeth"

2. **pos** — Part of speech (optional)
   - "expression" for phrases
   - "verb phrase", "noun phrase" for collocations

3. **context** — The original Spanish sentence (optional)
   - Helps remember the usage

**Example vocab entries:**
```json
{
  "masticar": {
    "translation": "to chew",
    "pos": "verb"
  },
  "muela del juicio": {
    "translation": "wisdom tooth",
    "pos": "noun phrase"
  },
  "hacer caso": {
    "translation": "to pay attention",
    "pos": "verb phrase"
  },
  "hasta la madre": {
    "translation": "fed up / completely full",
    "pos": "expression"
  },
  "en el quinto pino": {
    "translation": "in the middle of nowhere",
    "pos": "expression"
  },
  "si tuviera tiempo": {
    "translation": "if I had time",
    "pos": "verb phrase",
    "context": "Si tuviera tiempo, aprendería a tocar la guitarra."
  },
  "aunque llueva": {
    "translation": "even if it rains",
    "pos": "expression",
    "context": "Vamos a salir aunque llueva."
  },
  "irse": {
    "translation": "to leave / take off",
    "pos": "verb"
  },
  "rapidísimo": {
    "translation": "extremely fast",
    "pos": "adjective",
    "level": "B1",
    "source": "superlative"
  },
  "tenga": {
    "translation": "I have (subjunctive)",
    "pos": "verb",
    "level": "A1_A2_advanced_form",
    "source": "subjunctive_conjugation",
    "context": "Espero que tengas razón."
  }
}
```

### Additional Word Categories to Include

#### Compound Nouns

Extract compound nouns (words formed by combining two or more words):

- "abrelatas" (can opener)
- "paraguas" (umbrella)
- "muela del juicio" (wisdom tooth)
- "sacacorchos" (corkscrew)
- "lavaplatos" (dishwasher)

#### False Friends

Words that look like English but have different meanings:

| Spanish | Looks Like | Actually Means |
|---------|-----------|----------------|
| actual | actual | current/present |
| embarazada | embarrassed | pregnant |
| éxito | exit | success |
| asistir | assist | to attend |
| pretender | pretend | to try/attempt |
| realizar | realize | to carry out/do |

#### Abstract Nouns

Include abstract concepts and ideas:

- "libertad" (freedom)
- "alegría" (joy)
- "justicia" (justice)
- "felicidad" (happiness)
- "conocimiento" (knowledge)

#### Adverbs and Conjunctions

Often B1+ level, especially transitional phrases:

- "sin embargo" (however)
- "por lo tanto" (therefore)
- "aunque" (even if/although)
- "a pesar de" (despite)
- "a menos que" (unless)
- "mientras tanto" (meanwhile)

### Advanced Forms of A1-A2 Words

Include **all forms** of A1-A2 words if they appear in **B1+ structures**:

| Base Word | A1-A2 Form | B1+ Form | Translation |
|-----------|-----------|----------|-------------|
| tener | tengo | tendría | I would have |
| ser | soy | sería | I would be |
| estar | estoy | estaré | I will be |
| ir | voy | iría | I would go |
| hacer | hago | haré | I will do |

**Include these advanced forms:**
- **Subjunctive**: "tenga" (I have), "sea" (I am), "haga" (I do)
- **Conditional**: "tendría" (I would have), "sería" (I would be)
- **Future**: "tendré" (I will have), "seré" (I will be)
- **Imperfect**: "tenía" (I had), "era" (I was)
- **Compound tenses**: "he tenido" (I have had), "había sido" (I had been)
- **Reflexive forms**: "me levanto" (I get up), "te vistes" (you get dressed)

### Enhanced JSON Fields

**For each vocabulary entry, include these fields when possible:**

1. **translation** — Use 1-5 words, lowercase
2. **pos** — Part of speech (verb, noun, adjective, expression, verb phrase, noun phrase)
3. **level** — CEFR level: "B1", "B2", "C1", or "A1_A2_advanced_form"
4. **source** — Origin: "idiom", "verb_conjugation", "compound_noun", "false_friend", "technical_term", "reflexive_verb", "superlative", "subjunctive_phrase"
5. **context** — Original Spanish sentence (optional but recommended)

### Quick Reference: Include vs Exclude

| **Category** | **Include** | **Exclude** |
|--------------|-------------|-------------|
| **Multi-word phrases** | All (prioritize these) | None |
| **Verb forms** | Subjunctive, conditional, future, imperfect, compound tenses, reflexive | Only if standalone **and** simple present/preterite **and** in A1-A2 list |
| **Single words** | Superlatives, diminutives, abstract nouns, false friends, technical terms, reflexive verbs | Only if standalone **and** in A1-A2 list **and** not advanced |
| **Compound nouns** | All | None |
| **Idioms/Expressions** | All | None |
| **Proper nouns** | None | All |
| **English loanwords** | None | All |

**Key Principle: When in doubt, include the word/phrase.** Better to over-include than miss important vocabulary.

### Implementation Tips

1. **Use CEFR Lists**: Cross-check words against **A1-A2 lists** (e.g., [Spanish CEFR vocabulary](https://www.spanishdict.com/cefr)) to confirm level.

2. **Leverage POS Tagging**: Use **part-of-speech tagging** to identify verb forms, adjectives, etc.

3. **Regex for Verb Forms**: Use **regular expressions** to catch advanced verb forms:
   - Future endings: -é, -ás, -á, -emos, -éis, -án
   - Conditional endings: -ía, -ías, -ía, -íamos, -íais, -ían
   - Subjunctive indicators: que + different stem/ending

4. **Contextual Analysis**: For ambiguous words, **include context** in the output to clarify meaning.

5. **Prioritize Comprehensiveness**: When in doubt, **include the word/phrase**. Better to over-include than miss important vocabulary.

---

## Step 4b: Create Grammar Sentences File

**Output:** `grammar/[VIDEO_ID]_grammar.json`

**Extract the user-selected number of sentences per video** (3, 4, 5, or custom) that demonstrate B1+ grammar structures:

### Target Grammar Structures (select 3 different ones):

**Subjunctive Mood:**
- Present subjunctive: "Espero que vengas" (I hope you come)
- Past subjunctive: "Si fuera rico, viajaría" (If I were rich, I would travel)
- Perfect subjunctive: "Dudo que haya comido" (I doubt he has eaten)

**Compound Tenses:**
- Past perfect: "Ya había terminado" (I had already finished)
- Future perfect: "Habré terminado mañana" (I will have finished tomorrow)
- Conditional perfect: "Habría venido si..." (I would have come if...)

**Complex Structures:**
- Passive voice: "Fue construido en 1990" (It was built in 1990)
- Reported speech: "Dijo que vendría" (He said he would come)
- Relative clauses: "El libro que compré..." (The book that I bought...)

### Sentence Selection Criteria:
- ✅ Natural sentences from the transcript (not made up)
- ✅ Different grammar structures (don't pick 3 subjunctive sentences)
- ✅ Actually used in the video
- ✅ Include English translation
- ✅ Brief grammar explanation (1 sentence)

### JSON Structure:
```json
[
  {
    "spanish": "Si hubiera sabido eso, no habría venido.",
    "english": "If I had known that, I wouldn't have come.",
    "explanation": "Past perfect subjunctive + conditional perfect for hypothetical past"
  },
  {
    "spanish": "Es importante que estudies todos los días.",
    "english": "It's important that you study every day.",
    "explanation": "Present subjunctive after impersonal expression 'es importante que'"
  },
  {
    "spanish": "Para cuando llegué, ya se habían ido.",
    "english": "By the time I arrived, they had already left.",
    "explanation": "Past perfect - action completed before another past action"
  }
]
```

**IMPORTANT:** Choose sentences that are:
1. **Actually in the transcript** (not fabricated)
2. **Different grammar types** (mix tenses/moods)
3. **Useful for learning** (common structures)
4. **With short explanations** (1 sentence max)

---

## Step 4c: Create Summary File

**Output:** `summary/[VIDEO_ID]_summary.json`

**Write a short summary** of the video content in Spanish (4-6 sentences), using the original vocabulary from the transcript. The summary should capture the main ideas and key points discussed.

### Summary Guidelines:
- **Language:** Spanish (original language of the video)
- **Length:** 4-6 sentences
- **Style:** Use vocabulary from the transcript (not simplified A1-A2 words)
- **Content:** Main topic, key points, main conclusion or takeaway
- **Format:** Plain text, not markdown

### JSON Structure:
```json
{
  "summary": "Spanish summary text here using original vocabulary from the transcript. Should capture the main ideas and key points of the video in 4-6 sentences."
}
```

### Example:
```json
{
  "summary": "Este episodio explica por qué tenemos muelas del juicio y por qué duelen tanto cuando salen. El dentista describe cómo extrajo una muela con tres raíces en lugar de una sola. También se discute la tradición del Ratón Pérez en España versus el Hada de los Dientes en Estados Unidos."
}
```

---

## Step 5: File Creation

### Create Four Files

For each transcript, create **four** files:

1. **Translation file** in `transcripts/` folder
2. **Vocab file** in `vocab/` folder  
3. **Grammar file** in `grammar/` folder
4. **Summary file** in `summary/` folder

### Naming Convention

```
transcripts/087XVp3JIpk.md          ← Original (you read this)
transcripts/087XVp3JIpk_translation.md  ← Translation (you create this)
vocab/087XVp3JIpk_vocab.json       ← Vocabulary (you create this)
grammar/087XVp3JIpk_grammar.json   ← Grammar sentences (you create this)
summary/087XVp3JIpk_summary.json   ← Video summary (you create this)
```

---

## Example: Complete Translation

### Input: `transcripts/087XVp3JIpk.md`
```markdown
---
title: "Un diente menos"
source: "https://www.youtube.com/watch?v=087XVp3JIpk"
---

**0:00** Hola a todos y bienvenidos a un nuevo episodio
**0:05** de nuestro podcast para aprender español
**0:10** aquí hablamos español de una manera no muy rápida
```

### Output: `transcripts/087XVp3JIpk_translation.md`
```markdown
---
title: "Un diente menos (English Translation)"
source: "https://www.youtube.com/watch?v=087XVp3JIpk"
---

**0:00** Hello everyone and welcome to a new episode
**0:05** of our podcast to learn Spanish
**0:10** here we speak Spanish in a not very fast way
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

### Output: `grammar/087XVp3JIpk_grammar.json`
```json
[
  {
    "spanish": "Si hubiera sabido eso, no habría venido.",
    "english": "If I had known that, I wouldn't have come.",
    "explanation": "Past perfect subjunctive (hubiera sabido) + conditional perfect (habría venido) - used for hypothetical situations in the past"
  },
  {
    "spanish": "Es importante que estudies todos los días.",
    "english": "It's important that you study every day.",
    "explanation": "Present subjunctive (estudies) after impersonal expression 'es importante que'"
  },
  {
    "spanish": "Para cuando llegué, ya se habían ido.",
    "english": "By the time I arrived, they had already left.",
    "explanation": "Past perfect (se habían ido) - action completed before another past action"
  }
]
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

### Before Starting (Input Validation & Setup):
- [ ] Input file has required frontmatter: `title:` and `source:` with YouTube URL
- [ ] Input file has at least one timestamped line with Spanish content
- [ ] No matching `[ID]_translation.md` file already exists
- [ ] Asked user for grammar sentence count using clickable options (3, 4, 5, or custom)

### Before Finishing (Output Verification):
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
1. **Validate** `transcripts/[ID].md` has required frontmatter (title + source URL) and proper format
2. Read `transcripts/[ID].md`
3. Create `transcripts/[ID]_translation.md` (full English translation)
4. Create `vocab/[ID]_vocab.json` (B1+ vocabulary with multi-word phrases)
5. Create `grammar/[ID]_grammar.json` (user-selected number of sentences with B1+ grammar + explanations)
6. Skip files that already have translations
7. Exclude basic words (see `data/a1-a2.json`), proper nouns (see `data/proper-nouns.json`), and manual exclusions (see `data/manual-exclude.json`)

**Goal:** Help language learners understand Spanish YouTube videos with accurate translations, contextual vocabulary, and grammar-focused learning sentences.

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

### Merge Transcript Lines
**Command:** `"merge VIDEO_ID"` or `"merge lines VIDEO_ID"`

Merges short transcript lines to create longer segments (80-120 characters per line) for better readability:
- Keeps the first timestamp of each merged segment
- Removes redundant timestamps from merged lines
- Preserves all original text content
- Maintains 80-120 character target length per line

**How to use:**
Just say: `"merge 087XVp3JIpk"` or `"merge lines Psb9g9UxqZs"`

The AI will:
- Read the original transcript file
- Merge consecutive lines to achieve 80-120 character segments
- Keep timestamps aligned with merged content
- Overwrite the original file with the merged version
- Report how many lines were reduced

**Example:**
```
Before (short lines):
**0:00** Hola a todos y bienvenidos a un nuevo
**0:03** episodio de nuestro podcast para
**0:05** aprender español aquí hablamos español
**0:10** de una manera no muy rápida Clara y
**0:14** cuando menciono una palabra difícil la
**0:17** intento

After (merged lines):
**0:00** Hola a todos y bienvenidos a un nuevo episodio de nuestro podcast para aprender español aquí hablamos español
**0:10** de una manera no muy rápida Clara y cuando menciono una palabra difícil la intento
```

**Note:** This modifies the original transcript file. Use before translation if you want cleaner segments.

---

### Delete Transcript
**Command:** `"delete VIDEO_ID"` or `"remove VIDEO_ID"`

Removes a transcript and all associated files:
- `transcripts/VIDEO_ID.md`
- `transcripts/VIDEO_ID_translation.md`
- `vocab/VIDEO_ID_vocab.json`
- `grammar/VIDEO_ID_grammar.json`
- `summary/VIDEO_ID_summary.json`
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
- `"translate new"` - Translate all new transcripts (asks for grammar sentence count: 3, 4, 5, or custom)
- `"merge VIDEO_ID"` - Merge short transcript lines into longer segments (80-120 chars)
- `"check files"` - Run validation and cleanup
- `"delete VIDEO_ID"` or `"remove VIDEO_ID"` - Remove a transcript

**Remember:** Every translation automatically:
1. Extracts multi-word phrases (2-4 words) as primary vocabulary
2. Creates grammar sentences with B1+ structures (subjunctive, compound tenses, etc.) - **you choose the count (3-5 or custom)**
3. Provides English translations and brief grammar explanations

---

## Final Note

**When in doubt, include the word/phrase.** This ensures **no important vocabulary is missed**, even if it means slightly more entries to review later.
