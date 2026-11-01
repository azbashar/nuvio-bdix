import {
    DIRECT_ROOTS,
    SERVER_ROOTS
} from "../shared/config.js";

import {
    CARTOON_ROOT_RE,
    MAX_CRAWL_DEPTH,
    OTHER_ROOT_RE,
    SERIES_ROOT_RE
} from "./constants.js";

import { fetchDirectory } from "./http.js";

import {
    isSeasonPackName,
    isSpecialName,
    isVideoFile,
    parseEpisodeFile,
    parseSeasonFolder
} from "./parse.js";

const SKIP_NAMES = new Set([
    "lost+found",
    "$recycle.bin",
    "system volume information"
]);

function isRangeSubfolder(name, showTitle) {
    const lowerName = String(name || "").toLowerCase();
    const lowerShow = String(showTitle || "").toLowerCase();

    if (
        /\bepisodes?\b|\bep\b|episode\s*\d+\s*(?:-|to)\s*episode|^\s*\d{1,4}\s*[-–]\s*\d{1,4}\s*$/i.test(
            name
        )
    ) {
        return true;
    }

    // Range folders often repeat the show name, e.g.
    // "Gintama Episodes (01-12)".
    return Boolean(lowerShow) && lowerName.startsWith(lowerShow);
}

async function mapPool(items, limit, worker) {
    const results = new Array(items.length);
    let cursor = 0;

    async function run() {
        while (cursor < items.length) {
            const index = cursor++;

            try {
                results[index] = await worker(items[index], index);
            } catch {
                results[index] = undefined;
            }
        }
    }

    const workers = [];

    for (let i = 0; i < Math.min(limit, items.length); i++) {
        workers.push(run());
    }

    await Promise.all(workers);

    return results;
}

/**
 * Finds every folder that contains TV shows:
 *   - top-level "TV Show" / "Tv Shows" / "tvshows" / "Web Series" folders
 *   - "Other(s)/Cartoon", "Other(s)/Kids (Cartoon)", ...
 */
export async function discoverSeriesRoots(concurrency = 8) {
    const shares = DIRECT_ROOTS.map((url) => ({ url }));

    const shareLists = await mapPool(
        SERVER_ROOTS,
        concurrency,
        async (url) => {
            try {
                return await fetchDirectory(url);
            } catch (err) {
                console.error(
                    `[BDIX] Could not list ${url}: ${err.message}`
                );
                return [];
            }
        }
    );

    for (const entries of shareLists) {
        if (!entries) continue;

        for (const entry of entries) {
            if (entry.isDirectory) {
                shares.push({ url: entry.url });
            }
        }
    }

    const roots = [];
    const seenRoots = new Set();

    const topLists = await mapPool(
        shares,
        concurrency,
        async (share) => {
            try {
                return {
                    share,
                    entries: await fetchDirectory(share.url)
                };
            } catch {
                return null;
            }
        }
    );

    const cartoonLists = [];

    for (const result of topLists) {
        if (!result) continue;

        for (const entry of result.entries) {
            if (!entry.isDirectory) continue;

            if (SERIES_ROOT_RE.test(entry.name)) {
                if (!seenRoots.has(entry.url)) {
                    seenRoots.add(entry.url);
                    roots.push(entry.url);
                }
            } else if (OTHER_ROOT_RE.test(entry.name)) {
                cartoonLists.push(entry.url);
            }
        }
    }

    const cartoons = await mapPool(
        cartoonLists,
        concurrency,
        async (url) => {
            try {
                return await fetchDirectory(url);
            } catch {
                return [];
            }
        }
    );

    for (const entries of cartoons) {
        if (!entries) continue;

        for (const entry of entries) {
            if (
                !entry.isDirectory ||
                !CARTOON_ROOT_RE.test(entry.name) ||
                seenRoots.has(entry.url)
            ) {
                continue;
            }

            seenRoots.add(entry.url);
            roots.push(entry.url);
        }
    }

    return roots;
}

/**
 * Crawls every series root and returns flat file records:
 *
 *   { title, aliases, year, season, folderSeason, episode, pack, url, filename }
 *
 * `shouldCollect` lets the live fallback skip recording files for shows it
 * does not care about. Folders are still traversed, so nested/mis-filed
 * shows are never lost.
 */
export async function crawlSeriesCatalog({
    concurrency = 8,
    onProgress,
    shouldCollect
} = {}) {
    const roots = await discoverSeriesRoots(concurrency);

    console.log(
        `[BDIX] Crawling ${roots.length} series roots (concurrency=${concurrency})`
    );

    const queue = roots.map((url) => ({ url, depth: 1 }));
    const visited = new Set();
    const records = [];
    const seen = new Set();

    let cursor = 0;
    let directories = 0;

    function addRecord(seasonInfo, file, parsed) {
        const base = {
            title: seasonInfo.title,
            aliases: seasonInfo.aliases,
            year: seasonInfo.year,
            folderSeason: seasonInfo.season,
            url: file.url,
            filename: file.name
        };

        if (!parsed) {
            const key = `${file.url}#pack`;

            if (seen.has(key)) return;

            seen.add(key);

            records.push({
                ...base,
                season: seasonInfo.season,
                episode: null,
                pack: true
            });

            return;
        }

        for (const episode of parsed.episodes) {
            const key = `${file.url}#${parsed.season}#${episode}`;

            if (seen.has(key)) continue;

            seen.add(key);

            records.push({
                ...base,
                season: parsed.season,
                episode,
                pack: false
            });
        }
    }

    async function processDirectory(url, depth) {
        if (visited.has(url) || depth > MAX_CRAWL_DEPTH) {
            return;
        }

        visited.add(url);
        directories++;

        let entries;

        try {
            entries = await fetchDirectory(url);
        } catch (err) {
            if (depth <= 2) {
                console.error(
                    `[BDIX] Could not list ${url}: ${err.message}`
                );
            }

            return;
        }

        const name = url
            .replace(/\/+$/, "")
            .split("/")
            .pop() || "";

        const decodedName = (() => {
            try {
                return decodeURIComponent(name);
            } catch {
                return name;
            }
        })();

        const seasonInfo = SKIP_NAMES.has(decodedName.toLowerCase())
            ? null
            : parseSeasonFolder(decodedName);

        if (
            seasonInfo &&
            (!shouldCollect || shouldCollect(seasonInfo))
        ) {
            const videoFiles = [];
            const subDirectories = [];

            for (const entry of entries) {
                if (entry.isDirectory) {
                    subDirectories.push(entry);
                } else if (isVideoFile(entry.name)) {
                    videoFiles.push(entry);
                }
            }

            // Range packs live one level below the season folder, e.g.
            // "Gintama Episodes (01-12)" or
            // "Naruto Shippuden Episodes (001-010)".
            for (const subDirectory of subDirectories) {
                // A season folder can contain a whole other show (mis-filed)
                // as well as range packs. Only range-looking subfolders
                // belong to this season; anything else is visited separately
                // by the normal crawler.
                if (
                    !isRangeSubfolder(
                        subDirectory.name,
                        seasonInfo.title
                    )
                ) {
                    continue;
                }

                try {
                    const subEntries = await fetchDirectory(
                        subDirectory.url
                    );

                    for (const entry of subEntries) {
                        if (
                            !entry.isDirectory &&
                            isVideoFile(entry.name)
                        ) {
                            videoFiles.push(entry);
                        }
                    }
                } catch {
                    // ignore unreadable range folders
                }
            }

            const onlyFile = videoFiles.length === 1;

            for (const file of videoFiles) {
                const parsed = parseEpisodeFile(
                    file.name,
                    seasonInfo.season
                );

                if (!parsed && isSpecialName(file.name)) {
                    continue;
                }

                if (
                    parsed ||
                    isSeasonPackName(file.name) ||
                    onlyFile
                ) {
                    addRecord(seasonInfo, file, parsed);
                }
            }
        }

        if (depth < MAX_CRAWL_DEPTH) {
            for (const entry of entries) {
                if (
                    entry.isDirectory &&
                    !SKIP_NAMES.has(entry.name.toLowerCase())
                ) {
                    queue.push({
                        url: entry.url,
                        depth: depth + 1
                    });
                }
            }
        }

        if (onProgress && directories % 25 === 0) {
            onProgress({
                directories,
                records: records.length
            });
        }
    }

    async function worker() {
        while (cursor < queue.length) {
            const item = queue[cursor++];

            await processDirectory(item.url, item.depth);
        }
    }

    const workers = [];

    for (let i = 0; i < concurrency; i++) {
        workers.push(worker());
    }

    await Promise.all(workers);

    if (onProgress) {
        onProgress({
            directories,
            records: records.length
        });
    }

    return records;
}
