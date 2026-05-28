/**
 * iccftp - Built from src/iccftp/
 * Generated: 2026-05-28T15:43:25.354Z
 */
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
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

// src/iccftp/http.js
var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
};
function fetchText(_0) {
  return __async(this, arguments, function* (url, options = {}) {
    console.log(`[ICCFTP] Fetching: ${url}`);
    const response = yield fetch(url, __spreadValues({
      headers: __spreadValues(__spreadValues({}, HEADERS), options.headers)
    }, options));
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} for ${url}`);
    }
    return yield response.text();
  });
}

// src/iccftp/extractor.js
var import_cheerio_without_node_native = __toESM(require("cheerio-without-node-native"));
var ROOT_URL = "http://10.16.100.206/ftps3/ftps3d7/Movies/";
var TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";
var TMDB_BASE_URL = "https://api.themoviedb.org/3";
var cachedFiles = null;
var cacheTimestamp = 0;
var CACHE_TTL = 5 * 60 * 1e3;
function resolveUrl(href, baseUrl) {
  try {
    return new URL(href, baseUrl).href;
  } catch (e) {
    if (href.startsWith("http://") || href.startsWith("https://"))
      return href;
    if (href.startsWith("/")) {
      const origin = baseUrl.split("/").slice(0, 3).join("/");
      return origin + href;
    }
    const baseParts = baseUrl.split("/");
    if (!baseUrl.endsWith("/"))
      baseParts.pop();
    return baseParts.join("/") + "/" + href;
  }
}
function normalizeText(text) {
  if (!text)
    return "";
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
function crawlServer() {
  return __async(this, null, function* () {
    console.log(`[ICCFTP] Starting server crawl from: ${ROOT_URL}`);
    const visited = /* @__PURE__ */ new Set();
    const movieFiles = [];
    const queue = [ROOT_URL];
    const maxConcurrency = 10;
    let totalRequests = 0;
    const maxRequests = 200;
    while (queue.length > 0 && totalRequests < maxRequests) {
      const batch = queue.splice(0, maxConcurrency);
      yield Promise.all(batch.map((dirUrl) => __async(this, null, function* () {
        if (visited.has(dirUrl))
          return;
        visited.add(dirUrl);
        try {
          totalRequests++;
          const html = yield fetchText(dirUrl);
          const $ = import_cheerio_without_node_native.default.load(html);
          $("a").each((_, element) => {
            const href = $(element).attr("href");
            if (!href)
              return;
            if (href === "../" || href.endsWith("/../") || href.startsWith("?") || href.startsWith("/"))
              return;
            const absoluteUrl = resolveUrl(href, dirUrl);
            if (!absoluteUrl.startsWith(ROOT_URL))
              return;
            if (href.endsWith("/")) {
              if (!visited.has(absoluteUrl) && !queue.includes(absoluteUrl)) {
                queue.push(absoluteUrl);
              }
            } else {
              const ext = absoluteUrl.split(".").pop().toLowerCase();
              const videoExtensions = ["mp4", "mkv", "avi", "webm", "ts", "m3u8", "mov"];
              if (videoExtensions.includes(ext)) {
                const fileAnchorText = $(element).text().trim();
                const decodedName = decodeURIComponent(absoluteUrl.split("/").pop());
                const fileName = fileAnchorText && !fileAnchorText.includes("/") ? fileAnchorText : decodedName;
                movieFiles.push({
                  fileName,
                  url: absoluteUrl
                });
              }
            }
          });
        } catch (error) {
          console.error(`[ICCFTP] Failed to crawl directory ${dirUrl}: ${error.message}`);
        }
      })));
    }
    console.log(`[ICCFTP] Crawl finished. Found ${movieFiles.length} video files across ${visited.size} directories.`);
    return movieFiles;
  });
}
function getFilesList() {
  return __async(this, null, function* () {
    const now = Date.now();
    if (cachedFiles && now - cacheTimestamp < CACHE_TTL) {
      console.log(`[ICCFTP] Using cached file list (${cachedFiles.length} files).`);
      return cachedFiles;
    }
    try {
      cachedFiles = yield crawlServer();
      cacheTimestamp = now;
      return cachedFiles;
    } catch (error) {
      console.error(`[ICCFTP] Crawling failed: ${error.message}`);
      return cachedFiles || [];
    }
  });
}
function getTMDBDetails(tmdbId, mediaType) {
  return __async(this, null, function* () {
    const endpoint = mediaType === "tv" ? "tv" : "movie";
    const url = `${TMDB_BASE_URL}/${endpoint}/${tmdbId}?api_key=${TMDB_API_KEY}`;
    try {
      console.log(`[ICCFTP] Fetching TMDB details for ${mediaType} ID: ${tmdbId}`);
      const response = yield fetch(url, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0"
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = yield response.json();
      const title = mediaType === "tv" ? data.name : data.title;
      const releaseDate = mediaType === "tv" ? data.first_air_date : data.release_date;
      const year = releaseDate ? parseInt(releaseDate.split("-")[0]) : null;
      return { title, year };
    } catch (error) {
      console.error(`[ICCFTP] Failed to fetch TMDB details: ${error.message}`);
      return null;
    }
  });
}
function isMatch(fileName, mediaInfo, mediaType, season, episode) {
  const normFile = normalizeText(fileName);
  const normTitle = normalizeText(mediaInfo.title);
  if (!normFile.includes(normTitle)) {
    return false;
  }
  if (mediaType === "movie") {
    if (mediaInfo.year) {
      const yearMatch = fileName.match(/\b(19\d{2}|20\d{2})\b/);
      if (yearMatch) {
        const fileYear = parseInt(yearMatch[1]);
        if (fileYear !== mediaInfo.year) {
          return false;
        }
      }
    }
    return true;
  } else if (mediaType === "tv") {
    if (season !== null && episode !== null) {
      const sPad = String(season).padStart(2, "0");
      const ePad = String(episode).padStart(2, "0");
      const tvPatterns = [
        new RegExp(`s${sPad}e${ePad}`, "i"),
        new RegExp(`s${season}e${episode}`, "i"),
        new RegExp(`\\b${season}x${ePad}\\b`, "i"),
        new RegExp(`\\b${season}x${episode}\\b`, "i"),
        new RegExp(`season\\s*${season}\\s*episode\\s*${episode}`, "i"),
        new RegExp(`episode\\s*${episode}`, "i")
        // fallback
      ];
      return tvPatterns.some((pattern) => pattern.test(fileName));
    }
    return true;
  }
  return false;
}
function parseQuality(fileName) {
  const nameLower = fileName.toLowerCase();
  if (nameLower.includes("2160p") || nameLower.includes("4k") || nameLower.includes("uhd"))
    return "4K";
  if (nameLower.includes("1080p") || nameLower.includes("fhd") || nameLower.includes("bluray"))
    return "1080p";
  if (nameLower.includes("720p") || nameLower.includes("hd"))
    return "720p";
  if (nameLower.includes("480p") || nameLower.includes("sd"))
    return "480p";
  if (nameLower.includes("cam") || nameLower.includes("screener") || nameLower.includes("hdtc") || nameLower.includes("ts"))
    return "CAM";
  return "1080p";
}
function extractStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    const mediaInfo = yield getTMDBDetails(tmdbId, mediaType);
    if (!mediaInfo) {
      console.error(`[ICCFTP] Could not retrieve media metadata for TMDB ID ${tmdbId}`);
      return [];
    }
    console.log(`[ICCFTP] Searching for: "${mediaInfo.title}" (${mediaInfo.year || "N/A"})`);
    const allFiles = yield getFilesList();
    if (allFiles.length === 0) {
      console.warn(`[ICCFTP] File server contains no accessible video files.`);
      return [];
    }
    const matchedFiles = allFiles.filter(
      (file) => isMatch(file.fileName, mediaInfo, mediaType, season, episode)
    );
    console.log(`[ICCFTP] Found ${matchedFiles.length} file matches for "${mediaInfo.title}".`);
    const streams = matchedFiles.map((file) => {
      const cleanTitle = file.fileName.replace(/\.[a-zA-Z0-9]{2,4}$/, "");
      return {
        name: "ICCFTP",
        title: cleanTitle,
        url: file.url,
        quality: parseQuality(file.fileName),
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      };
    });
    const qualityOrder = { "4K": 4, "1080p": 2, "720p": 1, "480p": 0, "CAM": -1 };
    return streams.sort((a, b) => (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0));
  });
}

// src/iccftp/index.js
function getStreams(tmdbId, mediaType = "movie", season = null, episode = null) {
  return __async(this, null, function* () {
    try {
      console.log(`[ICCFTP] Request received for: ${mediaType} ${tmdbId} (Season: ${season}, Episode: ${episode})`);
      const streams = yield extractStreams(tmdbId, mediaType, season, episode);
      return streams;
    } catch (error) {
      console.error(`[ICCFTP] Error in getStreams: ${error.message}`);
      return [];
    }
  });
}
module.exports = { getStreams };
