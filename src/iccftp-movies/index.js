import { extractStreams } from "./extractor.js";

async function getStreams(tmdbId, mediaType) {
    try {
        if (mediaType !== "movie") {
            return [];
        }

        console.log(`[BDIX] Searching movie TMDB=${tmdbId}`);

        return await extractStreams(tmdbId);
    } catch (err) {
        console.error("[BDIX]", err);
        return [];
    }
}

export { getStreams };