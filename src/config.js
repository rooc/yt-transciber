/**
 * Central configuration module.
 *
 * Defines filesystem paths and runtime constants so every other module
 * reads from a single source of truth.
 */
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

/**
 * @typedef {Object} AppConfig
 * @property {number} PORT            — HTTP server port
 * @property {string} ROOT_DIR        — project root absolute path
 * @property {string} TRANSCRIPTS_DIR — folder containing .md transcript files
 * @property {string} VOCAB_DIR       — folder containing _vocab.json files
 * @property {string} GRAMMAR_DIR     — folder containing _grammar.json files
 * @property {string} DATA_DIR        — folder containing a1-a2.json, learned.json, etc.
 */

/** @type {AppConfig} */
module.exports = {
    PORT: 7070,
    ROOT_DIR,
    TRANSCRIPTS_DIR: path.join(ROOT_DIR, 'transcripts'),
    VOCAB_DIR: path.join(ROOT_DIR, 'vocab'),
    GRAMMAR_DIR: path.join(ROOT_DIR, 'grammar'),
    DATA_DIR: path.join(ROOT_DIR, 'data'),
    STATS_PATH: path.join(ROOT_DIR, 'data', 'stats.json'),
};
