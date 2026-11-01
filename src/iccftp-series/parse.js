import { SEASON_FOLDER_RE } from "./constants.js";
import { VIDEO_EXTENSIONS } from "../shared/config.js";

const TAG_WORDS = new Set([
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

const LANGUAGE_AND_TAG_RE =
    /^(completed?|dubbed?|debbed|subbed?|hindi|english|japanese|korean|tamil|telugu|malayalam|bengali|bangla|urdu|dual(\s+audio)?|multi(\s+audio)?|cartoon|kids|anime|us|uk|au|ca|hd|fhd|uhd|4k|webrip|web[- ]?dl|bluray|brrip|hdrip|hevc|aac|x26[45]|h26[45]|10bit|8bit|special|specials|episodes?)$/i;

/**
 * Splits the part before "Season NN" into the primary show title and any
 * alternate titles stored inside parentheses, e.g.
 * "Hells Paradise (Jigokuraku)" -> title "Hells Paradise", alias "Jigokuraku".
 */
export function splitShowTitle(raw) {
    const aliases = [];

    let title = String(raw || "").replace(
        /\(([^)]*)\)/g,
        (_, inner) => {
            const value = String(inner || "").trim();
            const parts = value
                .split(/\s*[&,+]\s*|\s+and\s+/i)
                .map((part) => part.trim())
                .filter(Boolean);

            const isTag =
                !value ||
                /^(19|20)\d{2}$/.test(value) ||
                /^season\s*\d+/i.test(value) ||
                LANGUAGE_AND_TAG_RE.test(value) ||
                (parts.length > 0 &&
                    parts.every((part) => LANGUAGE_AND_TAG_RE.test(part)));

            if (!isTag) {
                aliases.push(value);
            }

            return " ";
        }
    );

    title = title
        .replace(/[-–—:._]+$/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    // Trailing tags that are not wrapped in parentheses, e.g.
    // "Show Name Complete Season 01".
    let tokens = title.split(" ").filter(Boolean);

    while (
        tokens.length > 1 &&
        TAG_WORDS.has(tokens[tokens.length - 1].toLowerCase())
    ) {
        tokens.pop();
    }

    title = tokens.join(" ");

    return {
        title,
        aliases: aliases.filter(
            (alias) =>
                alias.length > 1 &&
                !/\bseason\s*\d+/i.test(alias)
        )
    };
}

export function parseSeasonFolder(name) {
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

const QUALITY_AND_CODEC_RE =
    /\b(2160p|1080p|720p|480p|360p|540p|576p|4k|uhd|webrip|web[- ]?dl|webdl|bluray|brrip|hdrip|hdtv|x26[45]|h26[45]|hevc|avc|aac|ac3|ddp?5[ .]?1|10bit|8bit)\b/gi;

const BAD_EPISODE_NUMBERS = new Set([240, 360, 480, 540, 576, 720]);

function episodeNumber(value) {
    const number = Number(value);

    if (
        !Number.isFinite(number) ||
        number <= 0 ||
        number > 2000 ||
        BAD_EPISODE_NUMBERS.has(number)
    ) {
        return null;
    }

    return number;
}

function episodeRange(fromValue, toValue) {
    const from = episodeNumber(fromValue);

    if (from === null) {
        return null;
    }

    const to = toValue === undefined ? from : episodeNumber(toValue);

    if (to === null || to < from || to - from > 20) {
        return [from];
    }

    const episodes = [];

    for (let episode = from; episode <= to; episode++) {
        episodes.push(episode);
    }

    return episodes;
}

/**
 * Extracts season/episode numbers from a file name. Returns null when the
 * file has no episode number (a season pack or something that is not an
 * episode at all).
 */
export function parseEpisodeFile(filename, folderSeason) {
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

    // S0301 style (season + episode, no "E").
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

    //
    // Numeric fallback for folders that do not use SxxExx at all, e.g.
    // "Mr Queen 01.mkv", "One Piece Episode 1000.mkv" or "Naruto 001.mkv".
    // Remove season/year/quality/codec noise first so "Season 01 (2019)
    // Completed" does not turn into episode 1.
    //
    // "S01E-All", "All in One" and similar names are packs, not episode 1.
    if (
        /s\d{1,2}\s*e\s*[-_ ]?all/i.test(base) ||
        /all\s*in\s*one/i.test(base)
    ) {
        return null;
    }

    // Numeric fallback is only safe when the file does not already carry a
    // season marker; otherwise "Show S01 720p" would become episode 1.
    if (/\bs\d{1,2}\b/i.test(base)) {
        return null;
    }

    const cleaned = base
        .replace(/\[[^\]]*\]/g, " ")
        .replace(/\{[^}]*\}/g, " ")
        .replace(/\([^)]*\)/g, " ")
        .replace(/season\s*s?\d{1,2}/gi, " ")
        .replace(/\b(19|20)\d{2}\b/g, " ")
        .replace(QUALITY_AND_CODEC_RE, " ")
        .replace(/\b\d+[ .]\d+\b/g, " ");

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

const SEASON_PACK_RE =
    /all\s*in\s*one|complete|webrip|web[- ]?dl|bluray|brrip|hdrip|s\d{1,2}\s*e\s*[-_ ]?all|\bpack\b/i;

export function isSeasonPackName(filename) {
    return SEASON_PACK_RE.test(String(filename || ""));
}

export function isSpecialName(filename) {
    return /\bspecials?\b/i.test(String(filename || ""));
}

export function isVideoFile(filename) {
    const name = String(filename || "").toLowerCase();

    return VIDEO_EXTENSIONS.some((extension) => name.endsWith(extension));
}

export function isBareSeasonFolder(name) {
    return /^season\s*\d+$/i.test(String(name || "").trim());
}
