/**
 * Learned videos module.
 *
 * Learned video tracking, drag-and-drop functionality, and persistence.
 */

import * as state from './state.js';
import {
	learnedVideos,
	isLearnedPanelCollapsed,
	availableTranscripts,
	setIsLearnedPanelCollapsed,
	setDraggedVideoId,
	draggedVideoId,
	setActiveIndex,
	transcriptContainer,
	player,
	setCurrentVideoId,
	setCurrentTime,
} from './state.js';
import { setStatus } from './utils.js';
import { 
	saveLearnedVideos as saveLearnedAPI, 
	resetVideoProgress,
	loadAvailableTranscripts as reloadTranscripts 
} from './api.js';
import { updateStatsDisplay, incrementLearnedCount, decrementLearnedCount } from './stats.js';

// Store reference to loadByVideoId for auto-selection after marking as learned
let loadVideoCallback = null;

/**
 * Toggle learned status for a video.
 * @param {string} videoId - Video ID to toggle
 * @param {Function} loadByVideoId - Optional function to load a video by ID (for auto-selection)
 */
export function toggleLearned(videoId, loadByVideoId = null) {
	// Use provided callback or stored callback
	const loadFn = loadByVideoId || loadVideoCallback;
	if (!videoId) return;

	const index = learnedVideos.indexOf(videoId);
	const wasLearned = index > -1;
	
	if (wasLearned) {
		learnedVideos.splice(index, 1);
		// Note: Not decrementing stats - cumulative tracking only increases
	} else {
		learnedVideos.push(videoId);
		incrementLearnedCount();
	}

	// Reset progress for this video
	resetVideoProgress(videoId);
	setStatus(`Progress reset for video`);

	// If marking current video as learned, clear the screen and auto-select first available
	if (!wasLearned && videoId === state.currentVideoId) {
		clearCurrentVideo();
		
		// Auto-select the first available transcript if there is one
		if (loadFn) {
			const remainingUnlearned = availableTranscripts.filter(t => 
				t.videoId !== videoId && !learnedVideos.includes(t.videoId)
			);
			if (remainingUnlearned.length > 0) {
				// Small delay to let the UI update first
				setTimeout(() => {
					loadFn(remainingUnlearned[0].videoId);
					setStatus(`Auto-selected: ${remainingUnlearned[0].title || remainingUnlearned[0].videoId}`);
				}, 100);
			}
		}
	}

	saveLearnedAPI();
	updateStatsDisplay();
	renderTranscriptLists(loadFn);
}

/**
 * Clear the current video from the screen.
 */
function clearCurrentVideo() {
	// Stop and unload the player (not just pause)
	if (player) {
		player.stopVideo();
	}
	
	// Clear the transcript display
	if (transcriptContainer) {
		transcriptContainer.innerHTML = '<div class="loading">Select a transcript to start</div>';
	}
	
	// Reset video title
	const titleEl = document.getElementById("videoTitle");
	if (titleEl) {
		titleEl.textContent = "YouTube Video with Transcript";
		titleEl.href = "#";
	}
	
	// Reset state
	setCurrentVideoId(null);
	setActiveIndex(-1);
	setCurrentTime(0);
	
	// Update progress bar
	const progressFill = document.getElementById("progressFill");
	if (progressFill) {
		progressFill.style.width = "0%";
	}
	
	// Remove active class from all tags
	document.querySelectorAll(".transcript-tag").forEach((tag) => {
		tag.classList.remove("active");
	});
}

/**
 * Toggle the learned panel collapsed state.
 */
export function toggleLearnedPanel() {
	setIsLearnedPanelCollapsed(!isLearnedPanelCollapsed);
	saveLearnedAPI();

	const content = document.getElementById("learnedTags");
	const icon = document.getElementById("learnedToggleIcon");

	content.classList.toggle("collapsed", isLearnedPanelCollapsed);
	icon.textContent = isLearnedPanelCollapsed ? "chevron_right" : "expand_more";
}

/**
 * Setup drag and drop functionality.
 */
export function setupDragAndDrop() {
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

/**
 * Handle drag start event.
 * @param {DragEvent} e - Drag event
 */
function handleDragStart(e) {
	setDraggedVideoId(this.dataset.videoid);
	this.classList.add('dragging');
	e.dataTransfer.effectAllowed = 'move';
	e.dataTransfer.setData('text/plain', draggedVideoId);
}

/**
 * Handle drag end event.
 */
function handleDragEnd() {
	this.classList.remove('dragging');
	setDraggedVideoId(null);

	// Remove drag-over styling from all panels
	document.querySelectorAll('.drag-over').forEach(el => {
		el.classList.remove('drag-over');
	});
}

/**
 * Handle drag over event.
 * @param {DragEvent} e - Drag event
 */
function handleDragOver(e) {
	e.preventDefault();
	e.dataTransfer.dropEffect = 'move';
}

/**
 * Handle drag enter event.
 * @param {DragEvent} e - Drag event
 */
function handleDragEnter(e) {
	e.preventDefault();
	this.classList.add('drag-over');
}

/**
 * Handle drag leave event.
 * @param {DragEvent} e - Drag event
 */
function handleDragLeave(e) {
	this.classList.remove('drag-over');
}

/**
 * Handle drop event.
 * @param {DragEvent} e - Drag event
 */
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

/**
 * Render transcript tag lists (available and learned).
 * @param {Function} loadByVideoId - Function to load a video by ID
 */
export function renderTranscriptLists(loadByVideoId) {
	// Store the callback for use in toggleLearned
	if (loadByVideoId) {
		loadVideoCallback = loadByVideoId;
	}
	
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
				return `<span class="transcript-tag" id="tag-${t.videoId}" draggable="true" data-videoid="${t.videoId}" title="${fullTitle}">${shortTitle}<span class="material-icons icon-sm copy-id" data-videoid="${t.videoId}" title="Copy ID">content_copy</span></span>`;
			})
			.join("");
		
		// Add click handlers
		unlearned.forEach(t => {
			const tag = document.getElementById(`tag-${t.videoId}`);
			if (tag) {
				tag.addEventListener('click', () => loadByVideoId(t.videoId));
			}
		});
		
		// Add copy icon click handlers
		unlearned.forEach(t => {
			const copyBtn = tagsContainer.querySelector(`#tag-${t.videoId} .copy-id`);
			if (copyBtn) {
				copyBtn.addEventListener('click', (e) => {
					e.stopPropagation();
					copyVideoId(t.videoId);
				});
			}
		});
	}

	if (learned.length === 0) {
		learnedContainer.innerHTML = '<span style="color: #666; font-size: 0.85rem;">No learned transcripts yet</span>';
	} else {
		learnedContainer.innerHTML = learned
			.map((t) => {
				const shortTitle = t.title || t.videoId;
				const fullTitle = t.fullTitle || shortTitle;
				return `<span class="transcript-tag learned" id="tag-${t.videoId}" draggable="true" data-videoid="${t.videoId}" title="${fullTitle}">${shortTitle}<span class="material-icons icon-sm copy-id" data-videoid="${t.videoId}" title="Copy ID">content_copy</span></span>`;
			})
			.join("");
		
		// Add click handlers
		learned.forEach(t => {
			const tag = document.getElementById(`tag-${t.videoId}`);
			if (tag) {
				tag.addEventListener('click', () => loadByVideoId(t.videoId));
			}
		});
		
		// Add copy icon click handlers
		learned.forEach(t => {
			const copyBtn = learnedContainer.querySelector(`#tag-${t.videoId} .copy-id`);
			if (copyBtn) {
				copyBtn.addEventListener('click', (e) => {
					e.stopPropagation();
					copyVideoId(t.videoId);
				});
			}
		});
	}

	// Setup drag and drop
	setupDragAndDrop();

	const content = document.getElementById("learnedTags");
	const icon = document.getElementById("learnedToggleIcon");
	content.classList.toggle("collapsed", isLearnedPanelCollapsed);
	icon.textContent = isLearnedPanelCollapsed ? "chevron_right" : "expand_more";
}

/**
 * Get the last watched video based on progress timestamps.
 * @param {Object} videoProgress - Video progress object
 * @returns {string|null} Last watched video ID or null
 */
export function getLastWatchedVideo(videoProgress) {
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

/**
 * Get saved progress for a video.
 * @param {string} videoId - Video ID
 * @param {Object} videoProgress - Video progress object
 * @returns {Object|null} Progress object or null
 */
export function getSavedProgress(videoId, videoProgress) {
	const progress = videoProgress[videoId];
	if (progress && progress.time > 1) {
		return progress;
	}
	return null;
}

/**
 * Copy video ID to clipboard.
 * @param {string} videoId - Video ID to copy
 */
export function copyVideoId(videoId) {
	navigator.clipboard.writeText(videoId).then(() => {
		setStatus(`Copied: ${videoId}`);
		setTimeout(() => {
			setStatus('');
		}, 2000);
	}).catch(err => {
		console.error('Failed to copy:', err);
		setStatus('Failed to copy ID');
	});
}

// Make copyVideoId available globally for the onclick handlers
window.copyVideoId = copyVideoId;
