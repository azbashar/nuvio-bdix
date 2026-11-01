import { extractStreams } from "./extractor.js";

async function getStreams(tmdbId, mediaType, season, episode) {
    try {
        if (mediaType !== "tv") {
            return [];
        }

        console.log(
            `[BDIX] Searching TV TMDB=${tmdbId} S${season}E${episode}`
        );

        return await extractStreams(
            tmdbId,
            Number(season),
            Number(episode)
        );
    } catch (err) {
        console.error("[BDIX]", err);
        return [];
    }
}

export { getStreams };
