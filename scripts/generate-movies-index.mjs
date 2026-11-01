#!/usr/bin/env node

/**
 * Builds movies_index.json by crawling every configured BDIX server.
 *
 * Usage:
 *   node scripts/generate-movies-index.mjs
 *
 * Env:
 *   BDIX_CONCURRENCY=8   number of parallel directory requests
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { crawlCatalog } from "../src/iccftp-movies/catalog.js";
import { normalizeTitle } from "../src/iccftp-movies/utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const outFile = path.join(repoRoot, "movies_index.json");

const concurrency = Number(process.env.BDIX_CONCURRENCY || 8);
const startedAt = Date.now();

let lastProgressAt = 0;

console.log(`[index] crawling BDIX servers (concurrency=${concurrency})...`);

const movies = await crawlCatalog({
  concurrency,
  onProgress: ({ directories, movies: found }) => {
    const now = Date.now();

    if (now - lastProgressAt < 2000) return;

    lastProgressAt = now;
    console.log(`[index] ${directories} directories scanned, ${found} movies found`);
  },
});

const titles = {};

for (const movie of movies) {
  const key = normalizeTitle(movie.title);

  if (!key) continue;

  if (!titles[key]) {
    titles[key] = [];
  }

  titles[key].push([movie.year, movie.quality, movie.url]);
}

// Deterministic output: sorted keys, newest year first, then URL.
const sortedTitles = {};

for (const key of Object.keys(titles).sort()) {
  const seen = new Set();

  sortedTitles[key] = titles[key]
    .filter(([, , url]) => {
      if (seen.has(url)) return false;

      seen.add(url);
      return true;
    })
    .sort((a, b) => b[0] - a[0] || a[2].localeCompare(b[2]));
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
  JSON.stringify(previous.titles) === JSON.stringify(sortedTitles);

// Never replace a good index with a much smaller one because a share or a
// whole server was temporarily unavailable. Set BDIX_ALLOW_PARTIAL=1 to
// override this check.
if (
  process.env.BDIX_ALLOW_PARTIAL !== "1" &&
  previous &&
  previous.count > 0 &&
  movies.length < previous.count * 0.95
) {
  console.error(
    `[index] refusing to write a partial index: ${movies.length} movies < ` +
      `${previous.count} previous. Retry when all servers are reachable, ` +
      `or set BDIX_ALLOW_PARTIAL=1 to force it.`
  );

  process.exit(1);
}

const payload = {
  version: 1,
  generatedAt: unchanged ? previous.generatedAt : new Date().toISOString(),
  count: movies.length,
  titles: sortedTitles,
};

fs.writeFileSync(outFile, `${JSON.stringify(payload)}\n`);

const sizeBytes = fs.statSync(outFile).size;
const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

console.log(`[index] wrote ${path.relative(repoRoot, outFile)}`);
console.log(
  `[index] ${movies.length} movies, ${
    Object.keys(sortedTitles).length
  } title keys, ${(sizeBytes / 1024 / 1024).toFixed(2)} MB in ${elapsed}s`
);

if (unchanged) {
  console.log("[index] catalog unchanged (kept previous generatedAt)");
}
