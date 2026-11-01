#!/usr/bin/env node

/**
 * Builds series_index.json by crawling every configured BDIX server.
 *
 * Usage:
 *   node scripts/generate-series-index.mjs
 *
 * Env:
 *   BDIX_CONCURRENCY=8   number of parallel directory requests
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { crawlSeriesCatalog } from "../src/iccftp-series/catalog.js";
import { normalizeTitle } from "../src/iccftp-series/utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const outFile = path.join(repoRoot, "series_index.json");

const concurrency = Number(process.env.BDIX_CONCURRENCY || 8);
const startedAt = Date.now();

let lastProgressAt = 0;

console.log(
    `[series-index] crawling BDIX servers (concurrency=${concurrency})...`
);

const records = await crawlSeriesCatalog({
    concurrency,
    onProgress: ({ directories, records: found }) => {
        const now = Date.now();

        if (now - lastProgressAt < 2000) return;

        lastProgressAt = now;
        console.log(
            `[series-index] ${directories} directories scanned, ${found} files found`
        );
    }
});

const shows = new Map();

for (const record of records) {
    const key = normalizeTitle(record.title);

    if (!key) continue;

    let show = shows.get(key);

    if (!show) {
        show = {
            title: record.title.trim(),
            aliases: new Map(),
            seasons: new Map()
        };

        shows.set(key, show);
    } else if (record.title.trim() < show.title) {
        // Crawl order is concurrent; keep the title deterministic.
        show.title = record.title.trim();
    }

    for (const alias of record.aliases || []) {
        const aliasKey = normalizeTitle(alias);

        if (aliasKey && aliasKey !== key) {
            show.aliases.set(aliasKey, alias.trim());
        }
    }

    const seasonKey = String(record.season);
    let season = show.seasons.get(seasonKey);

    if (!season) {
        season = {
            year: null,
            episodes: new Map(),
            packs: new Set()
        };

        show.seasons.set(seasonKey, season);
    }

    if (!season.year && record.year) {
        season.year = record.year;
    }

    if (record.pack) {
        season.packs.add(record.url);
    } else {
        const episodeKey = String(record.episode);
        const urls =
            season.episodes.get(episodeKey) || [];

        if (!urls.includes(record.url)) {
            urls.push(record.url);
        }

        season.episodes.set(episodeKey, urls);
    }
}

const outputShows = {};
const aliasMap = {};

let seasonCount = 0;
let episodeCount = 0;
let packCount = 0;

function sortedObject(entries) {
    const result = {};

    for (const key of Object.keys(entries).sort()) {
        result[key] = entries[key];
    }

    return result;
}

for (const key of [...shows.keys()].sort()) {
    const show = shows.get(key);

    const seasons = {};
    const years = [];

    for (const seasonKey of [...show.seasons.keys()].sort(
        (a, b) => Number(a) - Number(b)
    )) {
        const season = show.seasons.get(seasonKey);
        const episodes = {};

        const episodeKeys = [...season.episodes.keys()].sort(
            (a, b) => Number(a) - Number(b)
        );

        for (const episodeKey of episodeKeys) {
            episodes[episodeKey] = [
                ...season.episodes.get(episodeKey)
            ].sort();

            episodeCount++;
        }

        const packs = [...season.packs].sort();

        packCount += packs.length;
        seasonCount++;

        if (season.year) {
            years.push(season.year);
        }

        seasons[seasonKey] = {
            year: season.year,
            episodes,
            packs
        };
    }

    const aliases = [...show.aliases.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([, value]) => value);

    outputShows[key] = {
        title: show.title,
        aliases,
        years:
            years.length > 0
                ? [Math.min(...years), Math.max(...years)]
                : [],
        seasons
    };
}

for (const key of Object.keys(outputShows)) {
    const show = outputShows[key];

    for (const alias of show.aliases) {
        const aliasKey = normalizeTitle(alias);

        if (
            !aliasKey ||
            aliasKey === key ||
            outputShows[aliasKey] ||
            aliasMap[aliasKey]
        ) {
            continue;
        }

        aliasMap[aliasKey] = key;
    }
}

// Keep the previous timestamp when the catalog itself did not change, so
// re-running the generator does not create empty commits.
let previous = null;

try {
    previous = JSON.parse(fs.readFileSync(outFile, "utf8"));
} catch {
    // no (valid) previous index
}

const unchanged =
    previous !== null &&
    JSON.stringify(previous.shows) === JSON.stringify(outputShows) &&
    JSON.stringify(previous.aliases) ===
        JSON.stringify(sortedObject(aliasMap));

// Never replace a good index with a much smaller one because a share or a
// whole server was temporarily unavailable. Set BDIX_ALLOW_PARTIAL=1 to
// override this check.
const newShowCount = Object.keys(outputShows).length;
const previousShowCount =
    previous && previous.counts ? previous.counts.shows : 0;

if (
    process.env.BDIX_ALLOW_PARTIAL !== "1" &&
    previousShowCount > 0 &&
    newShowCount < previousShowCount * 0.95
) {
    console.error(
        `[series-index] refusing to write a partial index: ` +
            `${newShowCount} shows < ${previousShowCount} previous. ` +
            `Retry when all servers are reachable, or set ` +
            `BDIX_ALLOW_PARTIAL=1 to force it.`
    );

    process.exit(1);
}

const payload = {
    version: 1,
    generatedAt: unchanged
        ? previous.generatedAt
        : new Date().toISOString(),
    counts: {
        files: records.length,
        shows: Object.keys(outputShows).length,
        seasons: seasonCount,
        episodes: episodeCount,
        packs: packCount
    },
    shows: outputShows,
    aliases: sortedObject(aliasMap)
};

fs.writeFileSync(outFile, `${JSON.stringify(payload)}\n`);

const sizeBytes = fs.statSync(outFile).size;
const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

console.log(
    `[series-index] wrote ${path.relative(repoRoot, outFile)}`
);
console.log(
    `[series-index] ${payload.counts.shows} shows, ` +
        `${payload.counts.seasons} seasons, ` +
        `${payload.counts.episodes} episodes, ` +
        `${payload.counts.packs} packs, ` +
        `${(sizeBytes / 1024 / 1024).toFixed(2)} MB in ${elapsed}s`
);

if (unchanged) {
    console.log(
        "[series-index] catalog unchanged (kept previous generatedAt)"
    );
}
