/**
 * Translate command — cleans transcripts and generates vocab with AI.
 *
 * Run with:
 *   node server.js translate
 *
 * Performs three steps for every original transcript:
 *   1. Clean markdown (strip headings, section dividers, blank lines)
 *   2. Create missing `_translation.md` placeholder files (if missing)
 *   3. Create/update `_vocab.json` files with AI translations (Qwen3.5 Plus)
 *
 * Use --free flag for translate-shell instead of AI:
 *   node server.js translate --free
 */
const path = require('path');
const fs = require('fs');
const { execSync, spawn } = require('child_process');
const { TRANSCRIPTS_DIR, VOCAB_DIR } = require('../config');
const { findTranscriptFiles, readTranscript, writeTranscript, writeVocab } = require('../store');
const { loadExcludedWords } = require('../exclusions');

/**
 * Batch translate words using translate-shell (free option).
 *
 * @param {string[]} words
 * @returns {string[]}
 */
function batchTranslateShell(words) {
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
 * Call Qwen3.5 Plus via opencode CLI for AI translation.
 *
 * @param {string[]} words
 * @returns {Promise<Object.<string, { translation: string, pos: string }>>}
 */
async function batchTranslateAI(words) {
    return new Promise((resolve, reject) => {
        const prompt = `Translate these Spanish words to English. Respond ONLY with valid JSON.

Format: {"word": {"translation": "english", "pos": "noun"}}

Words: ${words.join(', ')}

Example: {"gato": {"translation": "cat", "pos": "noun"}}`;

        const opencode = spawn('opencode', [
            'run',
            '--model', 'opencode-go/qwen3.5-plus',
            '--format', 'json',
            '--'
        ], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';

        opencode.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach(line => {
                if (line.trim()) {
                    try {
                        const event = JSON.parse(line);
                        if (event.type === 'text' && event.part?.text) {
                            output += event.part.text;
                        }
                    } catch (e) {
                        // Ignore non-JSON lines
                    }
                }
            });
        });

        opencode.stderr.on('data', (data) => {
            process.stderr.write(data);
        });

        opencode.on('close', (code) => {
            try {
                const jsonMatch = output.match(/\{[\s\S]*\}/);
                const jsonStr = jsonMatch ? jsonMatch[0] : output;
                const result = JSON.parse(jsonStr);
                resolve(result);
            } catch (e) {
                console.error('\n     AI parse error:', e.message);
                // Fallback: return words as translation needed
                const fallback = {};
                words.forEach(w => fallback[w] = { translation: '[translation needed]', pos: null });
                resolve(fallback);
            }
        });

        opencode.on('error', (e) => {
            console.error('\n     AI error:', e.message);
            const fallback = {};
            words.forEach(w => fallback[w] = { translation: '[translation needed]', pos: null });
            resolve(fallback);
        });

        opencode.stdin.write(prompt);
        opencode.stdin.end();

        // Timeout after 3 minutes
        setTimeout(() => {
            opencode.kill('SIGTERM');
            const fallback = {};
            words.forEach(w => fallback[w] = { translation: '[translation needed]', pos: null });
            resolve(fallback);
        }, 180000);
    });
}

/**
 * Execute the translate pipeline and print a report to stdout.
 */
async function runTranslate() {
    const useFreeShell = process.argv.includes('--free');

    console.log('\n=== TRANSLATE: Processing transcripts ===\n');
    console.log(`Mode: ${useFreeShell ? 'Free (translate-shell)' : 'AI (Qwen3.5 Plus)'}\n`);

    /** @type {string[]} */
    const cleanedFiles = [];
    /** @type {string[]} */
    const translationsCreated = [];
    /** @type {string[]} */
    const vocabCreated = [];
    /** @type {string[]} */
    const vocabUpdated = [];

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

        // --- Step 3: Create/update vocabulary file with translations ---
        const vocabPath = path.join(VOCAB_DIR, `${videoId}_vocab.json`);
        const excludedWords = loadExcludedWords();

        /** @type {Object.<string, any>} */
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

        // Find all untranslated words (both new and existing)
        const untranslated = Object.keys(vocab).filter(w => {
            const entry = vocab[w];
            return typeof entry === 'string' || !entry?.translation;
        });

        if (untranslated.length > 0) {
            console.log(`  📚 ${filename}: translating ${untranslated.length} words with ${useFreeShell ? 'translate-shell' : 'AI'}...`);

            if (useFreeShell) {
                // === Free translate-shell mode ===
                const batchSize = 50;
                let translatedCount = 0;

                for (let i = 0; i < untranslated.length; i += batchSize) {
                    const batch = untranslated.slice(i, i + batchSize);
                    const translations = batchTranslateShell(batch);

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
                // === AI mode ===
                const batchSize = 100;
                let translatedCount = 0;

                for (let i = 0; i < untranslated.length; i += batchSize) {
                    const batch = untranslated.slice(i, i + batchSize);
                    console.log(`     Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(untranslated.length / batchSize)}...`);

                    const translations = await batchTranslateAI(batch);

                    Object.entries(translations).forEach(([word, data]) => {
                        if (data && data.translation) {
                            vocab[word] = {
                                translation: data.translation.toLowerCase(),
                                pos: data.pos || null
                            };
                            translatedCount++;
                        }
                    });

                    console.log(`     ✓ Batch complete: ${Object.keys(translations).length} words translated`);
                }

                console.log(`     Done: ${translatedCount}/${untranslated.length} translated`);
            }
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

    if (vocabUpdated.length > 0) {
        console.log(`🔄 Updated ${vocabUpdated.length} vocabulary file(s):`);
        vocabUpdated.forEach(f => console.log(`   - ${f}`));
    }

    if (vocabCreated.length === 0 && vocabUpdated.length === 0) {
        console.log('✅ All vocabulary files up to date');
    }

    console.log(`\n💰 Cost: ${useFreeShell ? 'Free' : '$0 (covered by opencode-go subscription)'}`);
    console.log('\n=== TRANSLATE COMPLETE ===\n');
}

module.exports = { runTranslate };
