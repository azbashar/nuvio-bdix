import { MOVIES_INDEX_URL } from "./constants.js";

import {
  buildStream,
  finalizeStreams,
  normalizeTitle,
  titleSimilarity,
} from "./utils.js";

const MIN_TITLE_SIMILARITY = 0.80;

/**
 * Downloads the pre-built movie index. No local caching: the hosted JSON is
 * the cache, so every lookup reflects the last published index.
 */
export async function loadMovieIndex() {
  const res = await fetch(MOVIES_INDEX_URL, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const data = await res.json();

  if (!data || typeof data.titles !== "object" || data.titles === null) {
    throw new Error("invalid index format");
  }

  return data;
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function entryToStream(entry, movie) {
  const year = entry[0] || movie.year;
  const quality = entry[1] || "Auto";
  const url = entry[2];

  const filename = safeDecode(url.split("/").pop());

  return buildStream(url, movie.title, year, quality, filename);
}

function titleMatches(movie, normalizedTitle) {
  if (titleSimilarity(movie.title, normalizedTitle) >= MIN_TITLE_SIMILARITY) {
    return true;
  }

  return (
    Boolean(movie.originalTitle) &&
    titleSimilarity(movie.originalTitle, normalizedTitle) >=
      MIN_TITLE_SIMILARITY
  );
}

/**
 * Collects index entries for a release year (plus entries without a year),
 * without mutating the downloaded index.
 */
function entriesForYear(index, year) {
  const entries = [];

  for (const [title, list] of Object.entries(index.titles)) {
    for (const entry of list) {
      if (entry[0] && year && entry[0] !== year) continue;

      entries.push([title, entry]);
    }
  }

  return entries;
}

/**
 * Looks a movie up in the pre-built index.
 *
 * @param {{title: string, originalTitle?: string, year: number}} movie
 * @returns {Promise<Array>} matching streams (empty when the index has no match)
 */
export async function searchMovieIndex(movie) {
  const index = await loadMovieIndex();

  const keys = [movie.title, movie.originalTitle]
    .filter(Boolean)
    .map(normalizeTitle)
    .filter((key, i, all) => key && all.indexOf(key) === i);

  const results = [];

  // Fast path: normalized title (and year) match.
  for (const key of keys) {
    const entries = index.titles[key];

    if (!entries) continue;

    for (const entry of entries) {
      if (entry[0] && movie.year && entry[0] !== movie.year) continue;

      results.push(entryToStream(entry, movie));
    }
  }

  if (results.length > 0) {
    return finalizeStreams(results);
  }

  // Slow path: fuzzy title match within the same release year.
  for (const [title, entry] of entriesForYear(index, movie.year)) {
    if (!titleMatches(movie, title)) continue;

    results.push(entryToStream(entry, movie));
  }

  return finalizeStreams(results);
}
