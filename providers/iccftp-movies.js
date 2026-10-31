/**
 * iccftp-movies - Built from src/iccftp-movies/
 * Generated: 2026-10-31T14:14:57.553Z
 */
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/iccftp-movies/index.js
var iccftp_movies_exports = {};
__export(iccftp_movies_exports, {
  getStreams: () => getStreams
});
module.exports = __toCommonJS(iccftp_movies_exports);

// src/iccftp-movies/constants.js
var SERVER_ROOTS = [
  // These contain share folders
  "http://10.16.100.206/ftps3/",
  "http://10.16.100.202/ftps10/",
  "http://10.16.100.213/iccftps13/",
  "http://10.16.100.212/iccftps12/"
];
var DIRECT_MOVIE_ROOTS = [
  // These are already the share folders
  "http://10.16.100.248/ftps6d1/",
  "http://10.16.100.248/ftps6d2/",
  "http://10.16.100.248/ftps6d3/",
  "http://10.16.100.248/ftps6d4/",
  "http://10.16.100.248/ftps6d5/",
  "http://10.16.100.241/ftps3d1/",
  "http://10.16.100.241/ftps3d3/",
  "http://10.16.100.241/ftps3d5/",
  "http://10.16.100.250/ftps10d1/",
  "http://10.16.100.250/ftps10d2/"
];
var TMDB_API_KEY = "1865f43a0549ca50d341dd9ab8b29f49";
var TMDB_BASE_URL = "https://api.themoviedb.org/3";
var MOVIES_INDEX_URL = "https://raw.githubusercontent.com/azbashar/nuvio-bdix/refs/heads/main/movies_index.json";
var VIDEO_EXTENSIONS = [
  ".mkv",
  ".mp4",
  ".avi",
  ".m4v",
  ".mov"
];
var REQUEST_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
  "Accept": "text/html,application/json,*/*"
};

// src/iccftp-movies/utils.js
var import_cheerio_without_node_native = __toESM(require("cheerio-without-node-native"), 1);
function fetchTmdbDetails(tmdbId) {
  return __async(this, null, function* () {
    try {
      const url = `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}`;
      const res = yield fetch(url, {
        headers: REQUEST_HEADERS
      });
      const data = yield res.json();
      return {
        title: data.title || data.original_title,
        originalTitle: data.original_title,
        year: Number(
          (data.release_date || "").slice(0, 4)
        )
      };
    } catch (err) {
      console.error("[BDIX TMDB]", err);
      return null;
    }
  });
}
function normalizeTitle(title) {
  if (!title)
    return "";
  return title.toLowerCase().replace(/\./g, " ").replace(/[-_:]/g, " ").replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}
function tokenizeTitle(title) {
  return normalizeTitle(title).split(" ").filter(Boolean);
}
function titleSimilarity(a, b) {
  const aa = tokenizeTitle(a);
  const bb = tokenizeTitle(b);
  if (!aa.length || !bb.length) {
    return 0;
  }
  let matches = 0;
  for (const word of aa) {
    if (bb.includes(word)) {
      matches++;
    }
  }
  return matches / Math.max(
    aa.length,
    bb.length
  );
}
function isGoodMatch(tmdbTitle, tmdbYear, fileTitle, fileYear) {
  if (tmdbYear && fileYear && tmdbYear !== fileYear) {
    return false;
  }
  const score = titleSimilarity(
    tmdbTitle,
    fileTitle
  );
  return score >= 0.8;
}
function parseMovieFilename(filename) {
  var _a, _b;
  const match = filename.match(
    /^(.*?)\s*\((\d{4})\)(.*?)\.(mkv|mp4|avi|m4v|mov)$/i
  );
  if (!match) {
    return null;
  }
  const quality = ((_b = (_a = match[3]) == null ? void 0 : _a.match(
    /(2160p|1080p|720p|480p)/i
  )) == null ? void 0 : _b[1]) || "Auto";
  return {
    title: match[1].trim(),
    year: Number(match[2]),
    quality,
    extension: match[4].toLowerCase()
  };
}
function fetchDirectory(url) {
  return __async(this, null, function* () {
    const res = yield fetch(url, {
      headers: REQUEST_HEADERS
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const html = yield res.text();
    const $ = import_cheerio_without_node_native.default.load(html);
    const entries = [];
    $("a").each((_, el) => {
      let href = $(el).attr("href");
      if (!href)
        return;
      if (href === "../" || href === "/" || href.startsWith("?")) {
        return;
      }
      let name = href.replace(/\/$/, "");
      try {
        name = decodeURIComponent(name);
      } catch (e) {
      }
      entries.push({
        href,
        // encoded URL, use this for requests
        name,
        // decoded name, use this for matching
        isDirectory: href.endsWith("/")
      });
    });
    return entries;
  });
}
function buildStream(url, movieTitle, year, quality, file) {
  return {
    name: `${file}`,
    title: `${movieTitle} (${year}) - ${quality}`,
    url,
    quality,
    provider: "bdix"
  };
}
function qualityScore(quality) {
  if (!quality)
    return 0;
  const num = parseInt(quality, 10);
  return Number.isNaN(num) ? 0 : num;
}
function finalizeStreams(streams) {
  const sorted = [...streams].sort(
    (a, b) => qualityScore(b.quality) - qualityScore(a.quality)
  );
  const unique = /* @__PURE__ */ new Map();
  for (const stream of sorted) {
    if (!unique.has(stream.url)) {
      unique.set(stream.url, stream);
    }
  }
  return Array.from(unique.values());
}

// src/iccftp-movies/catalog.js
function isVideoFile(name) {
  const lower = name.toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}
function crawlCatalog() {
  return __async(this, arguments, function* ({
    concurrency = 8,
    onProgress,
    match
  } = {}) {
    const queue = [];
    const visited = /* @__PURE__ */ new Set();
    const movies = [];
    const seenUrls = /* @__PURE__ */ new Set();
    let directories = 0;
    for (const root of SERVER_ROOTS) {
      let shares;
      try {
        shares = yield fetchDirectory(root);
      } catch (err) {
        console.error("[BDIX] Server root failed:", root, err.message);
        continue;
      }
      for (const share of shares) {
        if (!share.isDirectory)
          continue;
        const shareUrl = new URL(share.href, root).href;
        queue.push(new URL("Movies/", shareUrl).href);
      }
    }
    for (const root of DIRECT_MOVIE_ROOTS) {
      queue.push(new URL("Movies/", root).href);
    }
    function crawl(directoryUrl) {
      return __async(this, null, function* () {
        if (!directoryUrl.includes("/Movies/"))
          return;
        if (visited.has(directoryUrl))
          return;
        visited.add(directoryUrl);
        let entries;
        try {
          entries = yield fetchDirectory(directoryUrl);
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
          if (!isVideoFile(entry.name))
            continue;
          const filename = entry.name.split("/").pop();
          const parsed = parseMovieFilename(filename);
          if (!parsed)
            continue;
          if (match && !match(parsed))
            continue;
          if (seenUrls.has(fullUrl))
            continue;
          seenUrls.add(fullUrl);
          movies.push({
            title: parsed.title,
            year: parsed.year,
            quality: parsed.quality,
            url: fullUrl,
            filename
          });
        }
        directories++;
        if (onProgress) {
          onProgress({
            directories,
            queued: queue.length,
            movies: movies.length,
            url: directoryUrl
          });
        }
      });
    }
    let cursor = 0;
    function worker() {
      return __async(this, null, function* () {
        while (cursor < queue.length) {
          const url = queue[cursor++];
          yield crawl(url);
        }
      });
    }
    const workers = Math.max(1, concurrency);
    yield Promise.all(Array.from({ length: workers }, () => worker()));
    return movies;
  });
}

// src/iccftp-movies/movies-index.js
var MIN_TITLE_SIMILARITY = 0.8;
function loadMovieIndex() {
  return __async(this, null, function* () {
    const res = yield fetch(MOVIES_INDEX_URL, {
      headers: {
        Accept: "application/json"
      }
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = yield res.json();
    if (!data || typeof data.titles !== "object" || data.titles === null) {
      throw new Error("invalid index format");
    }
    return data;
  });
}
function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch (e) {
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
  return Boolean(movie.originalTitle) && titleSimilarity(movie.originalTitle, normalizedTitle) >= MIN_TITLE_SIMILARITY;
}
function entriesForYear(index, year) {
  const entries = [];
  for (const [title, list] of Object.entries(index.titles)) {
    for (const entry of list) {
      if (entry[0] && year && entry[0] !== year)
        continue;
      entries.push([title, entry]);
    }
  }
  return entries;
}
function searchMovieIndex(movie) {
  return __async(this, null, function* () {
    const index = yield loadMovieIndex();
    const keys = [movie.title, movie.originalTitle].filter(Boolean).map(normalizeTitle).filter((key, i, all) => key && all.indexOf(key) === i);
    const results = [];
    for (const key of keys) {
      const entries = index.titles[key];
      if (!entries)
        continue;
      for (const entry of entries) {
        if (entry[0] && movie.year && entry[0] !== movie.year)
          continue;
        results.push(entryToStream(entry, movie));
      }
    }
    if (results.length > 0) {
      return finalizeStreams(results);
    }
    for (const [title, entry] of entriesForYear(index, movie.year)) {
      if (!titleMatches(movie, title))
        continue;
      results.push(entryToStream(entry, movie));
    }
    return finalizeStreams(results);
  });
}

// src/iccftp-movies/extractor.js
function extractStreams(tmdbId) {
  return __async(this, null, function* () {
    const movie = yield fetchTmdbDetails(tmdbId);
    if (!movie) {
      return [];
    }
    try {
      const indexed = yield searchMovieIndex(movie);
      if (indexed.length > 0) {
        console.log(
          `[BDIX] Index hit: ${movie.title} (${movie.year}) -> ${indexed.length} stream(s)`
        );
        return indexed;
      }
      console.log(
        `[BDIX] Index miss: ${movie.title} (${movie.year}), crawling servers`
      );
    } catch (err) {
      console.error(
        "[BDIX] Index unavailable, crawling servers:",
        err.message
      );
    }
    const matches = yield crawlCatalog({
      match: (candidate) => isGoodMatch(
        movie.title,
        movie.year,
        candidate.title,
        candidate.year
      ) || movie.originalTitle && movie.originalTitle !== movie.title && isGoodMatch(
        movie.originalTitle,
        movie.year,
        candidate.title,
        candidate.year
      )
    });
    return finalizeStreams(
      matches.map(
        (candidate) => buildStream(
          candidate.url,
          candidate.title,
          candidate.year,
          candidate.quality,
          candidate.filename
        )
      )
    );
  });
}

// src/iccftp-movies/index.js
function getStreams(tmdbId, mediaType) {
  return __async(this, null, function* () {
    try {
      if (mediaType !== "movie") {
        return [];
      }
      console.log(`[BDIX] Searching movie TMDB=${tmdbId}`);
      return yield extractStreams(tmdbId);
    } catch (err) {
      console.error("[BDIX]", err);
      return [];
    }
  });
}
