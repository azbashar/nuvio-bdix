import {
  SERVER_ROOTS,
  DIRECT_MOVIE_ROOTS,
  VIDEO_EXTENSIONS,
} from "./constants.js";

import { fetchDirectory, parseMovieFilename } from "./utils.js";

export function isVideoFile(name) {
  const lower = name.toLowerCase();

  return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Crawls every configured BDIX root and returns the movie files it finds.
 *
 * Used by:
 *  - scripts/generate-movies-index.mjs (build the JSON index)
 *  - extractor.js as the fallback when the index has no match
 *
 * @param {object} [options]
 * @param {number} [options.concurrency] - parallel directory requests
 * @param {(progress: object) => void} [options.onProgress]
 * @param {(movie: {title: string, year: number, quality: string}) => boolean} [options.match]
 *        optional filter so the fallback crawl only keeps matching files
 * @returns {Promise<Array<{title: string, year: number, quality: string, url: string, filename: string}>>}
 */
export async function crawlCatalog({
  concurrency = 8,
  onProgress,
  match,
} = {}) {
  const queue = [];
  const visited = new Set();
  const movies = [];
  const seenUrls = new Set();
  let directories = 0;

  // Server roots contain share folders, each share has a Movies/ folder.
  for (const root of SERVER_ROOTS) {
    let shares;

    try {
      shares = await fetchDirectory(root);
    } catch (err) {
      console.error("[BDIX] Server root failed:", root, err.message);
      continue;
    }

    for (const share of shares) {
      if (!share.isDirectory) continue;

      const shareUrl = new URL(share.href, root).href;
      queue.push(new URL("Movies/", shareUrl).href);
    }
  }

  // Direct roots are already share folders.
  for (const root of DIRECT_MOVIE_ROOTS) {
    queue.push(new URL("Movies/", root).href);
  }

  async function crawl(directoryUrl) {
    if (!directoryUrl.includes("/Movies/")) return;
    if (visited.has(directoryUrl)) return;

    visited.add(directoryUrl);

    let entries;

    try {
      entries = await fetchDirectory(directoryUrl);
    } catch (err) {
      console.error("[BDIX] Failed:", directoryUrl, err.message);
      return;
    }

    for (const entry of entries) {
      const fullUrl = new URL(entry.href, directoryUrl).toString();

      if (entry.isDirectory) {
        queue.push(fullUrl);
        continue;
      }

      if (!isVideoFile(entry.name)) continue;

      const filename = entry.name.split("/").pop();
      const parsed = parseMovieFilename(filename);

      if (!parsed) continue;
      if (match && !match(parsed)) continue;
      if (seenUrls.has(fullUrl)) continue;

      seenUrls.add(fullUrl);

      movies.push({
        title: parsed.title,
        year: parsed.year,
        quality: parsed.quality,
        url: fullUrl,
        filename,
      });
    }

    directories++;

    if (onProgress) {
      onProgress({
        directories,
        queued: queue.length,
        movies: movies.length,
        url: directoryUrl,
      });
    }
  }

  let cursor = 0;

  async function worker() {
    while (cursor < queue.length) {
      const url = queue[cursor++];

      await crawl(url);
    }
  }

  const workers = Math.max(1, concurrency);

  await Promise.all(Array.from({ length: workers }, () => worker()));

  return movies;
}
