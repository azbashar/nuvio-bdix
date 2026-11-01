import cheerio from "cheerio-without-node-native";

import { REQUEST_HEADERS } from "../shared/config.js";

function withTrailingSlash(url) {
    return url.endsWith("/") ? url : `${url}/`;
}

export function basenameFromUrl(url) {
    const withoutQuery = String(url || "")
        .split("?")[0]
        .split("#")[0]
        .replace(/\/+$/, "");

    const last = withoutQuery.split("/").pop() || "";

    try {
        return decodeURIComponent(last);
    } catch {
        return last;
    }
}

/**
 * Fetches an Apache/IIS directory listing and returns absolute child URLs.
 *
 * Parent links are skipped even when the server emits absolute hrefs (some
 * IIS shares do), otherwise the crawler would walk back up the tree.
 */
export async function fetchDirectory(url) {
    let res;
    let lastError;

    // BDIX shares occasionally drop a request (or a whole server briefly
    // disappears). Retry a couple of times before giving up.
    for (let attempt = 0; attempt < 3; attempt++) {
        res = null;

        try {
            res = await fetch(url, {
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
            await new Promise((resolve) =>
                setTimeout(resolve, 250 * (attempt + 1))
            );
        }
    }

    if (!res || !res.ok) {
        throw lastError || new Error("request failed");
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const entries = [];
    const seen = new Set();
    const current = withTrailingSlash(url);

    $("a").each((_, element) => {
        const href = $(element).attr("href");

        if (!href) return;

        if (
            href === "../" ||
            href === "/" ||
            href.startsWith("?") ||
            href.startsWith("#")
        ) {
            return;
        }

        let absolute;

        try {
            absolute = new URL(href, url).toString();
        } catch {
            return;
        }

        if (
            absolute === url ||
            absolute === current ||
            current.startsWith(withTrailingSlash(absolute))
        ) {
            return;
        }

        if (seen.has(absolute)) return;

        seen.add(absolute);

        const isDirectory = href.endsWith("/");

        entries.push({
            url: absolute,
            name: basenameFromUrl(absolute),
            isDirectory
        });
    });

    return entries;
}
