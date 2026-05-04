/**
 * HTTP route handlers.
 *
 * Every exported function receives the parsed `URL` object and/or the raw
 * `http.IncomingMessage` / `http.ServerResponse` and writes the response
 * directly.  Static assets are served from the `public/` folder.
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const { PORT, ROOT_DIR, TRANSCRIPTS_DIR, VOCAB_DIR } = require('./config');
const { parseTranscriptFile, getVideoIdFromFile, convertToXML } = require('./store');
const { getTranscriptForVideo, readVocab } = require('./store');

const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const LEARNED_PATH = path.join(ROOT_DIR, 'data', 'learned.json');
const PROGRESS_PATH = path.join(ROOT_DIR, 'data', 'progress.json');

/**
 * GET /api/translation?v=VIDEO_ID
 *
 * Returns the English translation as YouTube-flavoured XML, or 404.
 *
 * @param {URL} url
 * @param {import('http').ServerResponse} res
 */
function handleTranslation(url, res) {
    const videoId = url.searchParams.get('v');
    if (!videoId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Video ID required' }));
        return;
    }

    const translation = getTranscriptForVideo(videoId, 'translation');
    if (translation) {
        res.writeHead(200, { 'Content-Type': 'application/xml' });
        res.end(convertToXML(translation));
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No translation available' }));
    }
}

/**
 * GET /api/transcript?v=VIDEO_ID
 *
 * Looks for a local transcript first; if none exists, tries YouTube's
 * timedtext endpoint (English first, then any language).
 *
 * @param {URL} url
 * @param {import('http').ServerResponse} res
 */
function handleTranscript(url, res) {
    const videoId = url.searchParams.get('v');
    if (!videoId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Video ID required' }));
        return;
    }

    // 1. Try local transcript
    const localTranscript = getTranscriptForVideo(videoId);
    if (localTranscript) {
        res.writeHead(200, { 'Content-Type': 'application/xml' });
        res.end(convertToXML(localTranscript));
        return;
    }

    // 2. Fallback: fetch from YouTube timedtext API
    const ytUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`;
    https.get(ytUrl, (ytRes) => {
        let data = '';
        ytRes.on('data', chunk => data += chunk);
        ytRes.on('end', () => {
            if (ytRes.statusCode === 200 && data.length > 100 && data.includes('<text')) {
                res.writeHead(200, { 'Content-Type': 'application/xml' });
                res.end(data);
            } else {
                // 3. Second fallback: any language
                const ytUrl2 = `https://www.youtube.com/api/timedtext?v=${videoId}`;
                https.get(ytUrl2, (ytRes2) => {
                    let data2 = '';
                    ytRes2.on('data', chunk => data2 += chunk);
                    ytRes2.on('end', () => {
                        if (ytRes2.statusCode === 200 && data2.length > 100 && data2.includes('<text')) {
                            res.writeHead(200, { 'Content-Type': 'application/xml' });
                            res.end(data2);
                        } else {
                            res.writeHead(404, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'No transcript available' }));
                        }
                    });
                }).on('error', (e) => {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                });
            }
        });
    }).on('error', (e) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
    });
}

/**
 * GET /api/vocab?v=VIDEO_ID
 *
 * Returns the vocabulary map for a video as JSON.  Empty object if none.
 *
 * @param {URL} url
 * @param {import('http').ServerResponse} res
 */
function handleVocab(url, res) {
    const videoId = url.searchParams.get('v');
    if (!videoId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Video ID required' }));
        return;
    }

    const vocab = readVocab(videoId);
    if (vocab) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(vocab));
    } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({}));
    }
}

/**
 * GET /api/learned
 *
 * Load the persisted list of "learned" video IDs and panel state.
 *
 * @param {import('http').ServerResponse} res
 */
function handleLearnedGet(res) {
    try {
        if (fs.existsSync(LEARNED_PATH)) {
            const data = fs.readFileSync(LEARNED_PATH, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ learnedVideos: [], learnedPanelCollapsed: true }));
        }
    } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
    }
}

/**
 * POST /api/learned
 *
 * Save the list of learned video IDs and the panel collapsed state.
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
function handleLearnedPost(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const data = JSON.parse(body);
            fs.writeFileSync(LEARNED_PATH, JSON.stringify(data, null, 2));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
    });
}

/**
 * GET /api/progress
 *
 * Load the persisted video progress (time position per video).
 *
 * @param {import('http').ServerResponse} res
 */
function handleProgressGet(res) {
    try {
        if (fs.existsSync(PROGRESS_PATH)) {
            const data = fs.readFileSync(PROGRESS_PATH, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({}));
        }
    } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
    }
}

/**
 * POST /api/progress
 *
 * Save the current video progress (time position per video).
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
function handleProgressPost(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const data = JSON.parse(body);
            fs.writeFileSync(PROGRESS_PATH, JSON.stringify(data, null, 2));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
    });
}

/**
 * GET /api/transcripts
 *
 * Scan the transcripts directory and return a grouped list of videos
 * with metadata (title, line count, translation availability).
 *
 * @param {import('http').ServerResponse} res
 */
function handleListTranscripts(res) {
    const files = fs.existsSync(TRANSCRIPTS_DIR) ? fs.readdirSync(TRANSCRIPTS_DIR) : [];
    const grouped = {};

    files.forEach(f => {
        if (f.includes('_vocab.json')) return;
        const content = fs.readFileSync(path.join(TRANSCRIPTS_DIR, f), 'utf-8');
        const parsed = parseTranscriptFile(content, f);
        const videoId = getVideoIdFromFile(content) || f;
        const isTranslation = f.includes('translation') || f.includes('translate');

        const titleMatch = content.match(/^title:\s*(.+)$/m);
        let fullTitle = titleMatch ? titleMatch[1].trim() : null;
        if (fullTitle && /^["']/.test(fullTitle) && /["']$/.test(fullTitle)) {
            fullTitle = fullTitle.slice(1, -1);
        }
        let shortTitle = fullTitle;
        if (fullTitle) {
            let displayTitle = fullTitle.replace(/^["\u201C\u2018\u201D\u2019]+/, '');
            const words = displayTitle.split(/\s+/);
            shortTitle = words.slice(0, 3).join(' ');
        }

        if (!grouped[videoId]) {
            grouped[videoId] = { videoId, title: shortTitle, fullTitle: fullTitle || shortTitle, lines: 0, hasTranslation: false };
        }

        if (parsed.length > 0) {
            if (isTranslation) {
                grouped[videoId].hasTranslation = true;
            } else {
                grouped[videoId].lines = parsed.length;
                if (!grouped[videoId].title && shortTitle) {
                    grouped[videoId].title = shortTitle;
                    grouped[videoId].fullTitle = fullTitle || shortTitle;
                }
            }
        }
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(Object.values(grouped)));
}

/**
 * Serve a static file from the `public/` directory.
 *
 * @param {URL} url
 * @param {import('http').ServerResponse} res
 */
function handleStatic(url, res) {
    let filePath = path.join(PUBLIC_DIR, url.pathname === '/' ? 'index.html' : url.pathname);

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end(err.message);
            }
        } else {
            const ext = path.extname(filePath);
            const contentTypes = {
                '.html': 'text/html',
                '.js': 'application/javascript',
                '.css': 'text/css',
                '.json': 'application/json',
                '.svg': 'image/svg+xml',
            };
            res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
            res.end(content);
        }
    });
}

/**
 * Main request router.  Called for every incoming HTTP request.
 *
 * Sets CORS headers, dispatches to the appropriate handler, or falls
 * through to static file serving.
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
function setupRoutes(req, res) {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (url.pathname === '/api/translation') {
        handleTranslation(url, res);
        return;
    }

    if (url.pathname === '/api/transcript') {
        handleTranscript(url, res);
        return;
    }

    if (url.pathname === '/api/vocab') {
        handleVocab(url, res);
        return;
    }

    if (url.pathname === '/api/learned' && req.method === 'GET') {
        handleLearnedGet(res);
        return;
    }

    if (url.pathname === '/api/learned' && req.method === 'POST') {
        handleLearnedPost(req, res);
        return;
    }

    if (url.pathname === '/api/progress' && req.method === 'GET') {
        handleProgressGet(res);
        return;
    }

    if (url.pathname === '/api/progress' && req.method === 'POST') {
        handleProgressPost(req, res);
        return;
    }

    if (url.pathname === '/api/transcripts') {
        handleListTranscripts(res);
        return;
    }

    handleStatic(url, res);
}

module.exports = { setupRoutes };
