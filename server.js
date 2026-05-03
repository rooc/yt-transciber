/**
 * Application entry point.
 *
 * Bootstraps the HTTP server on PORT (default 7070) and registers CLI commands:
 *   node server.js          → start the web server
 *   node server.js translate → generate missing translations / vocab files
 *   node server.js vocab     → update vocab files only (skip cleaning/placeholders)
 *   node server.js lint      → validate transcripts and clean up vocab
 */
const http = require('http');
const fs = require('fs');
const { PORT, TRANSCRIPTS_DIR, VOCAB_DIR } = require('./src/config');
const { runVocab } = require('./src/commands/vocab');
const { runTranslate } = require('./src/commands/translate');
const { runLint } = require('./src/commands/lint');
const { setupRoutes } = require('./src/routes');

// Ensure required directories exist at startup
if (!fs.existsSync(TRANSCRIPTS_DIR)) {
    fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });
}
if (!fs.existsSync(VOCAB_DIR)) {
    fs.mkdirSync(VOCAB_DIR, { recursive: true });
}

// === CLI COMMANDS ===
if (process.argv.includes('vocab')) {
    runVocab();
    process.exit(0);
}

if (process.argv.includes('translate')) {
    runTranslate();
    process.exit(0);
}

if (process.argv.includes('lint')) {
    runLint();
    process.exit(0);
}

// === HTTP SERVER ===
const server = http.createServer(setupRoutes);

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Transcripts folder: ${TRANSCRIPTS_DIR}`);
});
