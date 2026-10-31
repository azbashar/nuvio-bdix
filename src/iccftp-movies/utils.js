import cheerio from "cheerio-without-node-native";
import {
    TMDB_BASE_URL,
    TMDB_API_KEY,
    REQUEST_HEADERS
} from "./constants.js";

export async function fetchTmdbDetails(tmdbId) {
    try {
        const url =
            `${TMDB_BASE_URL}/movie/${tmdbId}` +
            `?api_key=${TMDB_API_KEY}`;

        const res = await fetch(url, {
            headers: REQUEST_HEADERS
        });

        const data = await res.json();

        return {
            title: data.title || data.original_title,
            originalTitle: data.original_title,
            year: Number(
                (data.release_date || "")
                    .slice(0, 4)
            )
        };
    } catch (err) {
        console.error("[BDIX TMDB]", err);
        return null;
    }
}

export function normalizeTitle(title) {
    if (!title) return "";

    return title
        .toLowerCase()

        // Word.Word -> Word Word
        .replace(/\./g, " ")

        // Spider-Man -> Spider Man
        .replace(/[-_:]/g, " ")

        // remove punctuation
        .replace(/[^\w\s]/g, " ")

        // collapse spaces
        .replace(/\s+/g, " ")

        .trim();
}

export function tokenizeTitle(title) {
    return normalizeTitle(title)
        .split(" ")
        .filter(Boolean);
}

export function titleSimilarity(a, b) {
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

export function isGoodMatch(
    tmdbTitle,
    tmdbYear,
    fileTitle,
    fileYear
) {
    if (
        tmdbYear &&
        fileYear &&
        tmdbYear !== fileYear
    ) {
        return false;
    }

    const score =
        titleSimilarity(
            tmdbTitle,
            fileTitle
        );

    return score >= 0.80;
}

export function parseMovieFilename(filename) {
    const match = filename.match(
        /^(.*?)\s*\((\d{4})\)(.*?)\.(mkv|mp4|avi|m4v|mov)$/i
    );

    if (!match) {
        return null;
    }

    const quality =
        match[3]?.match(
            /(2160p|1080p|720p|480p)/i
        )?.[1] || "Auto";

    return {
        title: match[1].trim(),
        year: Number(match[2]),
        quality,
        extension: match[4].toLowerCase()
    };
}

export function getQuality(filename) {
    return (
        filename.match(
            /(2160p|1080p|720p|480p)/i
        )?.[1] || "Auto"
    );
}

export async function fetchDirectory(url) {
    const res = await fetch(url, {
        headers: REQUEST_HEADERS
    });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
    }

    const html = await res.text();

    const $ = cheerio.load(html);

    const entries = [];

    $("a").each((_, el) => {
        let href = $(el).attr("href");

        if (!href) return;

        if (
            href === "../" ||
            href === "/" ||
            href.startsWith("?")
        ) {
            return;
        }

        // Keep Apache's encoded href untouched
        // Only decode for display/search
        let name = href.replace(/\/$/, "");

        try {
            name = decodeURIComponent(name);
        } catch {
            // malformed % sequence, keep raw
        }

        entries.push({
            href,   // encoded URL, use this for requests
            name,   // decoded name, use this for matching
            isDirectory: href.endsWith("/")
        });
    });

    return entries;
}

export function buildStream(
    url,
    movieTitle,
    year,
    quality,
    file
) {
    return {
        name: `${file}`,
        title:
            `${movieTitle} (${year}) - ${quality}`,
        url,
        quality,
        provider: "bdix",
    };
}

function qualityScore(quality) {
    if (!quality) return 0;

    const num = parseInt(quality, 10);

    return Number.isNaN(num) ? 0 : num;
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