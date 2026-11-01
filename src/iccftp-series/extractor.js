import { crawlSeriesCatalog } from "./catalog.js";
import {
    loadSeriesIndex,
    searchSeriesIndex
} from "./series-index.js";

import {
    buildEpisodeStream,
    fetchAlternativeTitles,
    fetchTmdbShow,
    finalizeStreams,
    getQuality,
    makeTarget,
    showMatchesTarget
} from "./utils.js";

function recordsToStreams(records, target, season, episode) {
    const exact = records.filter(
        (record) =>
            !record.pack &&
            record.season === season &&
            record.episode === episode
    );

    const chosen =
        exact.length > 0
            ? exact
            : records.filter(
                  (record) =>
                      record.pack && record.season === season
              );

    return finalizeStreams(
        chosen.map((record) =>
            buildEpisodeStream(
                record.url,
                target.name,
                season,
                episode,
                getQuality(record.filename)
            )
        )
    );
}

export async function extractStreams(tmdbId, season, episode) {
    if (!season || !episode) {
        return [];
    }

    const show = await fetchTmdbShow(tmdbId);

    if (!show) {
        return [];
    }

    let target = makeTarget(show);
    let index = null;

    //
    // 1. Pre-built index (fast path)
    //
    try {
        index = await loadSeriesIndex();

        let result = searchSeriesIndex(
            index,
            target,
            season,
            episode
        );

        if (result.streams.length > 0) {
            console.log(
                `[BDIX] Index hit: ${target.name} S${season}E${episode} -> ${result.streams.length} stream(s)`
            );

            return result.streams;
        }

        // The folder may use an alternate title as its primary name.
        const alternativeTitles = await fetchAlternativeTitles(
            tmdbId
        );

        if (alternativeTitles.length > 0) {
            target = makeTarget(show, alternativeTitles);

            result = searchSeriesIndex(
                index,
                target,
                season,
                episode
            );

            if (result.streams.length > 0) {
                console.log(
                    `[BDIX] Index hit (alt title): ${target.name} S${season}E${episode} -> ${result.streams.length} stream(s)`
                );

                return result.streams;
            }
        }

        console.log(
            `[BDIX] Index miss: ${target.name} S${season}E${episode}, crawling servers`
        );
    } catch (err) {
        console.error(
            "[BDIX] Series index unavailable, crawling servers:",
            err.message
        );
    }

    //
    // 2. Live crawl fallback
    //
    const records = await crawlSeriesCatalog({
        shouldCollect: (seasonFolder) =>
            showMatchesTarget(seasonFolder, target)
    });

    const streams = recordsToStreams(
        records,
        target,
        season,
        episode
    );

    if (streams.length > 0) {
        console.log(
            `[BDIX] Crawl hit: ${target.name} S${season}E${episode} -> ${streams.length} stream(s)`
        );
    }

    return streams;
}
