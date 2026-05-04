/**
 * AI Vocab Auto command — semi-automated AI vocabulary translation.
 *
 * Run with:
 *   node server.js vocab-auto
 *
 * Does everything in one command:
 * 1. Extracts untranslated words from all transcripts
 * 2. Generates AI prompt file (VOCAB_AI_PROMPT.md)
 * 3. Opens the prompt for you to copy/paste to AI
 * 4. After you paste AI response, applies it automatically
 *
 * Cost: Covered by your $10/month opencode-go subscription
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { TRANSCRIPTS_DIR, VOCAB_DIR } = require('../config');
const { findTranscriptFiles, readTranscript, writeVocab } = require('../store');
const { loadExcludedWords } = require('../exclusions');

/**
 * Execute the semi-automated AI vocab pipeline.
 */
function runVocabAuto() {
    console.log('\n=== AI VOCAB AUTO: Automated vocabulary translation ===\n');
    console.log('Using: Qwen3.5 Plus via opencode-go');
    console.log('This is a 2-step process:\n');

    const vocabByVideo = {};
    const skipped = [];

    const transcriptFiles = findTranscriptFiles();
    const excludedWords = loadExcludedWords();

    console.log(`Step 1: Analyzing ${transcriptFiles.length} transcript(s)...\n`);

    // === Step 1: Collect all untranslated words ===
    transcriptFiles.forEach(filename => {
        const content = readTranscript(filename);
        if (!content) return;

        const sourceMatch = content.match(/source:\s*"([^"]+)"/);
        if (!sourceMatch) {
            console.log(`  ⚠️  ${filename}: No source URL found, skipping`);
            skipped.push(filename);
            return;
        }

        const videoIdMatch = sourceMatch[1].match(/v=([a-zA-Z0-9_-]{11})/);
        if (!videoIdMatch) {
            console.log(`  ⚠️  ${filename}: Could not extract video ID, skipping`);
            skipped.push(filename);
            return;
        }

        const videoId = videoIdMatch[1];
        const vocabPath = path.join(VOCAB_DIR, `${videoId}_vocab.json`);

        let vocab = {};
        if (fs.existsSync(vocabPath)) {
            vocab = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));
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

        // Find all untranslated words
        const untranslated = Object.keys(vocab).filter(w => {
            const entry = vocab[w];
            return typeof entry === 'string' || !entry?.translation;
        });

        if (untranslated.length > 0) {
            console.log(`  📚 ${filename}: ${untranslated.length} words need translation`);
            vocabByVideo[videoId] = {
                filename,
                words: untranslated,
                vocab
            };
        } else {
            console.log(`  ✅ ${filename}: all words already translated`);
        }
    });

    const allWords = Object.values(vocabByVideo).flatMap(v => v.words);
    const uniqueWords = [...new Set(allWords)].sort();

    if (uniqueWords.length === 0) {
        console.log('\n=== AI VOCAB AUTO REPORT ===\n');
        console.log('✅ All vocabulary files up to date');
        console.log('\n=== COMPLETE ===\n');
        return;
    }

    console.log(`\n📊 Total unique words to translate: ${uniqueWords.length}`);

    // === Step 2: Generate AI prompt ===
    console.log('\n📝 Generating AI prompt...\n');
    const prompt = buildAIPrompt(vocabByVideo);
    const promptPath = path.join(TRANSCRIPTS_DIR, '..', 'VOCAB_AI_PROMPT.md');
    fs.writeFileSync(promptPath, prompt);

    console.log('✅ Prompt saved to: VOCAB_AI_PROMPT.md\n');

    // === Step 3: Instructions ===
    console.log('=== Step 2: Get AI Translation ===\n');
    console.log('Copy the content of VOCAB_AI_PROMPT.md and paste to Qwen3.5 Plus:\n');
    console.log('  opencode run --model "opencode-go/qwen3.5-plus"');
    console.log('  # Then paste the prompt from VOCAB_AI_PROMPT.md\n');
    console.log('Save the AI response as: ai-response.json\n');

    // === Step 4: Wait for user to provide JSON file ===
    console.log('=== Step 3: Apply Translations ===\n');
    console.log('After saving the AI response, run:\n');
    console.log('  node server.js vocab-auto-apply ai-response.json\n');
    console.log('Or manually:\n');
    console.log('  node server.js vocab-ai-apply ai-response.json\n');

    console.log('\n=== AI VOCAB AUTO COMPLETE (Step 1 of 2) ===\n');
}

/**
 * Build a concise AI prompt for translation.
 *
 * @param {Object} vocabByVideo
 * @returns {string}
 */
function buildAIPrompt(vocabByVideo) {
    const allWords = Object.values(vocabByVideo).flatMap(v => v.words);
    const uniqueWords = [...new Set(allWords)].sort();

    let prompt = `# AI Vocabulary Translation Request

## Task
Translate these ${uniqueWords.length} Spanish words to English.

## Output Format
Respond **ONLY** with a valid JSON object. No markdown code blocks, no explanations.

## JSON Structure
For each word, provide:
- **translation**: Primary English meaning (1-3 words, lowercase)
- **pos**: Part of speech (noun, verb, adjective, etc.) - optional

Example:
\`\`\`json
{
  "gato": { "translation": "cat", "pos": "noun" },
  "correr": { "translation": "to run", "pos": "verb" },
  "banco": { "translation": "bank", "pos": "noun" }
}
\`\`\`

## Words to Translate
${uniqueWords.join(', ')}

---

**Remember**: Respond ONLY with the JSON object. No markdown, no code blocks, no extra text.
Start with { and end with }`;

    return prompt;
}

module.exports = { runVocabAuto };
