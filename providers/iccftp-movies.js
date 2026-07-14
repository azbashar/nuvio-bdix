/**
 * iccftp-movies - Built from src/iccftp-movies/
 * Generated: 2026-07-14T12:11:13.316Z
 */
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// src/iccftp-movies/constants.js
var ROOTS = [
  "http://10.16.100.206/ftps3/",
  "http://10.16.100.202/ftps10/"
];
var TMDB_API_KEY = "1865f43a0549ca50d341dd9ab8b29f49";
var TMDB_BASE_URL = "https://api.themoviedb.org/3";
var VIDEO_EXTENSIONS = [
  ".mkv",
  ".mp4",
  ".avi",
  ".m4v",
  ".mov"
];
var CACHE_TTL = 15 * 60 * 1e3;
var REQUEST_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
  "Accept": "text/html,application/json,*/*"
};

// src/iccftp-movies/utils.js
var import_cheerio_without_node_native = __toESM(require("cheerio-without-node-native"));
var DIRECTORY_CACHE = /* @__PURE__ */ new Map();
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
    const cached = DIRECTORY_CACHE.get(url);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    const html = yield fetch(url, {
      headers: REQUEST_HEADERS
    }).then((r) => r.text());
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
    DIRECTORY_CACHE.set(url, {
      data: entries,
      expires: Date.now() + CACHE_TTL
    });
    return entries;
  });
}
function buildStream(url, movieTitle, year, quality) {
  return {
    name: "BDIX",
    title: `${movieTitle} (${year}) - ${quality}`,
    url,
    quality,
    provider: "bdix"
  };
}

// src/iccftp-movies/extractor.js
function isVideoFile(name) {
  const lower = name.toLowerCase();
  return VIDEO_EXTENSIONS.some(
    (ext) => lower.endsWith(ext)
  );
}
function qualityScore(q) {
  if (!q)
    return 0;
  const num = parseInt(q);
  if (Number.isNaN(num)) {
    return 0;
  }
  return num;
}
function searchMoviesDirectory(directoryUrl, movie, results, visited) {
  return __async(this, null, function* () {
    if (visited.has(directoryUrl)) {
      return;
    }
    visited.add(directoryUrl);
    console.log(`Searching : ${directoryUrl}`);
    let entries = [];
    try {
      entries = yield fetchDirectory(
        directoryUrl
      );
    } catch (err) {
      console.error(
        "[BDIX] Failed:",
        directoryUrl,
        err.message
      );
      return;
    }
    for (const entry of entries) {
      const fullUrl = new URL(
        entry.href,
        directoryUrl
      ).toString();
      if (entry.isDirectory) {
        yield searchMoviesDirectory(
          fullUrl,
          movie,
          results,
          visited
        );
        continue;
      }
      if (!isVideoFile(entry.name)) {
        continue;
      }
      const parsed = parseMovieFilename(
        entry.name
      );
      if (!parsed) {
        continue;
      }
      const titleMatch = isGoodMatch(
        movie.title,
        movie.year,
        parsed.title,
        parsed.year
      );
      const originalMatch = movie.originalTitle && movie.originalTitle !== movie.title && isGoodMatch(
        movie.originalTitle,
        movie.year,
        parsed.title,
        parsed.year
      );
      if (!titleMatch && !originalMatch) {
        continue;
      }
      results.push(
        buildStream(
          fullUrl,
          parsed.title,
          parsed.year,
          parsed.quality
        )
      );
    }
  });
}
function processRoot(root, movie, results) {
  return __async(this, null, function* () {
    let shares = [];
    try {
      shares = yield fetchDirectory(
        root
      );
    } catch (err) {
      console.error(
        "[BDIX] Root error:",
        root,
        err.message
      );
      return;
    }
    for (const share of shares) {
      if (!share.isDirectory) {
        continue;
      }
      const moviesUrl = new URL(
        `${share.href}Movies/`,
        root
      ).href;
      try {
        yield searchMoviesDirectory(
          moviesUrl,
          movie,
          results,
          /* @__PURE__ */ new Set()
        );
      } catch (e) {
      }
    }
  });
}
function extractStreams(tmdbId) {
  return __async(this, null, function* () {
    const movie = yield fetchTmdbDetails(
      tmdbId
    );
    if (!movie) {
      return [];
    }
    console.log(
      `[BDIX] Searching: ${movie.title} (${movie.year})`
    );
    const results = [];
    for (const root of ROOTS) {
      yield processRoot(
        root,
        movie,
        results
      );
    }
    results.sort((a, b) => {
      return qualityScore(
        b.quality
      ) - qualityScore(
        a.quality
      );
    });
    const unique = /* @__PURE__ */ new Map();
    for (const stream of results) {
      if (!unique.has(stream.url)) {
        unique.set(
          stream.url,
          stream
        );
      }
    }
    return Array.from(
      unique.values()
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
module.exports = { getStreams };
