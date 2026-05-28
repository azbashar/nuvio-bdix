/**
 * FTPBD Provider Entry Point
 */

import { extractStreams } from './extractor.js';

/**
 * Returns available streams for a movie or TV show episode
 * @param {string} tmdbId 
 * @param {string} mediaType - "movie" or "tv"
 * @param {number|null} season 
 * @param {number|null} episode 
 */
export async function getStreams(tmdbId, mediaType, season = null, episode = null) {
    console.log(`[FTPBD] Request received for: ${mediaType} ${tmdbId} (Season: ${season}, Episode: ${episode})`);
    
    try {
        const streams = await extractStreams(tmdbId, mediaType, season, episode);
        return streams;
    } catch (e) {
        console.error(`[FTPBD] Error in getStreams:`, e.message);
        return [];
    }
}
