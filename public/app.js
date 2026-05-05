/**
 * YT-trans frontend application.
 *
 * Handles YouTube iframe API integration, transcript synchronization,
 * dual-language display, vocabulary highlighting, keyboard shortcuts,
 * and learned-video tracking.
 */

// --- State ---
let transcriptData = [];
let translationData = [];
let hasTranslation = false;
let activeIndex = -1;
let availableTranscripts = [];
let currentTime = 0;
let totalDuration = 0;
let isPaused = false;
let isDualMode = false;
let isFullscreen = false;
let player = null;
let syncInterval = null;
let vocabData = {};
let currentVideoId = null;
let lastRewindTime = 0;
let learnedVideos = [];
let isLearnedPanelCollapsed = true;
let videoProgress = {};

// --- DOM References ---
const statusEl = document.getElementById("status");
const pauseBtn = document.getElementById("pauseBtn");
const dualBtn = document.getElementById("dualBtn");
const fsPauseBtn = document.getElementById("fsPauseBtn");
const fsDualBtn = document.getElementById("fsDualBtn");
const transcriptContainer = document.getElementById("transcript");

// --- Learned Videos (server + localStorage) ---

async function loadLearnedVideos() {
	try {
		const response = await fetch("/api/learned");
		if (response.ok) {
			const data = await response.json();
			learnedVideos = data.learnedVideos || [];
			isLearnedPanelCollapsed = data.learnedPanelCollapsed !== undefined ? data.learnedPanelCollapsed : true;
			console.log("Loaded learned videos from server:", learnedVideos.length);
		} else {
			learnedVideos = JSON.parse(localStorage.getItem("learnedVideos") || "[]");
			isLearnedPanelCollapsed = JSON.parse(localStorage.getItem("learnedPanelCollapsed") || "true");
			console.log("Loaded learned videos from localStorage:", learnedVideos.length);
		}
	} catch (e) {
		learnedVideos = JSON.parse(localStorage.getItem("learnedVideos") || "[]");
		isLearnedPanelCollapsed = JSON.parse(localStorage.getItem("learnedPanelCollapsed") || "true");
		console.log("Loaded learned videos from localStorage (error):", learnedVideos.length);
	}
}

async function saveLearnedVideos() {
	const data = { learnedVideos, learnedPanelCollapsed: isLearnedPanelCollapsed };
	localStorage.setItem("learnedVideos", JSON.stringify(learnedVideos));
	localStorage.setItem("learnedPanelCollapsed", JSON.stringify(isLearnedPanelCollapsed));
	try {
		const response = await fetch("/api/learned", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data)
		});
		if (response.ok) console.log("Saved learned videos to server");
	} catch (e) {
		console.log("Could not save to server, using localStorage only");
	}
}

// --- Stats (server) ---

async function loadStats() {
	try {
		const response = await fetch("/api/stats");
		if (response.ok) {
			const data = await response.json();
			displayStats(data);
			console.log("Loaded stats from server:", data);
		}
	} catch (e) {
		console.log("Could not load stats from server");
	}
}

function displayStats(stats) {
	const learnedEl = document.getElementById("statsLearned");
	const timeEl = document.getElementById("statsTime");
	
	if (learnedEl) {
		learnedEl.textContent = `${stats.totalLearned || 0} video${stats.totalLearned !== 1 ? 's' : ''} learned`;
	}
	
	if (timeEl) {
		const hours = (stats.totalWatchTimeHours || 0).toFixed(1);
		timeEl.textContent = `${hours}h watched`;
	}
}

// --- Video Progress (server + localStorage) ---

async function loadVideoProgress() {
	try {
		const response = await fetch("/api/progress");
		if (response.ok) {
			videoProgress = await response.json();
			console.log("Loaded progress from server:", Object.keys(videoProgress).length, "videos");
		} else {
			videoProgress = JSON.parse(localStorage.getItem("videoProgress") || "{}");
			console.log("Loaded progress from localStorage:", Object.keys(videoProgress).length, "videos");
		}
	} catch (e) {
		videoProgress = JSON.parse(localStorage.getItem("videoProgress") || "{}");
		console.log("Loaded progress from localStorage (error):", Object.keys(videoProgress).length, "videos");
	}
}

async function saveVideoProgress() {
	if (!currentVideoId || !player || !player.getCurrentTime) return;

	const currentTime = player.getCurrentTime();
	const duration = player.getDuration();
	if (duration > 0 && currentTime > 0) {
		videoProgress[currentVideoId] = {
			time: currentTime,
			duration: duration,
			line: activeIndex,
			timestamp: Date.now()
		};

		localStorage.setItem("videoProgress", JSON.stringify(videoProgress));
		try {
			const response = await fetch("/api/progress", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(videoProgress)
			});
			if (response.ok) console.log("Saved progress to server:", currentVideoId, Math.floor(currentTime));
		} catch (e) {
			console.log("Could not save progress to server, using localStorage only");
		}
	}
}

function getSavedProgress(videoId) {
	const progress = videoProgress[videoId];
	if (progress && progress.time > 5) {
		return progress;
	}
	return null;
}

function getLastWatchedVideo() {
	let lastVideo = null;
	let latestTime = 0;

	for (const [videoId, progress] of Object.entries(videoProgress)) {
		if (progress.timestamp > latestTime) {
			latestTime = progress.timestamp;
			lastVideo = videoId;
		}
	}
	return lastVideo;
}

// --- Display & Formatting ---

function setStatus(msg) {
	statusEl.textContent = msg;
}

function formatTime(seconds) {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function parseTranscriptXML(xml) {
	const parser = new DOMParser();
	const doc = parser.parseFromString(xml, "text/xml");
	const texts = doc.querySelectorAll("text");
	const result = [];
	texts.forEach((text) => {
		const start = parseFloat(text.getAttribute("start"));
		const dur = parseFloat(text.getAttribute("dur")) || 3;
		const content = text.textContent.trim();
		if (content) {
			result.push({ time: start, dur: dur, text: content });
		}
	});
	return result;
}

// --- Vocabulary Highlighting ---

function wrapVocabWords(text) {
	if (!vocabData || Object.keys(vocabData).length === 0) return text;

	const matches = [];
	const sorted = Object.keys(vocabData).sort((a, b) => b.length - a.length);

	for (const word of sorted) {
		const regex = new RegExp(`(^|[^\\wáéíóúüñÁÉÍÓÚÜÑ])(${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(?=[^\\wáéíóúüñÁÉÍÓÚÜÑ]|$)`, "gi");
		let match;
		while ((match = regex.exec(text)) !== null) {
			const start = match.index + match[1].length;
			const end = start + word.length;
			const overlaps = matches.some(m => (start < m.end && end > m.start));
			if (!overlaps) {
				matches.push({ start, end, word, text: match[2] });
			}
		}
	}

	matches.sort((a, b) => b.start - a.start);

	let result = text;
	for (const match of matches) {
		const vocabEntry = vocabData[match.word];
		// Handle both old format (string) and new format (object)
		const translation = typeof vocabEntry === 'string' 
			? vocabEntry 
			: (vocabEntry?.translation || match.word);
		const pos = typeof vocabEntry === 'object' ? vocabEntry?.pos : null;
		
		let tooltipContent = translation.replace(/"/g, '&quot;');
		
		const before = result.slice(0, match.start);
		const after = result.slice(match.end);
		const wrapped = `<span class="vocab-word" data-en="${tooltipContent}">${match.text}</span>`;
		result = before + wrapped + after;
	}

	return result;
}

// --- Transcript Rendering ---

function renderTranscriptLine() {
	if (activeIndex < 0 || activeIndex >= transcriptData.length) return;

	const original = wrapVocabWords(transcriptData[activeIndex].text);
	const translated = hasTranslation && translationData[activeIndex]
		? translationData[activeIndex].text
		: null;

	if (isDualMode && translated) {
		transcriptContainer.innerHTML = `
			<div class="transcript-dual">
				<div class="transcript-line original"><span>${original}</span></div>
				<div class="transcript-line translated"><span>${translated}</span></div>
			</div>`;
	} else {
		transcriptContainer.innerHTML = `<div class="transcript-line"><span>${original}</span></div>`;
	}
}

function updateDisplay() {
	if (transcriptData.length === 0) return;

	let newIndex = -1;
	for (let i = 0; i < transcriptData.length; i++) {
		if (transcriptData[i].time <= currentTime) {
			newIndex = i;
		} else {
			break;
		}
	}

	if (newIndex !== activeIndex && newIndex >= 0) {
		activeIndex = newIndex;
		renderTranscriptLine();
	}

	if (totalDuration > 0) {
		document.getElementById("progressFill").style.width =
			`${(currentTime / totalDuration) * 100}%`;
	}

	setStatus(
		`${formatTime(currentTime)} / ${formatTime(totalDuration)} | Line ${activeIndex + 1}/${transcriptData.length} ${isPaused ? "(PAUSED)" : ""}`,
	);
}

function syncFromVideo() {
	if (!player || !player.getCurrentTime) return;
	currentTime = player.getCurrentTime();
	updateDisplay();
}

function startSync() {
	if (syncInterval) clearInterval(syncInterval);
	syncInterval = setInterval(syncFromVideo, 200);
}

// --- Playback Controls ---

function setPaused(paused) {
	if (isPaused === paused) return;
	isPaused = paused;

	const icon = pauseBtn.querySelector(".material-icons");
	const fsIcon = fsPauseBtn.querySelector(".material-icons");

	if (isPaused) {
		if (icon) icon.textContent = "play_arrow";
		if (fsIcon) fsIcon.textContent = "play_arrow";
		pauseBtn.classList.add("active");
		fsPauseBtn.classList.add("active");
		if (player) player.pauseVideo();
	} else {
		if (icon) icon.textContent = "pause";
		if (fsIcon) fsIcon.textContent = "pause";
		pauseBtn.classList.remove("active");
		fsPauseBtn.classList.remove("active");
		if (player) player.playVideo();
	}

	updateDisplay();
}

function togglePause() {
	setPaused(!isPaused);
	saveVideoProgress();
}

function restartVideo() {
	currentTime = 0;
	activeIndex = -1;
	isPaused = false;

	if (player) {
		player.seekTo(0, true);
		player.playVideo();
	}

	// Reset progress for current video only
	if (currentVideoId) {
		videoProgress[currentVideoId] = {
			time: 0,
			duration: player ? player.getDuration() : 0,
			line: 0,
			timestamp: Date.now()
		};
		localStorage.setItem("videoProgress", JSON.stringify(videoProgress));
		// Save to server asynchronously (don't wait)
		fetch("/api/progress", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(videoProgress)
		}).catch(() => {});
	}

	const icon = pauseBtn.querySelector(".material-icons");
	if (icon) icon.textContent = "pause";
	pauseBtn.classList.remove("active");

	setStatus("Restarted");
	updateDisplay();
}

function rewindBack() {
	const now = Date.now();
	const isDoubleTap = now - lastRewindTime < 500;
	lastRewindTime = now;

	if (isDoubleTap && activeIndex > 0) {
		currentTime = transcriptData[activeIndex - 1].time;
	} else if (activeIndex >= 0) {
		currentTime = transcriptData[activeIndex].time;
	} else {
		currentTime = Math.max(0, currentTime - 10);
	}
	activeIndex = -1;

	if (player) player.seekTo(currentTime, true);
	updateDisplay();
}

function rewindForward() {
	if (activeIndex >= 0 && activeIndex < transcriptData.length - 1) {
		currentTime = transcriptData[activeIndex + 1].time;
	} else {
		currentTime = currentTime + 10;
	}
	activeIndex = -1;

	if (player) player.seekTo(currentTime, true);
	updateDisplay();
}

// --- Mode Toggles ---

function toggleDual() {
	isDualMode = !isDualMode;
	dualBtn.classList.toggle("active", isDualMode);
	fsDualBtn.classList.toggle("active", isDualMode);
	if (activeIndex >= 0) renderTranscriptLine();
}

function toggleFullscreen() {
	isFullscreen = !isFullscreen;
	document.body.classList.toggle("fullscreen", isFullscreen);

	const fsPauseIcon = fsPauseBtn.querySelector(".material-icons");
	const pauseIcon = pauseBtn.querySelector(".material-icons");
	if (fsPauseIcon && pauseIcon) {
		fsPauseIcon.textContent = pauseIcon.textContent;
	}
	fsPauseBtn.classList.toggle("active", isPaused);
	fsDualBtn.classList.toggle("active", isDualMode);
}

// --- Learned Tracking ---

function toggleLearned(videoId) {
	if (!videoId) return;

	const index = learnedVideos.indexOf(videoId);
	if (index > -1) {
		learnedVideos.splice(index, 1);
	} else {
		learnedVideos.push(videoId);
	}

	// Reset progress for this video
	if (videoProgress[videoId]) {
		delete videoProgress[videoId];
		localStorage.setItem("videoProgress", JSON.stringify(videoProgress));
		// Also save to server
		fetch("/api/progress", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(videoProgress)
		}).catch(() => {});
		setStatus(`Progress reset for video`);
	}

	saveLearnedVideos();
	loadAvailableTranscripts();
}

function toggleLearnedPanel() {
	isLearnedPanelCollapsed = !isLearnedPanelCollapsed;
	saveLearnedVideos();

	const content = document.getElementById("learnedTags");
	const icon = document.getElementById("learnedToggleIcon");

	content.classList.toggle("collapsed", isLearnedPanelCollapsed);
	icon.textContent = isLearnedPanelCollapsed ? "chevron_right" : "expand_more";
}

// --- Drag and Drop ---

function setupDragAndDrop() {
	const tags = document.querySelectorAll('.transcript-tag[draggable="true"]');
	const availablePanel = document.getElementById('transcriptTags');
	const learnedPanel = document.getElementById('learnedTags');

	tags.forEach(tag => {
		tag.addEventListener('dragstart', handleDragStart);
		tag.addEventListener('dragend', handleDragEnd);
	});

	[availablePanel, learnedPanel].forEach(panel => {
		if (panel) {
			panel.addEventListener('dragover', handleDragOver);
			panel.addEventListener('dragenter', handleDragEnter);
			panel.addEventListener('dragleave', handleDragLeave);
			panel.addEventListener('drop', handleDrop);
		}
	});
}

let draggedVideoId = null;

function handleDragStart(e) {
	draggedVideoId = this.dataset.videoid;
	this.classList.add('dragging');
	e.dataTransfer.effectAllowed = 'move';
	e.dataTransfer.setData('text/plain', draggedVideoId);
}

function handleDragEnd(e) {
	this.classList.remove('dragging');
	draggedVideoId = null;

	// Remove drag-over styling from all panels
	document.querySelectorAll('.drag-over').forEach(el => {
		el.classList.remove('drag-over');
	});
}

function handleDragOver(e) {
	e.preventDefault();
	e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
	e.preventDefault();
	this.classList.add('drag-over');
}

function handleDragLeave(e) {
	this.classList.remove('drag-over');
}

function handleDrop(e) {
	e.preventDefault();
	this.classList.remove('drag-over');

	const videoId = e.dataTransfer.getData('text/plain');
	if (!videoId) return;

	// Determine which panel we dropped on
	const isLearnedPanel = this.id === 'learnedTags';
	const isCurrentlyLearned = learnedVideos.includes(videoId);

	// Toggle learned status based on drop target
	if (isLearnedPanel && !isCurrentlyLearned) {
		// Dropped on learned panel but not learned yet - mark as learned
		toggleLearned(videoId);
	} else if (!isLearnedPanel && isCurrentlyLearned) {
		// Dropped on available panel but is learned - unmark as learned
		toggleLearned(videoId);
	}
	// If dropped on same panel, do nothing
}

// Copy video ID to clipboard
function copyVideoId(videoId) {
	navigator.clipboard.writeText(videoId).then(() => {
		setStatus(`Copied: ${videoId}`);
		setTimeout(() => {
			updateDisplay();
		}, 2000);
	}).catch(err => {
		console.error('Failed to copy:', err);
		setStatus('Failed to copy ID');
	});
}

// --- Data Fetching ---

async function loadAvailableTranscripts() {
	try {
		const response = await fetch("/api/transcripts");
		availableTranscripts = await response.json();

		const tagsContainer = document.getElementById("transcriptTags");
		const learnedContainer = document.getElementById("learnedTags");

		const unlearned = availableTranscripts.filter(t => !learnedVideos.includes(t.videoId));
		const learned = availableTranscripts.filter(t => learnedVideos.includes(t.videoId));

		if (unlearned.length === 0) {
			tagsContainer.innerHTML = '<span style="color: #666">No transcripts to learn</span>';
		} else {
			tagsContainer.innerHTML = unlearned
				.map((t) => {
					const shortTitle = t.title || t.videoId;
					const fullTitle = t.fullTitle || shortTitle;
					return `<span class="transcript-tag" id="tag-${t.videoId}" draggable="true" data-videoid="${t.videoId}" onclick="loadByVideoId('${t.videoId}')" title="${fullTitle}">${shortTitle}<span class="material-icons icon-sm copy-id" onclick="event.stopPropagation(); copyVideoId('${t.videoId}')" title="Copy ID">content_copy</span></span>`;
				})
				.join("");
		}

		if (learned.length === 0) {
			learnedContainer.innerHTML = '<span style="color: #666; font-size: 0.85rem;">No learned transcripts yet</span>';
		} else {
			learnedContainer.innerHTML = learned
				.map((t) => {
					const shortTitle = t.title || t.videoId;
					const fullTitle = t.fullTitle || shortTitle;
					return `<span class="transcript-tag learned" id="tag-${t.videoId}" draggable="true" data-videoid="${t.videoId}" onclick="loadByVideoId('${t.videoId}')" title="${fullTitle}">${shortTitle}<span class="material-icons icon-sm copy-id" onclick="event.stopPropagation(); copyVideoId('${t.videoId}')" title="Copy ID">content_copy</span></span>`;
				})
				.join("");
		}

		// Setup drag and drop
		setupDragAndDrop();

		const content = document.getElementById("learnedTags");
		const icon = document.getElementById("learnedToggleIcon");
		content.classList.toggle("collapsed", isLearnedPanelCollapsed);
		icon.textContent = isLearnedPanelCollapsed ? "chevron_right" : "expand_more";
	} catch (e) {
		console.error("Failed to load transcript list:", e);
	}
}

async function fetchTranscript(videoId) {
	transcriptContainer.innerHTML = '<div class="loading">Loading transcript...</div>';

	try {
		const response = await fetch(`/api/transcript?v=${videoId}`);
		if (!response.ok) throw new Error("No transcript available");

		const contentType = response.headers.get("content-type");
		if (contentType && contentType.includes("json")) {
			const json = await response.json();
			throw new Error(json.error || "No transcript");
		}

		const xml = await response.text();
		transcriptData = parseTranscriptXML(xml);

		if (transcriptData.length === 0) throw new Error("Empty transcript");

		totalDuration = transcriptData[transcriptData.length - 1].time +
			transcriptData[transcriptData.length - 1].dur;

		setStatus(`Loaded ${transcriptData.length} lines, duration: ${formatTime(totalDuration)}`);
	} catch (error) {
		console.error("Transcript error:", error);
		transcriptContainer.innerHTML = `<div class="error">No transcript available</div>`;
	}
}

async function fetchTranslation(videoId) {
	try {
		const response = await fetch(`/api/translation?v=${videoId}`);
		if (!response.ok) { hasTranslation = false; return; }

		const contentType = response.headers.get("content-type");
		if (contentType && contentType.includes("json")) { hasTranslation = false; return; }

		const xml = await response.text();
		translationData = parseTranscriptXML(xml);
		hasTranslation = translationData.length > 0;
	} catch (e) {
		hasTranslation = false;
	}
}

async function fetchVocab(videoId) {
	try {
		const response = await fetch(`/api/vocab?v=${videoId}`);
		if (!response.ok) { vocabData = {}; return; }
		vocabData = await response.json();
	} catch (e) {
		vocabData = {};
	}
}

async function fetchGrammar(videoId) {
	try {
		const response = await fetch(`/api/grammar?v=${videoId}`);
		if (!response.ok) { 
			document.getElementById("grammarSentences").innerHTML = 'No grammar sentences available';
			return; 
		}
		const grammar = await response.json();
		renderGrammarSentences(grammar);
	} catch (e) {
		document.getElementById("grammarSentences").innerHTML = 'No grammar sentences available';
	}
}

let currentGrammarData = [];

function renderGrammarSentences(grammar) {
	const container = document.getElementById("grammarSentences");
	currentGrammarData = grammar || [];
	
	if (!grammar || grammar.length === 0) {
		container.innerHTML = 'No grammar sentences available for this video';
		return;
	}
	
	let html = '<div class="grammar-tags">';
	grammar.forEach((item, index) => {
		// Extract first 3-4 words for the tag
		const shortText = item.spanish.split(' ').slice(0, 4).join(' ') + '...';
		html += `
			<div class="grammar-tag" onclick="showGrammarModal(${index})" title="Click to see full sentence">
				<span class="grammar-tag-number">${index + 1}</span>
				<span class="grammar-tag-text">${shortText}</span>
			</div>
		`;
	});
	html += '</div>';
	
	container.innerHTML = html;
}

function showGrammarModal(index) {
	const item = currentGrammarData[index];
	if (!item) return;
	
	const modal = document.getElementById("grammarModal");
	const content = document.getElementById("grammarModalContent");
	
	content.innerHTML = `
		<div class="grammar-modal-item">
			<div class="grammar-modal-icon">
				<span class="material-icons">menu_book</span>
			</div>
			<div class="grammar-modal-text">
				<div class="grammar-modal-spanish">${item.spanish}</div>
				<div class="grammar-modal-english">${item.english}</div>
				<div class="grammar-modal-explanation">${item.explanation}</div>
			</div>
		</div>
	`;
	
	modal.classList.add("active");
}

function closeGrammarModal() {
	const modal = document.getElementById("grammarModal");
	modal.classList.remove("active");
}

// Close modal when clicking outside
window.onclick = function(event) {
	const modal = document.getElementById("grammarModal");
	if (event.target === modal) {
		closeGrammarModal();
	}
}

// Close modal with ESC key
document.addEventListener('keydown', function(event) {
	const modal = document.getElementById("grammarModal");
	if (event.key === "Escape" && modal.classList.contains("active")) {
		closeGrammarModal();
	}
});

let isGrammarPanelCollapsed = true;

function toggleGrammarPanel() {
	isGrammarPanelCollapsed = !isGrammarPanelCollapsed;
	
	const content = document.getElementById("grammarContent");
	const icon = document.getElementById("grammarToggleIcon");
	
	content.classList.toggle("collapsed", isGrammarPanelCollapsed);
	icon.textContent = isGrammarPanelCollapsed ? "expand_more" : "expand_less";
}

// --- Video Loading ---

function loadByVideoId(videoId) {
	if (currentVideoId && currentVideoId !== videoId) {
		saveVideoProgress();
	}
	currentVideoId = videoId;
	document.querySelectorAll(".transcript-tag").forEach((tag) => {
		tag.classList.remove("active");
	});
	const activeTag = document.getElementById(`tag-${videoId}`);
	if (activeTag) activeTag.classList.add("active");
	loadVideo(videoId);
}

function loadVideo(videoId) {
	if (!videoId) return;

	saveVideoProgress();

	if (syncInterval) clearInterval(syncInterval);
	isPaused = false;
	activeIndex = -1;

	const icon = pauseBtn.querySelector(".material-icons");
	if (icon) icon.textContent = "pause";
	pauseBtn.classList.remove("active");

	const titleEl = document.getElementById("videoTitle");
	const transcript = availableTranscripts.find((t) => t.videoId === videoId);
	if (transcript && transcript.fullTitle) {
		titleEl.textContent = transcript.fullTitle;
	} else {
		titleEl.textContent = `Video: ${videoId}`;
	}

	Promise.all([
		fetchTranscript(videoId),
		fetchTranslation(videoId),
		fetchVocab(videoId),
		fetchGrammar(videoId),
	]).then(() => {
		const savedProgress = getSavedProgress(videoId);
		const loadingOverlay = document.getElementById("videoLoadingOverlay");

		// Show loading overlay if we have saved progress
		if (savedProgress && loadingOverlay) {
			loadingOverlay.classList.remove("hidden");
		}

		if (player) {
			player.addEventListener("onStateChange", onPlayerStateChange);
			// Use cueVideoById instead of loadVideoById to prevent autoplay
			player.cueVideoById(videoId);
			// Then seek and play after a short delay
			setTimeout(() => {
				if (savedProgress) {
					player.seekTo(savedProgress.time, true);
					setStatus(`Resumed at ${formatTime(savedProgress.time)}`);
				}
				player.playVideo();
				// Hide overlay after playing
				setTimeout(() => {
					if (loadingOverlay) loadingOverlay.classList.add("hidden");
				}, 300);
			}, 500);
		} else {
			player = new YT.Player("player", {
				videoId: videoId,
				playerVars: { playsinline: 1, rel: 0, autoplay: 0 },
				events: {
					onReady: () => {
						startSync();
						if (savedProgress) {
							// Pause first to prevent sound from beginning
							player.pauseVideo();
							player.seekTo(savedProgress.time, true);
							setStatus(`Resumed at ${formatTime(savedProgress.time)}`);
							// Small delay then play
							setTimeout(() => {
								player.playVideo();
								// Hide overlay after playing
								setTimeout(() => {
									if (loadingOverlay) loadingOverlay.classList.add("hidden");
								}, 300);
							}, 200);
						} else {
							player.playVideo();
							if (loadingOverlay) loadingOverlay.classList.add("hidden");
						}
					},
					onStateChange: onPlayerStateChange,
				},
			});
		}

		startSync();
	});
}

function onPlayerStateChange(e) {
	if (e.data === YT.PlayerState.PLAYING) {
		isPaused = false;
		const icon = pauseBtn.querySelector(".material-icons");
		if (icon) icon.textContent = "pause";
		pauseBtn.classList.remove("active");
	} else if (e.data === YT.PlayerState.PAUSED) {
		isPaused = true;
		const icon = pauseBtn.querySelector(".material-icons");
		if (icon) icon.textContent = "play_arrow";
		pauseBtn.classList.add("active");
	}
}

// --- Initialization ---

window.onload = async function() {
	await loadLearnedVideos();
	await loadVideoProgress();
	await loadAvailableTranscripts();
	await loadStats();

	const lastVideoId = getLastWatchedVideo();
	if (lastVideoId) {
		loadByVideoId(lastVideoId);
	}
};

// --- Save progress on page unload ---
window.addEventListener("beforeunload", () => {
	saveVideoProgress();
});

// --- Keyboard Shortcuts ---

document.addEventListener("keydown", function (e) {
	if (e.code === "Space") {
		e.preventDefault();
		togglePause();
	}
	if (e.code === "ArrowLeft") {
		e.preventDefault();
		rewindBack();
	}
	if (e.code === "ArrowRight") {
		e.preventDefault();
		rewindForward();
	}
	if (e.code === "KeyD" && !e.ctrlKey && !e.metaKey) {
		e.preventDefault();
		toggleDual();
	}
	if (e.code === "KeyF" && !e.ctrlKey && !e.metaKey) {
		e.preventDefault();
		toggleFullscreen();
	}
	if (e.code === "KeyL" && !e.ctrlKey && !e.metaKey) {
		e.preventDefault();
		toggleLearned(currentVideoId);
	}
});
