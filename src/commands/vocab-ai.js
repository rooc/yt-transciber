/**
 * AI Vocab command — generates vocabulary prompts for AI translation.
 *
 * Run with:
 *   node server.js vocab-ai
 *
 * This command prepares vocabulary for AI translation by:
 * 1. Extracting all untranslated words from transcripts
 * 2. Generating a ready-to-use prompt for your AI assistant
 * 3. Saving prompts to /tmp/vocab-prompts.txt
 *
 * Then ask your AI (Qwen3.5 Plus via opencode-go) to translate the generated prompts.
 *
 * Cost: Covered by your $10/month opencode-go subscription
 */
const path = require('path');
const fs = require('fs');
const { TRANSCRIPTS_DIR, VOCAB_DIR } = require('../config');
const { findTranscriptFiles, readTranscript, writeVocab } = require('../store');
const { loadExcludedWords } = require('../exclusions');

/**
 * Execute the AI vocab preparation pipeline.
 */
function runVocabAI() {
    console.log('\n=== AI VOCAB: Preparing vocabulary for AI translation ===\n');

    const allWords = [];
    const vocabByVideo = {};
    const skipped = [];

    const transcriptFiles = findTranscriptFiles();
    const excludedWords = loadExcludedWords();

    console.log(`Found ${transcriptFiles.length} transcript(s)\n`);

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
        const newWords = [];

        transcriptLines.forEach(line => {
            const text = line.replace(/^\*\*[^·]+·\s*/, '');
            const words = text.toLowerCase().match(/[a-záéíóúüñ]+/g) || [];
            words.forEach(word => {
                if (word.length > 3 && !excludedWords.has(word) && !vocab[word]) {
                    vocab[word] = '[translation needed]';
                    newWords.push(word);
                }
            });
        });

        // Find all untranslated words (including old string format)
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
            allWords.push(...untranslated);
        } else {
            console.log(`  ✅ ${filename}: all words already translated`);
        }
    });

    if (allWords.length === 0) {
        console.log('\n=== AI VOCAB REPORT ===\n');
        console.log('✅ All vocabulary files up to date');
        console.log('\n=== AI VOCAB COMPLETE ===\n');
        return;
    }

    // Generate AI prompt
    const uniqueWords = [...new Set(allWords)].sort();
    const prompt = generateAIPrompt(vocabByVideo);

    // Save prompt to file
    const promptPath = path.join(TRANSCRIPTS_DIR, '..', 'VOCAB_AI_PROMPT.md');
    fs.writeFileSync(promptPath, prompt);

    // === Report ===
    console.log('\n=== AI VOCAB REPORT ===\n');
    console.log(`📊 Total unique words to translate: ${uniqueWords.length}`);
    console.log(`📝 AI prompt saved to: VOCAB_AI_PROMPT.md`);
    console.log(`\n=== NEXT STEPS ===`);
    console.log(`
1. Open VOCAB_AI_PROMPT.md
2. Copy the entire content
3. Paste to your AI assistant (Qwen3.5 Plus via opencode-go)
4. Run the AI translation
5. Save the JSON output to replace/update vocab files

Example AI command:
  "Translate these Spanish words to English. Respond ONLY with valid JSON."
`);

    if (skipped.length > 0) {
        console.log(`\n⚠️  Skipped ${skipped.length} file(s):`);
        skipped.forEach(f => console.log(`   - ${f}`));
    }

    console.log('\n=== AI VOCAB COMPLETE ===\n');
}

/**
 * Generate a formatted prompt for AI translation.
 *
 * @param {Object} vocabByVideo
 * @returns {string}
 */
function generateAIPrompt(vocabByVideo) {
    let prompt = `# AI Vocabulary Translation Request

## Task
Translate these Spanish words to English.

## Output Format
Respond ONLY with a valid JSON object. No markdown, no explanations.

For each word, provide:
- **translation**: Primary English meaning (1-3 words, lowercase)
- **pos**: Part of speech (noun, verb, adjective, etc.) - optional

## JSON Structure
\`\`\`json
{
  "spanish_word": {
    "translation": "english translation",
    "pos": "noun"
  }
}
\`\`\`

## Words to Translate
Grouped by video for context:

`;

    Object.entries(vocabByVideo).forEach(([videoId, data]) => {
        prompt += `\n### Video: ${data.filename}\n`;
        prompt += `Source: https://www.youtube.com/watch?v=${videoId}\n\n`;
        prompt += `**${data.words.length} words:**\n\n`;
        
        // Group words in batches of 50 for readability
        const batches = [];
        for (let i = 0; i < data.words.length; i += 50) {
            batches.push(data.words.slice(i, i + 50));
        }
        
        batches.forEach((batch, idx) => {
            prompt += `${idx + 1}. ${batch.join(', ')}\n\n`;
        });
    });

    prompt += `\n---

## Important Rules
1. Respond ONLY with the JSON object - no markdown code blocks
2. Keep translations concise (1-3 words)
3. Use lowercase for all translations
4. Include part of speech when unclear from the translation

## Example Response
{
  "gato": { "translation": "cat", "pos": "noun" },
  "correr": { "translation": "to run", "pos": "verb" },
  "banco": { "translation": "bank", "pos": "noun" }
}
`;

    return prompt;
}

module.exports = { runVocabAI };
