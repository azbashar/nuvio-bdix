import { VIDEO_EXTENSIONS } from "./constants.js";

import { SERVER_ROOTS, DIRECT_MOVIE_ROOTS } from "./constants.js";

import {
  fetchTmdbDetails,
  fetchDirectory,
  parseMovieFilename,
  isGoodMatch,
  buildStream,
} from "./utils.js";

function isVideoFile(name) {
  const lower = name.toLowerCase();

  return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function qualityScore(q) {
  if (!q) return 0;

  const num = parseInt(q);

  if (Number.isNaN(num)) {
    return 0;
  }

  return num;
}

async function searchMoviesDirectory(directoryUrl, movie, results, visited) {
  if (!directoryUrl.includes("/Movies/")) {
    return;
  }
  if (visited.has(directoryUrl)) {
    return;
  }

  visited.add(directoryUrl);
  // console.log(`Searching : ${directoryUrl}`);

  let entries = [];

  try {
    entries = await fetchDirectory(directoryUrl);
  } catch (err) {
    console.error("[BDIX] Failed:", directoryUrl, err.message);

    return;
  }

  for (const entry of entries) {
    const fullUrl = new URL(entry.href, directoryUrl).toString();

    //
    // recurse folders
    //
    if (entry.isDirectory) {
      await searchMoviesDirectory(fullUrl, movie, results, visited);

      continue;
    }

    //
    // skip non-video files
    //
    if (!isVideoFile(entry.name)) {
      continue;
    }

    const filename = entry.name.split("/").pop();

    const parsed = parseMovieFilename(filename);

    if (!parsed) {
      continue;
    }

    const titleMatch = isGoodMatch(
      movie.title,
      movie.year,
      parsed.title,
      parsed.year
    );

    const originalMatch =
      movie.originalTitle &&
      movie.originalTitle !== movie.title &&
      isGoodMatch(movie.originalTitle, movie.year, parsed.title, parsed.year);

    if (!titleMatch && !originalMatch) {
      continue;
    }

    results.push(
      buildStream(fullUrl, parsed.title, parsed.year, parsed.quality, filename)
    );
  }
}

async function processServerRoot(root, movie, results) {
  let shares;

  try {
    shares = await fetchDirectory(root);
  } catch (err) {
    console.error("[BDIX] Server root failed:", root, err.message);
    return;
  }

  for (const share of shares) {
    if (!share.isDirectory) continue;

    const shareUrl = new URL(share.href, root).href;

    const moviesUrl = new URL("Movies/", shareUrl).href;

    // console.log(
    //     "[BDIX] Entering Movies:",
    //     moviesUrl
    // );

    await searchMoviesDirectory(moviesUrl, movie, results, new Set());
  }
}

async function processDirectRoot(root, movie, results) {
  const moviesUrl = new URL("Movies/", root).href;

  // console.log(
  //     "[BDIX] Entering Movies:",
  //     moviesUrl
  // );

  await searchMoviesDirectory(moviesUrl, movie, results, new Set());
}

export async function extractStreams(tmdbId) {
  const movie = await fetchTmdbDetails(tmdbId);

  if (!movie) {
    return [];
  }

  console.log(`[BDIX] Searching: ${movie.title} (${movie.year})`);

  const results = [];

  for (const root of SERVER_ROOTS) {
    await processServerRoot(root, movie, results);
  }

  for (const root of DIRECT_MOVIE_ROOTS) {
    await processDirectRoot(root, movie, results);
  }

  results.sort((a, b) => {
    return qualityScore(b.quality) - qualityScore(a.quality);
  });

  const unique = new Map();

  for (const stream of results) {
    if (!unique.has(stream.url)) {
      unique.set(stream.url, stream);
    }
  }

  return Array.from(unique.values());
}
