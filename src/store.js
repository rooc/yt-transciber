/**
 * Data-access layer ("store").
 *
 * Handles all filesystem I/O for transcripts and vocab files, plus parsing
 * between the internal markdown format and the XML payload the frontend expects.
 *
 * Transcript line format (markdown):
 *   **M:SS** · Some text here
 *
 * Internal representation:
 *   { start: number, dur: number, text: string }
 */
const path = require('path');
const fs = require('fs');
const { TRANSCRIPTS_DIR, VOCAB_DIR } = require('./config');

/**
 * Parse a markdown transcript file into timed lines.
 *
 * Supports two timestamp formats:
 *   **H:MM:SS** · Text  (or **MM:SS** · Text)
 *   [MM:SS] Text          (fallback)
 *
 * @param {string} content  — raw file content
 * @param {string} filename — used to decide parser based on extension
 * @returns {{ start: number, dur: number, text: string }[]}
 */
function parseTranscriptFile(content, filename) {
    const ext = path.extname(filename).toLowerCase();
    const lines = [];

    if (ext === '.md' || ext === '.txt') {
        // Primary format: **H:MM:SS** · Text or **MM:SS** · Text
        const regex = /\*\*(\d{1,2}):(\d{2})(?::(\d{2}))?\*\*\s*[·•]\s*(.+)/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            const first = parseInt(match[1]);
            const second = parseInt(match[2]);
            const third = match[3] ? parseInt(match[3]) : null;

            let time;
            if (third !== null) {
                // H:MM:SS
                time = first * 3600 + second * 60 + third;
            } else {
                // M:SS
                time = first * 60 + second;
            }

            lines.push({ start: time, dur: 3, text: match[4].trim() });
        }

        // Fallback format: [00:00] Text
        if (lines.length === 0) {
            const regex2 = /\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]\s*(.+)/g;
            while ((match = regex2.exec(content)) !== null) {
                const first = parseInt(match[1]);
                const second = parseInt(match[2]);
                const third = match[3] ? parseInt(match[3]) : null;

                let time;
                if (third !== null) {
                    time = first * 3600 + second * 60 + third;
                } else {
                    time = first * 60 + second;
                }

                lines.push({ start: time, dur: 3, text: match[4].trim() });
            }
        }
    }

    return lines;
}

/**
 * Extract an 11-character YouTube video ID from file content.
 *
 * Looks for the first `source:` URL in YAML frontmatter.
 *
 * @param {string} content
 * @returns {string | null}
 */
function getVideoIdFromFile(content) {
    const urlMatch = content.match(/https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (urlMatch) return urlMatch[1];
    return null;
}

/**
 * Convert the internal transcript array into the XML format the frontend uses.
 *
 * @param {{ start: number, dur?: number, text: string }[]} transcriptData
 * @returns {string}
 */
function convertToXML(transcriptData) {
    return `<?xml version="1.0" encoding="utf-8" ?><transcript>` +
        transcriptData.map(t =>
            `<text start="${t.start}" dur="${t.dur || 3}">${t.text}</text>`
        ).join('') + '</transcript>';
}

/**
 * Find and parse a transcript (original or translation) for a given video ID.
 *
 * Searches by either the filename prefix or the `source:` URL inside the file.
 *
 * @param {string} videoId
 * @param {'transcript' | 'translation'} [type='transcript']
 * @returns {{ start: number, dur: number, text: string }[] | null}
 */
function getTranscriptForVideo(videoId, type = 'transcript') {
    if (!fs.existsSync(TRANSCRIPTS_DIR)) return null;

    const files = fs.readdirSync(TRANSCRIPTS_DIR);
    for (const file of files) {
        const content = fs.readFileSync(path.join(TRANSCRIPTS_DIR, file), 'utf-8');
        const fileVideoId = getVideoIdFromFile(content) || file;
        const isMatchingVideo = file.startsWith(videoId) || fileVideoId === videoId;
        const isTranslation = file.includes('translation') || file.includes('translate');

        if (isMatchingVideo) {
            if ((type === 'translation' && isTranslation) || (type === 'transcript' && !isTranslation)) {
                const parsed = parseTranscriptFile(content, file);
                if (parsed.length > 0) return parsed;
            }
        }
    }
    return null;
}

/**
 * Read the vocabulary JSON for a video.
 *
 * @param {string} videoId
 * @returns {Object.<string, string> | null}
 */
function readVocab(videoId) {
    const vocabPath = path.join(VOCAB_DIR, `${videoId}_vocab.json`);
    if (!fs.existsSync(vocabPath)) return null;
    return JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));
}

module.exports = {
    parseTranscriptFile,
    getVideoIdFromFile,
    convertToXML,
    getTranscriptForVideo,
    readVocab,
};
