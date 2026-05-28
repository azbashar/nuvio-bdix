/**
 * HTTP Utilities for FTPBD
 */

export const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

/**
 * Fetch text content from a URL
 * @param {string} url 
 * @param {object} options 
 */
export async function fetchText(url, options = {}) {
    console.log(`[FTPBD] Fetching: ${url}`);

    const response = await fetch(url, {
        headers: {
            ...HEADERS,
            ...options.headers
        },
        ...options
    });

    if (!response.ok) {
        throw new Error(`HTTP error ${response.status} for ${url}`);
    }

    return await response.text();
}

/**
 * Fetch JSON content from a URL
 * @param {string} url 
 * @param {object} options 
 */
export async function fetchJson(url, options = {}) {
    const raw = await fetchText(url, options);
    return JSON.parse(raw);
}
