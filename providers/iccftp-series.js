/**
 * iccftp-series - Built from src/iccftp-series/
 * Generated: 2026-11-01T14:56:42.302Z
 */
var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
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

// src/iccftp-series/index.js
var iccftp_series_exports = {};
__export(iccftp_series_exports, {
  getStreams: () => getStreams
});
module.exports = __toCommonJS(iccftp_series_exports);

// src/shared/config.js
var SERVER_ROOTS = [
  // These contain share folders
  "http://10.16.100.206/ftps3/",
  "http://10.16.100.202/ftps10/",
  // Temporarily disabled: server was unreachable (new link TBD).
  // "http://10.16.100.213/iccftps13/",
  "http://10.16.100.212/iccftps12/"
];
var DIRECT_ROOTS = [
  // These are already share folders
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

// src/iccftp-series/constants.js
var SERIES_INDEX_URL = "https://raw.githubusercontent.com/azbashar/nuvio-bdix/refs/heads/main/series_index.json";
var SERIES_ROOT_RE = /^(tv\s*shows?|web\s*series|webseries|series|shows?)$/i;
var OTHER_ROOT_RE = /^others?$/i;
var CARTOON_ROOT_RE = /cartoon|kids|animation|anime/i;
var SEASON_FOLDER_RE = /^(.*?)\s+season\s+s?(\d{1,2})(?:\s*[-–]\s*s?\d{1,2})?\s*(?:\((\d{4})\))?(.*)$/i;
var MAX_CRAWL_DEPTH = 7;

// src/iccftp-series/http.js
var import_cheerio_without_node_native = __toESM(require("cheerio-without-node-native"), 1);
function withTrailingSlash(url) {
  return url.endsWith("/") ? url : `${url}/`;
}
function basenameFromUrl(url) {
  const withoutQuery = String(url || "").split("?")[0].split("#")[0].replace(/\/+$/, "");
  const last = withoutQuery.split("/").pop() || "";
  try {
    return decodeURIComponent(last);
  } catch (e) {
    return last;
  }
}
function fetchDirectory(url) {
  return __async(this, null, function* () {
    let res;
    let lastError;
    for (let attempt = 0; attempt < 3; attempt++) {
      res = null;
      try {
        res = yield fetch(url, {
          headers: REQUEST_HEADERS
        });
      } catch (err) {
        lastError = err;
      }
      if (res && res.ok) {
        break;
      }
      if (res) {
        lastError = new Error(`HTTP ${res.status}`);
        if (res.status < 500 && res.status !== 429) {
          break;
        }
      }
      if (attempt < 2) {
        yield new Promise(
          (resolve) => setTimeout(resolve, 250 * (attempt + 1))
        );
      }
    }
    if (!res || !res.ok) {
      throw lastError || new Error("request failed");
    }
    const html = yield res.text();
    const $ = import_cheerio_without_node_native.default.load(html);
    const entries = [];
    const seen = /* @__PURE__ */ new Set();
    const current = withTrailingSlash(url);
    $("a").each((_, element) => {
      const href = $(element).attr("href");
      if (!href)
        return;
      if (href === "../" || href === "/" || href.startsWith("?") || href.startsWith("#")) {
        return;
      }
      let absolute;
      try {
        absolute = new URL(href, url).toString();
      } catch (e) {
        return;
      }
      if (absolute === url || absolute === current || current.startsWith(withTrailingSlash(absolute))) {
        return;
      }
      if (seen.has(absolute))
        return;
      seen.add(absolute);
      const isDirectory = href.endsWith("/");
      entries.push({
        url: absolute,
        name: basenameFromUrl(absolute),
        isDirectory
      });
    });
    return entries;
  });
}

// src/iccftp-series/parse.js
var TAG_WORDS = /* @__PURE__ */ new Set([
  "completed",
  "complete",
  "dubbed",
  "dub",
  "debbed",
  "subbed",
  "sub",
  "hindi",
  "english",
  "japanese",
  "korean",
  "tamil",
  "telugu",
  "malayalam",
  "bengali",
  "bangla",
  "urdu",
  "dual",
  "multi",
  "audio",
  "cartoon",
  "kids",
  "anime",
  "hd",
  "fhd",
  "uhd",
  "4k",
  "webrip",
  "webdl",
  "web",
  "dl",
  "bluray",
  "brrip",
  "hdrip",
  "hevc",
  "aac",
  "x264",
  "x265",
  "h264",
  "h265",
  "10bit",
  "8bit",
  "the",
  "a",
  "an",
  "special",
  "specials",
  "episode",
  "episodes",
  "all",
  "in",
  "one"
]);
var LANGUAGE_AND_TAG_RE = /^(completed?|dubbed?|debbed|subbed?|hindi|english|japanese|korean|tamil|telugu|malayalam|bengali|bangla|urdu|dual(\s+audio)?|multi(\s+audio)?|cartoon|kids|anime|us|uk|au|ca|hd|fhd|uhd|4k|webrip|web[- ]?dl|bluray|brrip|hdrip|hevc|aac|x26[45]|h26[45]|10bit|8bit|special|specials|episodes?)$/i;
function splitShowTitle(raw) {
  const aliases = [];
  let title = String(raw || "").replace(
    /\(([^)]*)\)/g,
    (_, inner) => {
      const value = String(inner || "").trim();
      const parts = value.split(/\s*[&,+]\s*|\s+and\s+/i).map((part) => part.trim()).filter(Boolean);
      const isTag = !value || /^(19|20)\d{2}$/.test(value) || /^season\s*\d+/i.test(value) || LANGUAGE_AND_TAG_RE.test(value) || parts.length > 0 && parts.every((part) => LANGUAGE_AND_TAG_RE.test(part));
      if (!isTag) {
        aliases.push(value);
      }
      return " ";
    }
  );
  title = title.replace(/[-–—:._]+$/g, " ").replace(/\s+/g, " ").trim();
  let tokens = title.split(" ").filter(Boolean);
  while (tokens.length > 1 && TAG_WORDS.has(tokens[tokens.length - 1].toLowerCase())) {
    tokens.pop();
  }
  title = tokens.join(" ");
  return {
    title,
    aliases: aliases.filter(
      (alias) => alias.length > 1 && !/\bseason\s*\d+/i.test(alias)
    )
  };
}
function parseSeasonFolder(name) {
  const match = String(name || "").match(SEASON_FOLDER_RE);
  if (!match) {
    return null;
  }
  const { title, aliases } = splitShowTitle(match[1]);
  if (!title) {
    return null;
  }
  const season = Number(match[2]);
  if (!season || season > 100) {
    return null;
  }
  return {
    title,
    aliases,
    season,
    year: match[3] ? Number(match[3]) : null,
    tail: (match[4] || "").trim()
  };
}
var QUALITY_AND_CODEC_RE = /\b(2160p|1080p|720p|480p|360p|540p|576p|4k|uhd|webrip|web[- ]?dl|webdl|bluray|brrip|hdrip|hdtv|x26[45]|h26[45]|hevc|avc|aac|ac3|ddp?5[ .]?1|10bit|8bit)\b/gi;
var BAD_EPISODE_NUMBERS = /* @__PURE__ */ new Set([240, 360, 480, 540, 576, 720]);
function episodeNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0 || number > 2e3 || BAD_EPISODE_NUMBERS.has(number)) {
    return null;
  }
  return number;
}
function episodeRange(fromValue, toValue) {
  const from = episodeNumber(fromValue);
  if (from === null) {
    return null;
  }
  const to = toValue === void 0 ? from : episodeNumber(toValue);
  if (to === null || to < from || to - from > 20) {
    return [from];
  }
  const episodes = [];
  for (let episode = from; episode <= to; episode++) {
    episodes.push(episode);
  }
  return episodes;
}
function parseEpisodeFile(filename, folderSeason) {
  const base = String(filename || "").replace(/\.[a-z0-9]+$/i, "");
  let match = base.match(
    /s(\d{1,2})\s*e\s*(\d{1,4})(?:\s*[-–]\s*e?\s*(\d{1,4}))?/i
  );
  if (match) {
    const episodes = episodeRange(match[2], match[3]);
    if (episodes) {
      return { season: Number(match[1]), episodes };
    }
  }
  match = base.match(
    /s(\d{1,2})\s*[._ -]\s*(?:ep?)\s*[._ -]?\s*(\d{1,4})(?![0-9])/i
  );
  if (match) {
    const episodes = episodeRange(match[2]);
    if (episodes) {
      return { season: Number(match[1]), episodes };
    }
  }
  match = base.match(/s(\d{1,2})\s*[._ -]?\s*(\d{2,4})(?![0-9pP])/i);
  if (match) {
    const episodes = episodeRange(match[2]);
    if (episodes) {
      return { season: Number(match[1]), episodes };
    }
  }
  match = base.match(
    /(?:^|[^a-z0-9])(?:episode|ep)\s*[._ -]?\s*(\d{1,4})(?![0-9])/i
  );
  if (match) {
    const episodes = episodeRange(match[1]);
    if (episodes) {
      return { season: folderSeason, episodes };
    }
  }
  match = base.match(
    /(?:^|[^a-z0-9])e\s*[._ -]?\s*(\d{1,4})(?![0-9])/i
  );
  if (match) {
    const episodes = episodeRange(match[1]);
    if (episodes) {
      return { season: folderSeason, episodes };
    }
  }
  match = base.match(
    /(?:^|[^0-9])(\d{1,2})\s*x\s*(\d{1,4})(?![0-9])/i
  );
  if (match) {
    const episodes = episodeRange(match[2]);
    if (episodes) {
      return { season: Number(match[1]), episodes };
    }
  }
  if (/s\d{1,2}\s*e\s*[-_ ]?all/i.test(base) || /all\s*in\s*one/i.test(base)) {
    return null;
  }
  if (/\bs\d{1,2}\b/i.test(base)) {
    return null;
  }
  const cleaned = base.replace(/\[[^\]]*\]/g, " ").replace(/\{[^}]*\}/g, " ").replace(/\([^)]*\)/g, " ").replace(/season\s*s?\d{1,2}/gi, " ").replace(/\b(19|20)\d{2}\b/g, " ").replace(QUALITY_AND_CODEC_RE, " ").replace(/\b\d+[ .]\d+\b/g, " ");
  const numbers = cleaned.match(/\d{1,4}(?!\d)/g);
  if (!numbers || numbers.length === 0) {
    return null;
  }
  const episode = episodeNumber(numbers[numbers.length - 1]);
  if (episode === null) {
    return null;
  }
  return { season: folderSeason, episodes: [episode] };
}
var SEASON_PACK_RE = /all\s*in\s*one|complete|webrip|web[- ]?dl|bluray|brrip|hdrip|s\d{1,2}\s*e\s*[-_ ]?all|\bpack\b/i;
function isSeasonPackName(filename) {
  return SEASON_PACK_RE.test(String(filename || ""));
}
function isSpecialName(filename) {
  return /\bspecials?\b/i.test(String(filename || ""));
}
function isVideoFile(filename) {
  const name = String(filename || "").toLowerCase();
  return VIDEO_EXTENSIONS.some((extension) => name.endsWith(extension));
}

// src/iccftp-series/catalog.js
var SKIP_NAMES = /* @__PURE__ */ new Set([
  "lost+found",
  "$recycle.bin",
  "system volume information"
]);
function isRangeSubfolder(name, showTitle) {
  const lowerName = String(name || "").toLowerCase();
  const lowerShow = String(showTitle || "").toLowerCase();
  if (/\bepisodes?\b|\bep\b|episode\s*\d+\s*(?:-|to)\s*episode|^\s*\d{1,4}\s*[-–]\s*\d{1,4}\s*$/i.test(
    name
  )) {
    return true;
  }
  return Boolean(lowerShow) && lowerName.startsWith(lowerShow);
}
function mapPool(items, limit, worker) {
  return __async(this, null, function* () {
    const results = new Array(items.length);
    let cursor = 0;
    function run() {
      return __async(this, null, function* () {
        while (cursor < items.length) {
          const index = cursor++;
          try {
            results[index] = yield worker(items[index], index);
          } catch (e) {
            results[index] = void 0;
          }
        }
      });
    }
    const workers = [];
    for (let i = 0; i < Math.min(limit, items.length); i++) {
      workers.push(run());
    }
    yield Promise.all(workers);
    return results;
  });
}
function discoverSeriesRoots(concurrency = 8) {
  return __async(this, null, function* () {
    const shares = DIRECT_ROOTS.map((url) => ({ url }));
    const shareLists = yield mapPool(
      SERVER_ROOTS,
      concurrency,
      (url) => __async(this, null, function* () {
        try {
          return yield fetchDirectory(url);
        } catch (err) {
          console.error(
            `[BDIX] Could not list ${url}: ${err.message}`
          );
          return [];
        }
      })
    );
    for (const entries of shareLists) {
      if (!entries)
        continue;
      for (const entry of entries) {
        if (entry.isDirectory) {
          shares.push({ url: entry.url });
        }
      }
    }
    const roots = [];
    const seenRoots = /* @__PURE__ */ new Set();
    const topLists = yield mapPool(
      shares,
      concurrency,
      (share) => __async(this, null, function* () {
        try {
          return {
            share,
            entries: yield fetchDirectory(share.url)
          };
        } catch (e) {
          return null;
        }
      })
    );
    const cartoonLists = [];
    for (const result of topLists) {
      if (!result)
        continue;
      for (const entry of result.entries) {
        if (!entry.isDirectory)
          continue;
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
    const cartoons = yield mapPool(
      cartoonLists,
      concurrency,
      (url) => __async(this, null, function* () {
        try {
          return yield fetchDirectory(url);
        } catch (e) {
          return [];
        }
      })
    );
    for (const entries of cartoons) {
      if (!entries)
        continue;
      for (const entry of entries) {
        if (!entry.isDirectory || !CARTOON_ROOT_RE.test(entry.name) || seenRoots.has(entry.url)) {
          continue;
        }
        seenRoots.add(entry.url);
        roots.push(entry.url);
      }
    }
    return roots;
  });
}
function crawlSeriesCatalog() {
  return __async(this, arguments, function* ({
    concurrency = 8,
    onProgress,
    shouldCollect
  } = {}) {
    const roots = yield discoverSeriesRoots(concurrency);
    console.log(
      `[BDIX] Crawling ${roots.length} series roots (concurrency=${concurrency})`
    );
    const queue = roots.map((url) => ({ url, depth: 1 }));
    const visited = /* @__PURE__ */ new Set();
    const records = [];
    const seen = /* @__PURE__ */ new Set();
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
        if (seen.has(key))
          return;
        seen.add(key);
        records.push(__spreadProps(__spreadValues({}, base), {
          season: seasonInfo.season,
          episode: null,
          pack: true
        }));
        return;
      }
      for (const episode of parsed.episodes) {
        const key = `${file.url}#${parsed.season}#${episode}`;
        if (seen.has(key))
          continue;
        seen.add(key);
        records.push(__spreadProps(__spreadValues({}, base), {
          season: parsed.season,
          episode,
          pack: false
        }));
      }
    }
    function processDirectory(url, depth) {
      return __async(this, null, function* () {
        if (visited.has(url) || depth > MAX_CRAWL_DEPTH) {
          return;
        }
        visited.add(url);
        directories++;
        let entries;
        try {
          entries = yield fetchDirectory(url);
        } catch (err) {
          if (depth <= 2) {
            console.error(
              `[BDIX] Could not list ${url}: ${err.message}`
            );
          }
          return;
        }
        const name = url.replace(/\/+$/, "").split("/").pop() || "";
        const decodedName = (() => {
          try {
            return decodeURIComponent(name);
          } catch (e) {
            return name;
          }
        })();
        const seasonInfo = SKIP_NAMES.has(decodedName.toLowerCase()) ? null : parseSeasonFolder(decodedName);
        if (seasonInfo && (!shouldCollect || shouldCollect(seasonInfo))) {
          const videoFiles = [];
          const subDirectories = [];
          for (const entry of entries) {
            if (entry.isDirectory) {
              subDirectories.push(entry);
            } else if (isVideoFile(entry.name)) {
              videoFiles.push(entry);
            }
          }
          for (const subDirectory of subDirectories) {
            if (!isRangeSubfolder(
              subDirectory.name,
              seasonInfo.title
            )) {
              continue;
            }
            try {
              const subEntries = yield fetchDirectory(
                subDirectory.url
              );
              for (const entry of subEntries) {
                if (!entry.isDirectory && isVideoFile(entry.name)) {
                  videoFiles.push(entry);
                }
              }
            } catch (e) {
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
            if (parsed || isSeasonPackName(file.name) || onlyFile) {
              addRecord(seasonInfo, file, parsed);
            }
          }
        }
        if (depth < MAX_CRAWL_DEPTH) {
          for (const entry of entries) {
            if (entry.isDirectory && !SKIP_NAMES.has(entry.name.toLowerCase())) {
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
      });
    }
    function worker() {
      return __async(this, null, function* () {
        while (cursor < queue.length) {
          const item = queue[cursor++];
          yield processDirectory(item.url, item.depth);
        }
      });
    }
    const workers = [];
    for (let i = 0; i < concurrency; i++) {
      workers.push(worker());
    }
    yield Promise.all(workers);
    if (onProgress) {
      onProgress({
        directories,
        records: records.length
      });
    }
    return records;
  });
}

// src/iccftp-series/utils.js
var DIACRITIC_GROUPS = {
  a: "\xE0\xE1\xE2\xE3\xE4\xE5\u0101\u0103\u0105\u01CE\u01DF\u01E1\u01FB\u0201\u0203\u0227\u1EA1\u1EA3\u1EA5\u1EA7\u1EA9\u1EAB\u1EAD\u1EAF\u1EB1\u1EB3\u1EB5\u1EB7",
  c: "\xE7\u0107\u0109\u010B\u010D",
  d: "\u010F\u0111",
  e: "\xE8\xE9\xEA\xEB\u0113\u0115\u0117\u0119\u011B\u0205\u0207\u0229\u1EB9\u1EBB\u1EBD\u1EBF\u1EC1\u1EC3\u1EC5\u1EC7",
  g: "\u011D\u011F\u0121\u0123",
  i: "\xEC\xED\xEE\xEF\u0129\u012B\u012D\u012F\u0131\u01D0\u0209\u020B\u1ECB\u1EC9",
  l: "\u013A\u013C\u013E\u0140\u0142",
  n: "\xF1\u0144\u0146\u0148\u0149\u014B",
  o: "\xF2\xF3\xF4\xF5\xF6\xF8\u014D\u014F\u0151\u01D2\u01EB\u01ED\u020D\u020F\u022B\u022D\u022F\u0231\u1ECD\u1ECF\u1ED1\u1ED3\u1ED5\u1ED7\u1ED9\u1EDB\u1EDD\u1EDF\u1EE1\u1EE3\u01A1",
  r: "\u0155\u0157\u0159\u0211\u0213",
  s: "\u015B\u015D\u015F\u0161\u0219",
  t: "\u0163\u0165\u0167\u021B",
  u: "\xF9\xFA\xFB\xFC\u0169\u016B\u016D\u016F\u0171\u0173\u01D4\u01D6\u01D8\u01DA\u01DC\u0215\u0217\u1EE5\u1EE7\u1EE9\u1EEB\u1EED\u1EEF\u1EF1\u01B0",
  y: "\xFD\xFF\u0177\u0233\u1EF3\u1EF5\u1EF7\u1EF9",
  z: "\u017A\u017C\u017E",
  ae: "\xE6",
  oe: "\u0153",
  ss: "\xDF",
  th: "\xFE"
};
var DIACRITIC_MAP = {};
for (const letter of Object.keys(DIACRITIC_GROUPS)) {
  for (const character of DIACRITIC_GROUPS[letter]) {
    DIACRITIC_MAP[character] = letter;
    const upper = character.toUpperCase();
    if (upper !== character) {
      DIACRITIC_MAP[upper] = letter;
    }
  }
}
var LEADING_ARTICLES = /* @__PURE__ */ new Set(["the", "a", "an"]);
var SUFFIX_TOKENS = /* @__PURE__ */ new Set([
  "md",
  "us",
  "uk",
  "tv",
  "series",
  "show",
  "hd",
  "4k"
]);
function stripDiacritics(value) {
  let text = String(value || "");
  if (typeof text.normalize === "function") {
    try {
      text = text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    } catch (e) {
    }
  }
  return text.replace(
    /[\u00c0-\u024f]/g,
    (character) => DIACRITIC_MAP[character] || character
  );
}
function normalizeTitle(title) {
  if (!title)
    return "";
  return stripDiacritics(title).toLowerCase().replace(/['’‘`´]/g, "").replace(/&/g, " and ").replace(/\./g, "").replace(/[_-]/g, " ").replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}
function tokenizeTitle(title) {
  return normalizeTitle(title).split(" ").filter(Boolean);
}
function matchTokens(title) {
  const tokens = tokenizeTitle(title);
  if (tokens.length > 1 && LEADING_ARTICLES.has(tokens[0])) {
    tokens.shift();
  }
  return tokens;
}
function compactTitle(title) {
  return matchTokens(title).join("");
}
function prefixScore(a, b) {
  let short = matchTokens(a);
  let long = matchTokens(b);
  if (!short.length || !long.length) {
    return 0;
  }
  if (short.length > long.length) {
    const swap = short;
    short = long;
    long = swap;
  }
  for (let i = 0; i < short.length; i++) {
    if (short[i] !== long[i]) {
      return 0;
    }
  }
  if (short.length === long.length) {
    return 1;
  }
  const extra = long.slice(short.length);
  if (short.length === 1) {
    if (!(extra.length === 1 && SUFFIX_TOKENS.has(extra[0]))) {
      return 0;
    }
  }
  return 0.9;
}
function titleSimilarity(a, b) {
  const aa = matchTokens(a);
  const bb = matchTokens(b);
  if (!aa.length || !bb.length) {
    return 0;
  }
  if (compactTitle(a) === compactTitle(b)) {
    return 1;
  }
  let matches = 0;
  for (const word of aa) {
    if (bb.includes(word)) {
      matches++;
    }
  }
  return matches / Math.max(aa.length, bb.length);
}
function titleScore(targetTitles, candidateTitles) {
  let best = 0;
  for (const target of targetTitles) {
    if (!target)
      continue;
    for (const candidate of candidateTitles) {
      if (!candidate)
        continue;
      const normalizedTarget = normalizeTitle(target);
      const normalizedCandidate = normalizeTitle(candidate);
      if (!normalizedTarget || !normalizedCandidate)
        continue;
      if (normalizedTarget === normalizedCandidate) {
        return 1;
      }
      if (compactTitle(normalizedTarget) === compactTitle(normalizedCandidate)) {
        return 1;
      }
      const prefix = prefixScore(normalizedTarget, normalizedCandidate);
      if (prefix > best) {
        best = prefix;
      }
      const similarity = titleSimilarity(
        normalizedTarget,
        normalizedCandidate
      );
      if (similarity > best) {
        best = similarity;
      }
    }
  }
  return best;
}
function yearScore(years, year) {
  if (!year || !years || years.length === 0) {
    return 0.5;
  }
  const min = Math.min(...years);
  const max = Math.max(...years);
  if (year >= min - 1 && year <= max + 2) {
    return 1;
  }
  const distance = year < min ? min - year : year - max;
  if (distance <= 2) {
    return 0.6;
  }
  if (distance <= 5) {
    return 0.3;
  }
  return 0;
}
function showYears(show) {
  if (show.years && show.years.length > 0) {
    return show.years;
  }
  if (show.year) {
    return [show.year];
  }
  return [];
}
function findShowEntry(index, target) {
  const targetTitles = (target.titles || []).filter(Boolean).map(normalizeTitle).filter(Boolean);
  if (!targetTitles.length) {
    return null;
  }
  for (const title of targetTitles) {
    if (index.shows[title]) {
      return { key: title, show: index.shows[title], score: 1 };
    }
  }
  if (index.aliases) {
    for (const title of targetTitles) {
      const key = index.aliases[title];
      if (key && index.shows[key]) {
        return { key, show: index.shows[key], score: 0.98 };
      }
    }
  }
  let best = null;
  const candidateTitles = [];
  for (const key of Object.keys(index.shows)) {
    const show = index.shows[key];
    candidateTitles.push(key);
    if (show.aliases) {
      for (const alias of show.aliases) {
        candidateTitles.push(normalizeTitle(alias));
      }
    }
    const base = titleScore(targetTitles, candidateTitles);
    if (base < 0.8) {
      candidateTitles.length = 0;
      continue;
    }
    const years = showYears(show);
    const yearMatch = yearScore(years, target.year);
    if (base < 0.98 && yearMatch === 0) {
      candidateTitles.length = 0;
      continue;
    }
    const score = base * 0.85 + yearMatch * 0.15;
    if (!best || score > best.score) {
      best = { key, show, score };
    }
    candidateTitles.length = 0;
  }
  return best && best.score >= 0.7 ? best : null;
}
function findEpisodeUrls(show, season, episode) {
  const seasonEntry = show.seasons && show.seasons[String(season)];
  if (!seasonEntry) {
    return [];
  }
  const episodes = seasonEntry.episodes || {};
  const urls = episodes[String(episode)] || [];
  if (urls.length > 0) {
    return urls;
  }
  return seasonEntry.packs || [];
}
function getQuality(filename) {
  const match = String(filename || "").match(
    /(2160p|1080p|720p|480p|4k)/i
  );
  return match ? match[1] : "Auto";
}
function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch (e) {
    return value;
  }
}
function pad2(value) {
  const text = String(value);
  return text.length < 2 ? `0${text}` : text;
}
function buildEpisodeStream(url, showName, season, episode, quality) {
  const paddedSeason = pad2(season);
  const paddedEpisode = pad2(episode);
  const filename = safeDecode(
    String(url).split("/").filter(Boolean).pop() || ""
  );
  return {
    name: filename,
    title: `${showName} S${paddedSeason}E${paddedEpisode} - ${quality}`,
    url,
    quality,
    provider: "bdix"
  };
}
function qualityScore(quality) {
  if (!quality)
    return 0;
  const number = parseInt(quality, 10);
  return Number.isNaN(number) ? 0 : number;
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
function fetchTmdbShow(tmdbId) {
  return __async(this, null, function* () {
    try {
      const url = `${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${TMDB_API_KEY}`;
      const res = yield fetch(url, {
        headers: REQUEST_HEADERS
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = yield res.json();
      return {
        name: data.name || data.original_name,
        originalName: data.original_name,
        year: Number((data.first_air_date || "").slice(0, 4))
      };
    } catch (err) {
      console.error("[BDIX TMDB TV]", err);
      return null;
    }
  });
}
function fetchAlternativeTitles(tmdbId) {
  return __async(this, null, function* () {
    try {
      const url = `${TMDB_BASE_URL}/tv/${tmdbId}/alternative_titles?api_key=${TMDB_API_KEY}`;
      const res = yield fetch(url, {
        headers: REQUEST_HEADERS
      });
      if (!res.ok) {
        return [];
      }
      const data = yield res.json();
      if (!data || !Array.isArray(data.results)) {
        return [];
      }
      const titles = [];
      for (const entry of data.results) {
        if (entry && entry.title) {
          titles.push(entry.title);
        }
      }
      return titles;
    } catch (e) {
      return [];
    }
  });
}
function makeTarget(show, alternativeTitles = []) {
  const titles = [show.name, show.originalName, ...alternativeTitles].filter(Boolean).filter((title, index, all) => all.indexOf(title) === index);
  return {
    name: show.name,
    year: show.year,
    titles
  };
}
function showMatchesTarget(seasonFolder, target) {
  const candidates = [seasonFolder.title].concat(
    seasonFolder.aliases || []
  );
  const base = titleScore(target.titles || [], candidates);
  if (base < 0.8) {
    return false;
  }
  if (base >= 0.98) {
    return true;
  }
  if (!seasonFolder.year || !target.year) {
    return true;
  }
  return yearScore([seasonFolder.year], target.year) > 0;
}

// src/iccftp-series/series-index.js
function loadSeriesIndex() {
  return __async(this, null, function* () {
    const res = yield fetch(SERIES_INDEX_URL, {
      headers: {
        Accept: "application/json"
      }
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = yield res.json();
    if (!data || typeof data.shows !== "object" || data.shows === null) {
      throw new Error("invalid index format");
    }
    return data;
  });
}
function searchSeriesIndex(index, target, season, episode) {
  const match = findShowEntry(index, target);
  if (!match) {
    return { found: false, streams: [] };
  }
  const urls = findEpisodeUrls(match.show, season, episode);
  if (urls.length === 0) {
    return { found: true, match, streams: [] };
  }
  const streams = urls.map((url) => {
    const filename = String(url).split("/").filter(Boolean).pop() || "";
    const quality = getQuality(filename);
    return buildEpisodeStream(
      url,
      target.name,
      season,
      episode,
      quality
    );
  });
  return {
    found: true,
    match,
    streams: finalizeStreams(streams)
  };
}

// src/iccftp-series/extractor.js
function recordsToStreams(records, target, season, episode) {
  const exact = records.filter(
    (record) => !record.pack && record.season === season && record.episode === episode
  );
  const chosen = exact.length > 0 ? exact : records.filter(
    (record) => record.pack && record.season === season
  );
  return finalizeStreams(
    chosen.map(
      (record) => buildEpisodeStream(
        record.url,
        target.name,
        season,
        episode,
        getQuality(record.filename)
      )
    )
  );
}
function extractStreams(tmdbId, season, episode) {
  return __async(this, null, function* () {
    if (!season || !episode) {
      return [];
    }
    const show = yield fetchTmdbShow(tmdbId);
    if (!show) {
      return [];
    }
    let target = makeTarget(show);
    let index = null;
    try {
      index = yield loadSeriesIndex();
      let result = searchSeriesIndex(
        index,
        target,
        season,
        episode
      );
      if (result.streams.length > 0) {
        console.log(
          `[BDIX] Index hit: ${target.name} S${season}E${episode} -> ${result.streams.length} stream(s)`
        );
        return result.streams;
      }
      const alternativeTitles = yield fetchAlternativeTitles(
        tmdbId
      );
      if (alternativeTitles.length > 0) {
        target = makeTarget(show, alternativeTitles);
        result = searchSeriesIndex(
          index,
          target,
          season,
          episode
        );
        if (result.streams.length > 0) {
          console.log(
            `[BDIX] Index hit (alt title): ${target.name} S${season}E${episode} -> ${result.streams.length} stream(s)`
          );
          return result.streams;
        }
      }
      console.log(
        `[BDIX] Index miss: ${target.name} S${season}E${episode}, crawling servers`
      );
    } catch (err) {
      console.error(
        "[BDIX] Series index unavailable, crawling servers:",
        err.message
      );
    }
    const records = yield crawlSeriesCatalog({
      shouldCollect: (seasonFolder) => showMatchesTarget(seasonFolder, target)
    });
    const streams = recordsToStreams(
      records,
      target,
      season,
      episode
    );
    if (streams.length > 0) {
      console.log(
        `[BDIX] Crawl hit: ${target.name} S${season}E${episode} -> ${streams.length} stream(s)`
      );
    }
    return streams;
  });
}

// src/iccftp-series/index.js
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      if (mediaType !== "tv") {
        return [];
      }
      console.log(
        `[BDIX] Searching TV TMDB=${tmdbId} S${season}E${episode}`
      );
      return yield extractStreams(
        tmdbId,
        Number(season),
        Number(episode)
      );
    } catch (err) {
      console.error("[BDIX]", err);
      return [];
    }
  });
}
