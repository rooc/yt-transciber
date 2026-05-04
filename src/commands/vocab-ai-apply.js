/**
 * AI Vocab Apply command — applies AI translations to vocab files.
 *
 * Run with:
 *   node server.js vocab-ai-apply path/to/ai-response.json
 *
 * Takes the JSON response from your AI assistant and updates vocab files.
 */
const path = require('path');
const fs = require('fs');
const { VOCAB_DIR } = require('../config');
const { writeVocab } = require('../store');

/**
 * Apply AI translations to vocabulary files.
 */
function runVocabAIApply() {
    const jsonPath = process.argv.find(arg => arg.endsWith('.json'));
    
    if (!jsonPath) {
        console.log('\n=== AI VOCAB APPLY ===\n');
        console.log('Usage: node server.js vocab-ai-apply <path-to-json-file>');
        console.log('\nExample:');
        console.log('  node server.js vocab-ai-apply ai-translations.json\n');
        process.exit(0);
    }

    if (!fs.existsSync(jsonPath)) {
        console.error(`\n❌ Error: File not found: ${jsonPath}\n`);
        process.exit(1);
    }

    console.log('\n=== AI VOCAB APPLY: Processing AI translations ===\n');

    let aiTranslations;
    try {
        const content = fs.readFileSync(jsonPath, 'utf-8');
        aiTranslations = JSON.parse(content);
    } catch (e) {
        console.error(`❌ Error parsing JSON: ${e.message}`);
        process.exit(1);
    }

    if (!aiTranslations || typeof aiTranslations !== 'object') {
        console.error('❌ Error: JSON must be an object with word translations\n');
        process.exit(1);
    }

    const totalWords = Object.keys(aiTranslations).length;
    console.log(`📊 Found ${totalWords} translations in AI response\n`);

    // Group translations by video
    const translationsByVideo = {};
    
    // Read all vocab files to find which video each word belongs to
    const vocabFiles = fs.existsSync(VOCAB_DIR) ? fs.readdirSync(VOCAB_DIR).filter(f => f.endsWith('_vocab.json')) : [];
    
    vocabFiles.forEach(vocabFile => {
        const videoId = vocabFile.replace('_vocab.json', '');
        const vocabPath = path.join(VOCAB_DIR, vocabFile);
        const vocab = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));
        
        // Find words from this vocab file in the AI translations
        const matchingWords = Object.keys(aiTranslations).filter(word => vocab[word]);
        
        if (matchingWords.length > 0) {
            translationsByVideo[videoId] = {
                vocabFile,
                vocab,
                translations: {}
            };
            
            matchingWords.forEach(word => {
                const aiData = aiTranslations[word];
                // Handle both old format (string) and new format (object)
                if (typeof aiData === 'string') {
                    translationsByVideo[videoId].translations[word] = {
                        translation: aiData.toLowerCase(),
                        pos: null
                    };
                } else if (aiData && aiData.translation) {
                    translationsByVideo[videoId].translations[word] = {
                        translation: aiData.translation.toLowerCase(),
                        pos: aiData.pos || null
                    };
                }
            });
        }
    });

    // Check for unmatched words
    const matchedWords = new Set();
    Object.values(translationsByVideo).forEach(data => {
        Object.keys(data.translations).forEach(word => matchedWords.add(word));
    });
    
    const unmatchedWords = Object.keys(aiTranslations).filter(word => !matchedWords.has(word));
    
    if (unmatchedWords.length > 0) {
        console.log(`⚠️  ${unmatchedWords.length} words not found in any vocab file:`);
        console.log(`   ${unmatchedWords.slice(0, 20).join(', ')}${unmatchedWords.length > 20 ? '...' : ''}\n`);
    }

    // Apply translations
    let updatedCount = 0;
    
    Object.entries(translationsByVideo).forEach(([videoId, data]) => {
        const { vocab, translations } = data;
        
        Object.entries(translations).forEach(([word, translationData]) => {
            vocab[word] = translationData;
            updatedCount++;
        });
        
        // Sort and save
        const sortedVocab = {};
        Object.keys(vocab).sort().forEach(key => {
            sortedVocab[key] = vocab[key];
        });
        
        writeVocab(videoId, sortedVocab);
        console.log(`✓ ${data.vocabFile}: updated ${Object.keys(translations).length} words`);
    });

    // === Report ===
    console.log('\n=== AI VOCAB APPLY REPORT ===\n');
    console.log(`✅ Applied ${updatedCount}/${totalWords} translations`);
    console.log(`📁 Updated ${Object.keys(translationsByVideo).length} vocab file(s)`);
    
    if (unmatchedWords.length > 0) {
        console.log(`\n⚠️  ${unmatchedWords.length} words unmatched (not in existing vocab files)`);
    }

    console.log('\n=== AI VOCAB APPLY COMPLETE ===\n');
}

module.exports = { runVocabAIApply };
