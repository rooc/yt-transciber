const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 7070;
const TRANSCRIPTS_DIR = path.join(__dirname, 'transcripts');

// Ensure transcripts directory exists
if (!fs.existsSync(TRANSCRIPTS_DIR)) {
    fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });
}

// === TRANSLATE COMMAND ===
if (process.argv.includes('translate')) {
    runTranslate();
    process.exit(0);
}

function runTranslate() {
    console.log('\n=== TRANSLATE: Processing transcripts ===\n');
    
    const cleanedFiles = [];
    const translationsCreated = [];
    const vocabCreated = [];
    
    // Step 1 & 2: Clean transcripts and create missing translations
    const files = fs.readdirSync(TRANSCRIPTS_DIR);
    const transcriptFiles = files.filter(f => {
        const ext = path.extname(f).toLowerCase();
        return (ext === '.md' || ext === '.txt') && !f.includes('_translation');
    });
    
    transcriptFiles.forEach(filename => {
        const filepath = path.join(TRANSCRIPTS_DIR, filename);
        let content = fs.readFileSync(filepath, 'utf-8');
        
        // Step 1: Clean the file
        const originalContent = content;
        
        // Remove markdown headings
        content = content.replace(/^#+\s+.+$/gm, '');
        
        // Remove section dividers like "---" or "___" (but keep frontmatter ---)
        const lines = content.split('\n');
        let inFrontmatter = false;
        let frontmatterEnded = false;
        const cleanedLines = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Handle frontmatter
            if (line.trim() === '---' && !frontmatterEnded) {
                inFrontmatter = !inFrontmatter;
                if (!inFrontmatter) frontmatterEnded = true;
                cleanedLines.push(line);
                continue;
            }
            
            // Skip section headers like "## Transcript"
            if (/^##?\s+\w+/i.test(line)) continue;
            
            // Skip section dividers
            if (/^[-=]{3,}$/.test(line.trim())) continue;
            
            // Keep timestamp lines and non-empty lines
            if (/\*\*\d{1,2}:\d{2}/.test(line) || line.trim()) {
                cleanedLines.push(line);
            }
        }
        
        // Remove consecutive empty lines
        const finalContent = cleanedLines.join('\n').replace(/\n{3,}/g, '\n\n');
        
        if (finalContent !== originalContent) {
            fs.writeFileSync(filepath, finalContent);
            cleanedFiles.push(filename);
            // Re-read the cleaned content
            content = finalContent;
        }
        
        // Extract video ID from frontmatter
        const sourceMatch = content.match(/source:\s*"([^"]+)"/);
        if (!sourceMatch) {
            console.log(`  ⚠️  ${filename}: No source URL found, skipping`);
            return;
        }
        
        const videoIdMatch = sourceMatch[1].match(/v=([a-zA-Z0-9_-]{11})/);
        if (!videoIdMatch) {
            console.log(`  ⚠️  ${filename}: Could not extract video ID, skipping`);
            return;
        }
        
        const videoId = videoIdMatch[1];
        
        // Step 2: Check for missing translation
        const translationPath = path.join(TRANSCRIPTS_DIR, `${videoId}_translation.md`);
        if (!fs.existsSync(translationPath)) {
            console.log(`  📝 ${filename}: Creating translation file...`);
            // Create translation file with extracted transcript lines
            const titleMatch = content.match(/^title:\s*"([^"]+)"/m);
            const originalTitle = titleMatch ? titleMatch[1] : filename;
            
            // Extract transcript lines with timestamps
            const lines = [];
            const regex = /\*\*(\d{1,2}):(\d{2})(?::(\d{2}))?\*\*\s*[·•]\s*(.+)/g;
            let match;
            while ((match = regex.exec(content)) !== null) {
                const time = match[3] ? `${match[1]}:${match[2]}:${match[3]}` : `${match[1]}:${match[2]}`;
                lines.push({ time, text: match[4].trim() });
            }
            
            // Create translation content with placeholder text
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
        
        // Step 3: Check for missing vocabulary
        const vocabPath = path.join(TRANSCRIPTS_DIR, `${videoId}_vocab.json`);
        if (!fs.existsSync(vocabPath)) {
            console.log(`  📚 ${filename}: Creating vocabulary file...`);
            
            // Load excluded words from both files
            let excludedWords = new Set();
            
            // Load A1-A2 level words
            const a1a2Path = path.join(__dirname, 'a1-a2.json');
            if (fs.existsSync(a1a2Path)) {
                try {
                    const a1a2Data = JSON.parse(fs.readFileSync(a1a2Path, 'utf-8'));
                    const a1a2Words = a1a2Data.excludedWords || [];
                    a1a2Words.forEach(word => excludedWords.add(word));
                    console.log(`     Loaded ${a1a2Words.length} A1-A2 words`);
                } catch (e) {
                    console.log(`     Warning: Could not load a1-a2.json: ${e.message}`);
                }
            }
            
            // Load manually excluded words
            const manualPath = path.join(__dirname, 'manual-exclude.json');
            if (fs.existsSync(manualPath)) {
                try {
                    const manualData = JSON.parse(fs.readFileSync(manualPath, 'utf-8'));
                    const manualWords = manualData.excludedWords || [];
                    manualWords.forEach(word => excludedWords.add(word));
                    console.log(`     Loaded ${manualWords.length} manually excluded words`);
                } catch (e) {
                    console.log(`     Warning: Could not load manual-exclude.json: ${e.message}`);
                }
            }
            
            console.log(`     Total excluded: ${excludedWords.size} words`);
            
            // Extract Spanish text from transcript lines
            const vocab = {};
            const transcriptLines = content.match(/\*\*\d{1,2}:\d{2}[^·]*·\s*(.+)/g) || [];
            
            transcriptLines.forEach(line => {
                const text = line.replace(/^\*\*[^·]+·\s*/, '');
                
                // Extract meaningful words (nouns, verbs, adjectives) - B1+ level only
                const words = text.toLowerCase().match(/[a-záéíóúüñ]+/g) || [];
                words.forEach(word => {
                    // Skip short words and A1-A2 level words
                    if (word.length > 3 && !excludedWords.has(word)) {
                        // Add placeholder translation
                        vocab[word] = '[translation needed]';
                    }
                });
            });
            
            // Sort alphabetically
            const sortedVocab = {};
            Object.keys(vocab).sort().forEach(key => {
                sortedVocab[key] = vocab[key];
            });
            
            fs.writeFileSync(vocabPath, JSON.stringify(sortedVocab, null, 2));
            vocabCreated.push(`${videoId}_vocab.json`);
        }
    });
    
    // Report
    console.log('\n=== LINT REPORT ===\n');
    
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
        console.log('✅ All translations exist');
    }
    
    console.log('');
    
    if (vocabCreated.length > 0) {
        console.log(`📚 Created ${vocabCreated.length} vocabulary file(s):`);
        vocabCreated.forEach(f => console.log(`   - ${f}`));
    } else {
        console.log('✅ All vocabulary files exist');
    }
    
    console.log('\n=== LINT COMPLETE ===\n');
}

function parseTranscriptFile(content, filename) {
    const ext = path.extname(filename).toLowerCase();
    const lines = [];
    
    // Try to extract video ID from frontmatter
    const urlMatch = content.match(/https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
    const videoIdFromUrl = urlMatch ? urlMatch[1] : null;
    
    if (ext === '.md' || ext === '.txt') {
        // Parse format like: **0:00** · Text or **0:00:00** · Text
        // Format is M:SS or MM:SS or H:MM:SS
        const regex = /\*\*(\d{1,2}):(\d{2})(?::(\d{2}))?\*\*\s*[·•]\s*(.+)/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            const first = parseInt(match[1]);
            const second = parseInt(match[2]);
            const third = match[3] ? parseInt(match[3]) : null;
            
            let time;
            if (third !== null) {
                // H:MM:SS format
                time = first * 3600 + second * 60 + third;
            } else {
                // M:SS format
                time = first * 60 + second;
            }
            
            lines.push({ start: time, dur: 3, text: match[4].trim() });
        }
        
        // Also try format: [00:00] Text
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

function getTranscriptForVideo(videoId, type = 'transcript') {
    if (!fs.existsSync(TRANSCRIPTS_DIR)) return null;
    
    const files = fs.readdirSync(TRANSCRIPTS_DIR);
    for (const file of files) {
        // Check if file matches videoId and type
        const fileVideoId = getVideoIdFromFile(fs.readFileSync(path.join(TRANSCRIPTS_DIR, file), 'utf-8'));
        const isMatchingVideo = file.startsWith(videoId) || fileVideoId === videoId;
        
        if (isMatchingVideo) {
            const isTranslation = file.includes('translation') || file.includes('translate');
            if ((type === 'translation' && isTranslation) || (type === 'transcript' && !isTranslation)) {
                const content = fs.readFileSync(path.join(TRANSCRIPTS_DIR, file), 'utf-8');
                const parsed = parseTranscriptFile(content, file);
                if (parsed.length > 0) return parsed;
            }
        }
    }
    return null;
}



function getVideoIdFromFile(content) {
    // Try to extract from frontmatter URL
    const urlMatch = content.match(/https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (urlMatch) return urlMatch[1];
    return null;
}

function convertToXML(transcriptData) {
    return `<?xml version="1.0" encoding="utf-8" ?><transcript>` +
        transcriptData.map(t => 
            `<text start="${t.start}" dur="${t.dur || 3}">${t.text}</text>`
        ).join('') + '</transcript>';
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    // Translation endpoint
    if (url.pathname === '/api/translation') {
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
        return;
    }
    
    // Transcript endpoint
    if (url.pathname === '/api/transcript') {
        const videoId = url.searchParams.get('v');
        
        if (!videoId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Video ID required' }));
            return;
        }
        
        // First check local transcripts folder
        const localTranscript = getTranscriptForVideo(videoId);
        if (localTranscript) {
            res.writeHead(200, { 'Content-Type': 'application/xml' });
            res.end(convertToXML(localTranscript));
            return;
        }
        
        // Try to fetch from YouTube
        const ytUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`;
        
        https.get(ytUrl, (ytRes) => {
            let data = '';
            ytRes.on('data', chunk => data += chunk);
            ytRes.on('end', () => {
                if (ytRes.statusCode === 200 && data.length > 100 && data.includes('<text')) {
                    res.writeHead(200, { 'Content-Type': 'application/xml' });
                    res.end(data);
                } else {
                    // Try without language
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
        return;
    }
    
    // Vocabulary endpoint
    if (url.pathname === '/api/vocab') {
        const videoId = url.searchParams.get('v');
        
        if (!videoId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Video ID required' }));
            return;
        }
        
        const vocabPath = path.join(TRANSCRIPTS_DIR, `${videoId}_vocab.json`);
        if (fs.existsSync(vocabPath)) {
            const vocab = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(vocab));
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({}));
        }
        return;
    }
    
    // Learned videos endpoints
    const learnedPath = path.join(__dirname, 'learned.json');
    
    // GET learned videos
    if (url.pathname === '/api/learned' && req.method === 'GET') {
        try {
            if (fs.existsSync(learnedPath)) {
                const data = fs.readFileSync(learnedPath, 'utf-8');
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
        return;
    }
    
    // POST learned videos (save)
    if (url.pathname === '/api/learned' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                fs.writeFileSync(learnedPath, JSON.stringify(data, null, 2));
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }
    
    // List available transcripts
    if (url.pathname === '/api/transcripts') {
        const files = fs.existsSync(TRANSCRIPTS_DIR) ? fs.readdirSync(TRANSCRIPTS_DIR) : [];
        const grouped = {};
        
        files.forEach(f => {
            // Skip vocab files - only process transcripts and translations
            if (f.includes('_vocab.json')) return;
            const content = fs.readFileSync(path.join(TRANSCRIPTS_DIR, f), 'utf-8');
            const parsed = parseTranscriptFile(content, f);
            const videoId = getVideoIdFromFile(content) || f;
            const isTranslation = f.includes('translation') || f.includes('translate');
            
            // Extract title from frontmatter
            const titleMatch = content.match(/^title:\s*(.+)$/m);
            let fullTitle = titleMatch ? titleMatch[1].trim() : null;
            // Strip surrounding quotes if present
            if (fullTitle && /^["']/.test(fullTitle) && /["']$/.test(fullTitle)) {
                fullTitle = fullTitle.slice(1, -1);
            }
            // Short title (3 words) for sidebar tags
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
                    // Use title from transcript file if not already set
                    if (!grouped[videoId].title && shortTitle) {
                        grouped[videoId].title = shortTitle;
                        grouped[videoId].fullTitle = fullTitle || shortTitle;
                    }
                }
            }
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(Object.values(grouped)));
        return;
    }
    
    // Serve static files
    let filePath = path.join(__dirname, url.pathname === '/' ? 'index.html' : url.pathname);
    
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
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Transcripts folder: ${TRANSCRIPTS_DIR}`);
});
