/**
 * Statistics module.
 *
 * Learning statistics tracking, watch time, and display.
 */

import {
	statsData,
	videoWatchSessions,
	currentVideoId,
	setVideoWatchSessions,
	setStatsData,
} from './state.js';
import { saveStats } from './api.js';

/**
 * Update statistics display in the UI.
 */
export function updateStatsDisplay() {
	const learnedEl = document.getElementById("statsLearned");
	const timeEl = document.getElementById("statsTime");
	
	if (learnedEl) {
		learnedEl.textContent = `${statsData.totalLearned || 0} video${statsData.totalLearned !== 1 ? 's' : ''} learned`;
	}
	
	if (timeEl) {
		const hours = (statsData.totalWatchTimeHours || 0).toFixed(1);
		timeEl.textContent = `${hours}h watched`;
	}
}

/**
 * Increment the learned videos count.
 * @param {string} videoId - Video ID being marked as learned
 */
export function incrementLearnedCount(videoId) {
	// Track which videos have been counted to avoid duplicates
	const countedVideos = statsData.countedLearnedVideos || [];
	if (videoId && countedVideos.includes(videoId)) {
		// Already counted this video, don't increment again
		return;
	}
	
	const newCountedVideos = videoId ? [...countedVideos, videoId] : countedVideos;
	
	setStatsData({
		...statsData,
		totalLearned: (statsData.totalLearned || 0) + 1,
		countedLearnedVideos: newCountedVideos
	});
	saveStats();
	updateStatsDisplay();
}

/**
 * Decrement the learned videos count.
 */
export function decrementLearnedCount() {
	setStatsData({
		...statsData,
		totalLearned: Math.max(0, (statsData.totalLearned || 0) - 1)
	});
	saveStats();
	updateStatsDisplay();
}

/**
 * Start a watch session for tracking watch time.
 */
export function startWatchSession() {
	if (!currentVideoId) return;
	
	const updatedSessions = {
		...videoWatchSessions,
		[currentVideoId]: {
			startTime: Date.now(),
			lastSavedTime: 0
		}
	};
	setVideoWatchSessions(updatedSessions);
}

/**
 * End a watch session and add to total watch time.
 */
export function endWatchSession() {
	if (!currentVideoId || !videoWatchSessions[currentVideoId]) return;
	
	const session = videoWatchSessions[currentVideoId];
	const elapsedMs = Date.now() - session.startTime;
	const elapsedHours = elapsedMs / (1000 * 60 * 60);
	
	// Only count if user watched at least 10 seconds
	if (elapsedHours > 0.003) {
		setStatsData({
			...statsData,
			totalWatchTimeHours: (statsData.totalWatchTimeHours || 0) + elapsedHours
		});
		saveStats();
		updateStatsDisplay();
	}
	
	const updatedSessions = { ...videoWatchSessions };
	delete updatedSessions[currentVideoId];
	setVideoWatchSessions(updatedSessions);
}
