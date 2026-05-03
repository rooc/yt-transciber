/**
 * Vocab command — updates vocabulary files with machine translations only.
 *
 * Run with:
 *   node server.js vocab
 *
 * Skips transcript cleaning and translation placeholder creation.
 * Only extracts new words and translates untranslated ones.
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { TRANSCRIPTS_DIR, VOCAB_DIR } = require('../config');
const { findTranscriptFiles, readTranscript, writeVocab } = require('../store');
const { loadExcludedWords } = require('../exclusions');

/**
 * Batch translate words using translate-shell.
 *
 * @param {string[]} words
 * @returns {string[]}
 */
function batchTranslate(words) {
    try {
        const output = execSync('trans -b es:en -no-auto', {
            input: words.join('\n'),
            encoding: 'utf-8',
            timeout: 120000,
        });
        return output.trim().split('\n');
    } catch (e) {
        console.error('     Translation error:', e.message);
        return words.map(() => '[translation needed]');
    }
}

/**
 * Execute the vocab-only pipeline and print a report to stdout.
 */
function runVocab() {
    console.log('\n=== VOCAB: Updating vocabulary files ===\n');

    const vocabCreated = [];
    const vocabUpdated = [];
    const skipped = [];

    const transcriptFiles = findTranscriptFiles();

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

        // Find all untranslated words
        const untranslated = Object.keys(vocab).filter(w => vocab[w] === '[translation needed]');

        if (untranslated.length > 0) {
            console.log(`  📚 ${filename}: translating ${untranslated.length} words...`);

            const batchSize = 50;
            let translatedCount = 0;

            for (let i = 0; i < untranslated.length; i += batchSize) {
                const batch = untranslated.slice(i, i + batchSize);
                const translations = batchTranslate(batch);

                batch.forEach((word, idx) => {
                    const t = translations[idx]?.trim().toLowerCase() || '[translation needed]';
                    if (t && t !== '') {
                        vocab[word] = t;
                        translatedCount++;
                    }
                });

                process.stdout.write(`\r     Progress: ${Math.min(i + batchSize, untranslated.length)}/${untranslated.length}`);
            }

            console.log('');
            console.log(`     Done: ${translatedCount}/${untranslated.length} translated`);
        } else {
            console.log(`  ✅ ${filename}: all words already translated`);
        }

        // Sort and save
        const sortedVocab = {};
        Object.keys(vocab).sort().forEach(key => {
            sortedVocab[key] = vocab[key];
        });

        writeVocab(videoId, sortedVocab);

        if (isNewFile) {
            vocabCreated.push(`${videoId}_vocab.json`);
        } else if (newWords.length > 0 || untranslated.length > 0) {
            vocabUpdated.push(`${videoId}_vocab.json`);
        }
    });

    // --- Report ---
    console.log('\n=== VOCAB REPORT ===\n');

    if (vocabCreated.length > 0) {
        console.log(`📚 Created ${vocabCreated.length} vocabulary file(s):`);
        vocabCreated.forEach(f => console.log(`   - ${f}`));
    }

    if (vocabUpdated.length > 0) {
        console.log(`🔄 Updated ${vocabUpdated.length} vocabulary file(s):`);
        vocabUpdated.forEach(f => console.log(`   - ${f}`));
    }

    if (vocabCreated.length === 0 && vocabUpdated.length === 0) {
        console.log('✅ All vocabulary files up to date');
    }

    if (skipped.length > 0) {
        console.log(`\n⚠️  Skipped ${skipped.length} file(s):`);
        skipped.forEach(f => console.log(`   - ${f}`));
    }

    console.log('\n=== VOCAB COMPLETE ===\n');
}

module.exports = { runVocab };
