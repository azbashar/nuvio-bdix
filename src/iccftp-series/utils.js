import {
    TMDB_API_KEY,
    TMDB_BASE_URL,
    REQUEST_HEADERS
} from "../shared/config.js";

const DIACRITIC_GROUPS = {
    a: "àáâãäåāăąǎǟǡǻȁȃȧạảấầẩẫậắằẳẵặ",
    c: "çćĉċč",
    d: "ďđ",
    e: "èéêëēĕėęěȅȇȩẹẻẽếềểễệ",
    g: "ĝğġģ",
    i: "ìíîïĩīĭįıǐȉȋịỉ",
    l: "ĺļľŀł",
    n: "ñńņňŉŋ",
    o: "òóôõöøōŏőǒǫǭȍȏȫȭȯȱọỏốồổỗộớờởỡợơ",
    r: "ŕŗřȑȓ",
    s: "śŝşšș",
    t: "ţťŧț",
    u: "ùúûüũūŭůűųǔǖǘǚǜȕȗụủứừửữựư",
    y: "ýÿŷȳỳỵỷỹ",
    z: "źżž",
    ae: "æ",
    oe: "œ",
    ss: "ß",
    th: "þ"
};

const DIACRITIC_MAP = {};

for (const letter of Object.keys(DIACRITIC_GROUPS)) {
    for (const character of DIACRITIC_GROUPS[letter]) {
        DIACRITIC_MAP[character] = letter;

        const upper = character.toUpperCase();

        if (upper !== character) {
            DIACRITIC_MAP[upper] = letter;
        }
    }
}

const LEADING_ARTICLES = new Set(["the", "a", "an"]);

const SUFFIX_TOKENS = new Set([
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

    // Hermes may not implement String.prototype.normalize, so guard it and
    // fall back to the manual map below.
    if (typeof text.normalize === "function") {
        try {
            text = text
                .normalize("NFKD")
                .replace(/[\u0300-\u036f]/g, "");
        } catch {
            // keep the original text
        }
    }

    return text.replace(
        /[\u00c0-\u024f]/g,
        (character) => DIACRITIC_MAP[character] || character
    );
}

export function normalizeTitle(title) {
    if (!title) return "";

    return stripDiacritics(title)
        .toLowerCase()

        // "Hell's Paradise" -> "hells paradise"
        .replace(/['’‘`´]/g, "")

        // "B & B" and "B and B" should compare the same
        .replace(/&/g, " and ")

        // "House M.D" -> "house md" (dots inside abbreviations vanish),
        // "Spider-Man" -> "spider man".
        .replace(/\./g, "")
        .replace(/[_-]/g, " ")

        // remove punctuation
        .replace(/[^\w\s]/g, " ")

        .replace(/\s+/g, " ")
        .trim();
}

export function tokenizeTitle(title) {
    return normalizeTitle(title)
        .split(" ")
        .filter(Boolean);
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
        // "House" -> "House MD" is safe, but "Paradise" -> "Hells
        // Paradise" is not. Only accept known suffixes for one-word titles.
        if (!(extra.length === 1 && SUFFIX_TOKENS.has(extra[0]))) {
            return 0;
        }
    }

    return 0.9;
}

export function titleSimilarity(a, b) {
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

/**
 * Best match score between any target title and any candidate title.
 */
export function titleScore(targetTitles, candidateTitles) {
    let best = 0;

    for (const target of targetTitles) {
        if (!target) continue;

        for (const candidate of candidateTitles) {
            if (!candidate) continue;

            const normalizedTarget = normalizeTitle(target);
            const normalizedCandidate = normalizeTitle(candidate);

            if (!normalizedTarget || !normalizedCandidate) continue;

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

/**
 * Scores how plausible a show is for a first-air year. Year is only a
 * tie-breaker: BDIX season folders use the season's air year, so exact
 * equality is never required.
 */
export function yearScore(years, year) {
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

/**
 * Finds the best show entry in a loaded index.
 *
 * @param {object} index
 * @param {{titles: string[], year?: number}} target
 */
export function findShowEntry(index, target) {
    const targetTitles = (target.titles || [])
        .filter(Boolean)
        .map(normalizeTitle)
        .filter(Boolean);

    if (!targetTitles.length) {
        return null;
    }

    // Fast path: exact title.
    for (const title of targetTitles) {
        if (index.shows[title]) {
            return { key: title, show: index.shows[title], score: 1 };
        }
    }

    // Fast path: parenthetical alias, e.g. "Jigokuraku".
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

        // A fuzzy/prefix match with a clearly wrong year is noise.
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

export function findEpisodeUrls(show, season, episode) {
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

export function getQuality(filename) {
    const match = String(filename || "").match(
        /(2160p|1080p|720p|480p|4k)/i
    );

    return match ? match[1] : "Auto";
}

function safeDecode(value) {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

function pad2(value) {
    const text = String(value);

    return text.length < 2 ? `0${text}` : text;
}

export function buildEpisodeStream(
    url,
    showName,
    season,
    episode,
    quality
) {
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
    if (!quality) return 0;

    const number = parseInt(quality, 10);

    return Number.isNaN(number) ? 0 : number;
}

/**
 * Sorts by quality (best first) and removes duplicate URLs.
 */
export function finalizeStreams(streams) {
    const sorted = [...streams].sort(
        (a, b) => qualityScore(b.quality) - qualityScore(a.quality)
    );

    const unique = new Map();

    for (const stream of sorted) {
        if (!unique.has(stream.url)) {
            unique.set(stream.url, stream);
        }
    }

    return Array.from(unique.values());
}

export async function fetchTmdbShow(tmdbId) {
    try {
        const url =
            `${TMDB_BASE_URL}/tv/${tmdbId}` +
            `?api_key=${TMDB_API_KEY}`;

        const res = await fetch(url, {
            headers: REQUEST_HEADERS
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        return {
            name: data.name || data.original_name,
            originalName: data.original_name,
            year: Number((data.first_air_date || "").slice(0, 4))
        };
    } catch (err) {
        console.error("[BDIX TMDB TV]", err);
        return null;
    }
}

export async function fetchAlternativeTitles(tmdbId) {
    try {
        const url =
            `${TMDB_BASE_URL}/tv/${tmdbId}/alternative_titles` +
            `?api_key=${TMDB_API_KEY}`;

        const res = await fetch(url, {
            headers: REQUEST_HEADERS
        });

        if (!res.ok) {
            return [];
        }

        const data = await res.json();

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
    } catch {
        return [];
    }
}

export function makeTarget(show, alternativeTitles = []) {
    const titles = [show.name, show.originalName, ...alternativeTitles]
        .filter(Boolean)
        .filter((title, index, all) => all.indexOf(title) === index);

    return {
        name: show.name,
        year: show.year,
        titles
    };
}

/**
 * Used by the live-crawl fallback: does this season folder belong to the
 * requested show?
 */
export function showMatchesTarget(seasonFolder, target) {
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
