import seriesIndex from "../../series_index.json";

import {
    buildEpisodeStream,
    finalizeStreams,
    findEpisodeUrls,
    findShowEntry,
    getQuality
} from "./utils.js";

/**
 * Returns the pre-built series index bundled with the provider.
 */
export async function loadSeriesIndex() {
    return seriesIndex;
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
