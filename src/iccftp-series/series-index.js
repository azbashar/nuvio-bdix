import { SERIES_INDEX_URL } from "./constants.js";

import {
    buildEpisodeStream,
    finalizeStreams,
    findEpisodeUrls,
    findShowEntry,
    getQuality
} from "./utils.js";

/**
 * Downloads the pre-built series index. No local caching: the hosted JSON is
 * the cache, so every lookup reflects the last published index.
 */
export async function loadSeriesIndex() {
    const res = await fetch(SERIES_INDEX_URL, {
        headers: {
            Accept: "application/json"
        }
    });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    if (
        !data ||
        typeof data.shows !== "object" ||
        data.shows === null
    ) {
        throw new Error("invalid index format");
    }

    return data;
}

/**
 * Looks up a show + season + episode in the pre-built index.
 *
 * @returns {{found: boolean, match?: object, streams: Array}}
 */
export function searchSeriesIndex(index, target, season, episode) {
    const match = findShowEntry(index, target);

    if (!match) {
        return { found: false, streams: [] };
    }

    const urls = findEpisodeUrls(match.show, season, episode);

    if (urls.length === 0) {
        return { found: true, match, streams: [] };
    }

    const streams = urls.map((url) => {
        const filename = String(url).split("/").filter(Boolean).pop() || "";
        const quality = getQuality(filename);

        return buildEpisodeStream(
            url,
            target.name,
            season,
            episode,
            quality
        );
    });

    return {
        found: true,
        match,
        streams: finalizeStreams(streams)
    };
}
