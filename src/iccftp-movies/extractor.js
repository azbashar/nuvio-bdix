import { crawlCatalog } from "./catalog.js";
import { searchMovieIndex } from "./movies-index.js";
import { ENABLE_LIVE_CRAWL } from "../shared/config.js";

import {
  fetchTmdbDetails,
  isGoodMatch,
  buildStream,
  finalizeStreams,
} from "./utils.js";

export async function extractStreams(tmdbId) {
  const movie = await fetchTmdbDetails(tmdbId);

  if (!movie) {
    return [];
  }

  //
  // 1. Pre-built index (fast path)
  //
  try {
    const indexed = await searchMovieIndex(movie);

    if (indexed.length > 0) {
      console.log(
        `[BDIX] Index hit: ${movie.title} (${movie.year}) -> ${indexed.length} stream(s)`
      );

      return indexed;
    }

    console.log(
      `[BDIX] Index miss: ${movie.title} (${movie.year})`
    );
  } catch (err) {
    console.error(
      "[BDIX] Index unavailable:",
      err.message
    );
  }

  if (!ENABLE_LIVE_CRAWL) {
    console.log("[BDIX] Live crawl disabled; returning no streams");
    return [];
  }

  //
  // 2. Live crawl fallback
  //
  const matches = await crawlCatalog({
    match: (candidate) =>
      isGoodMatch(
        movie.title,
        movie.year,
        candidate.title,
        candidate.year
      ) ||
      (movie.originalTitle &&
        movie.originalTitle !== movie.title &&
        isGoodMatch(
          movie.originalTitle,
          movie.year,
          candidate.title,
          candidate.year
        )),
  });

  return finalizeStreams(
    matches.map((candidate) =>
      buildStream(
        candidate.url,
        candidate.title,
        candidate.year,
        candidate.quality,
        candidate.filename
      )
    )
  );
}
