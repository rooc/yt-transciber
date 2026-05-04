/**
 * Translate command — cleans transcripts and prepares for AI translation.
 *
 * Run with:
 *   node server.js translate
 *
 * Performs three steps for every original transcript:
 *   1. Clean markdown (strip headings, section dividers, blank lines)
 *   2. Create missing `_translation.md` placeholder files (if missing)
 *   3. Create `_vocab.json` files with `[translation needed]` placeholders
 *   4. Generate `VOCAB_AI_PROMPT.md` for AI translation
 *
 * After running, copy VOCAB_AI_PROMPT.md to your AI (ChatGPT, Claude, Qwen3.5 Plus)
 * and apply the response with: node server.js vocab-ai-apply response.json
 */
const path = require('path');
const fs = require('fs');
const { TRANSCRIPTS_DIR, VOCAB_DIR } = require('../config');
const { findTranscriptFiles, readTranscript, writeTranscript, writeVocab } = require('../store');
const { loadExcludedWords } = require('../exclusions');

/**
 * Execute the translate pipeline and print a report to stdout.
 */
function runTranslate() {
    console.log('\n=== TRANSLATE: Processing transcripts ===\n');

    const cleanedFiles = [];
    const translationsCreated = [];
    const vocabCreated = [];
    const vocabByVideo = {};

    const transcriptFiles = findTranscriptFiles();

    for (const filename of transcriptFiles) {
        let content = readTranscript(filename);
        if (!content) continue;

        // --- Step 1: Clean the file ---
        const originalContent = content;

        // Remove markdown headings (# Heading)
        content = content.replace(/^#+\s+.+$/gm, '');

        // Remove section dividers (---, ===) but preserve YAML frontmatter
        const lines = content.split('\n');
        let inFrontmatter = false;
        let frontmatterEnded = false;
        const cleanedLines = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Toggle frontmatter state on the first two `---` lines
            if (line.trim() === '---' && !frontmatterEnded) {
                inFrontmatter = !inFrontmatter;
                if (!inFrontmatter) frontmatterEnded = true;
                cleanedLines.push(line);
                continue;
            }

            // Skip secondary headings like "## Transcript"
            if (/^##?\s+\w+/i.test(line)) continue;
            // Skip horizontal rules
            if (/^[-=]{3,}$/.test(line.trim())) continue;

            // Keep timestamp lines and any non-empty line
            if (/\*\*\d{1,2}:\d{2}/.test(line) || line.trim()) {
                cleanedLines.push(line);
            }
        }

        const finalContent = cleanedLines.join('\n').replace(/\n{3,}/g, '\n\n');

        if (finalContent !== originalContent) {
            writeTranscript(filename, finalContent);
            cleanedFiles.push(filename);
            content = finalContent;
        }

        // Extract video ID from frontmatter source URL
        const sourceMatch = content.match(/source:\s*"([^"]+)"/);
        if (!sourceMatch) {
            console.log(`  ⚠️  ${filename}: No source URL found, skipping`);
            continue;
        }

        const videoIdMatch = sourceMatch[1].match(/v=([a-zA-Z0-9_-]{11})/);
        if (!videoIdMatch) {
            console.log(`  ⚠️  ${filename}: Could not extract video ID, skipping`);
            continue;
        }

        const videoId = videoIdMatch[1];

        // --- Step 2: Create missing translation placeholder ---
        const translationPath = path.join(TRANSCRIPTS_DIR, `${videoId}_translation.md`);
        if (!fs.existsSync(translationPath)) {
            console.log(`  📝 ${filename}: Creating translation placeholder...`);
            const titleMatch = content.match(/^title:\s*"([^"]+)"/m);
            const originalTitle = titleMatch ? titleMatch[1] : filename;

            /** @type {{ time: string, text: string }[]} */
            const lines = [];
            const regex = /\*\*(\d{1,2}):(\d{2})(?::(\d{2}))?\*\*\s*[·•]\s*(.+)/g;
            let match;
            while ((match = regex.exec(content)) !== null) {
                const time = match[3] ? `${match[1]}:${match[2]}:${match[3]}` : `${match[1]}:${match[2]}`;
                lines.push({ time, text: match[4].trim() });
            }

            let translationContent = `---
title: "${originalTitle} (English Translation)"
source: "${sourceMatch[1]}"
---

`;

            if (lines.length > 0) {
                lines.forEach(line => {
                    translationContent += `**${line.time}** · [TRANSLATION NEEDED] ${line.text}\n\n`;
                });
            } else {
                translationContent += `<!-- No transcript lines found in ${filename} -->\n`;
            }

            fs.writeFileSync(translationPath, translationContent.trim());
            translationsCreated.push(`${videoId}_translation.md`);
        }

        // --- Step 3: Create vocab file with placeholders ---
        const vocabPath = path.join(VOCAB_DIR, `${videoId}_vocab.json`);
        const excludedWords = loadExcludedWords();

        let vocab = {};
        let isNewFile = false;

        if (fs.existsSync(vocabPath)) {
            vocab = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));
        } else {
            isNewFile = true;
        }

        // Extract words from transcript
        const transcriptLines = content.match(/\*\*\d{1,2}:\d{2}[^·]*·\s*(.+)/g) || [];

        transcriptLines.forEach(line => {
            const text = line.replace(/^\*\*[^·]+·\s*/, '');
            const words = text.toLowerCase().match(/[a-záéíóúüñ]+/g) || [];
            words.forEach(word => {
                if (word.length > 3 && !excludedWords.has(word) && !vocab[word]) {
                    vocab[word] = '[translation needed]';
                }
            });
        });

        // Collect words for AI prompt
        const untranslated = Object.keys(vocab).filter(w => {
            const entry = vocab[w];
            return typeof entry === 'string' || !entry?.translation;
        });

        if (untranslated.length > 0) {
            vocabByVideo[videoId] = {
                filename,
                words: untranslated,
                vocab
            };
            console.log(`  📚 ${filename}: ${untranslated.length} words need translation`);
        } else {
            console.log(`  ✅ ${filename}: all words already translated`);
        }

        // Sort and save vocab (with placeholders)
        const sortedVocab = {};
        Object.keys(vocab).sort().forEach(key => {
            sortedVocab[key] = vocab[key];
        });

        writeVocab(videoId, sortedVocab);

        if (isNewFile) {
            vocabCreated.push(`${videoId}_vocab.json`);
        }
    }

    // --- Step 4: Generate AI prompt if there are untranslated words ---
    if (Object.keys(vocabByVideo).length > 0) {
        const prompt = buildAIPrompt(vocabByVideo);
        const promptPath = path.join(TRANSCRIPTS_DIR, '..', 'VOCAB_AI_PROMPT.md');
        fs.writeFileSync(promptPath, prompt);

        const allWords = Object.values(vocabByVideo).flatMap(v => v.words);
        const uniqueWords = [...new Set(allWords)].length;

        console.log('\n📝 AI Translation Prompt');
        console.log(`   Generated: VOCAB_AI_PROMPT.md`);
        console.log(`   Words to translate: ${uniqueWords}`);
        console.log('\n   Next steps:');
        console.log('   1. Copy VOCAB_AI_PROMPT.md content');
        console.log('   2. Paste to AI (ChatGPT, Claude, Qwen3.5 Plus)');
        console.log('   3. Save JSON response as: ai-response.json');
        console.log('   4. Apply: node server.js vocab-ai-apply ai-response.json');
    }

    // --- Report ---
    console.log('\n=== TRANSLATE REPORT ===\n');

    if (cleanedFiles.length > 0) {
        console.log(`✅ Cleaned ${cleanedFiles.length} transcript(s):`);
        cleanedFiles.forEach(f => console.log(`   - ${f}`));
    } else {
        console.log('✅ No transcripts needed cleaning');
    }

    console.log('');

    if (translationsCreated.length > 0) {
        console.log(`📝 Created ${translationsCreated.length} translation placeholder(s):`);
        translationsCreated.forEach(f => console.log(`   - ${f}`));
    } else {
        console.log('✅ All translation placeholders exist');
    }

    console.log('');

    if (vocabCreated.length > 0) {
        console.log(`📚 Created ${vocabCreated.length} vocabulary file(s):`);
        vocabCreated.forEach(f => console.log(`   - ${f}`));
    }

    console.log('');

    console.log('\n=== TRANSLATE COMPLETE ===\n');
}

/**
 * Build AI translation prompt.
 */
function buildAIPrompt(vocabByVideo) {
    const allWords = Object.values(vocabByVideo).flatMap(v => v.words);
    const uniqueWords = [...new Set(allWords)].sort();

    let prompt = `# AI Vocabulary Translation

Translate these ${uniqueWords.length} Spanish words to English.

## Format
Respond **ONLY** with valid JSON. No markdown, no explanations.

## JSON Structure
For each word:
- **translation**: English meaning (1-3 words, lowercase)
- **pos**: Part of speech (noun, verb, adjective) - optional

Example:
\`\`\`json
{
  "gato": { "translation": "cat", "pos": "noun" },
  "correr": { "translation": "to run", "pos": "verb" }
}
\`\`\`

## Words to Translate
${uniqueWords.join(', ')}

---

**Respond ONLY with the JSON object. Start with { and end with }.**`;

    return prompt;
}

module.exports = { runTranslate };
