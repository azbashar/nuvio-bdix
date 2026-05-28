/**
 * FTPBD Extractor Logic
 * Traverses multiple FTPBD h5ai servers, matches movies/TV shows, and parses custom episode formats.
 */

import { fetchText } from './http.js';
import cheerio from 'cheerio-without-node-native';

const SERVERS = [
    "https://server2.ftpbd.net/FTP-2/",
    "https://server3.ftpbd.net/FTP-3/",
    "https://server5.ftpbd.net/FTP-5/"
];

const TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Grouped in-memory cache for the three FTPBD servers
const serverCaches = {
    "https://server2.ftpbd.net/FTP-2/": { files: null, timestamp: 0 },
    "https://server3.ftpbd.net/FTP-3/": { files: null, timestamp: 0 },
    "https://server5.ftpbd.net/FTP-5/": { files: null, timestamp: 0 }
};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

/**
 * Resolves a relative URL against a base URL safely
 */
function resolveUrl(href, baseUrl) {
    try {
        return new URL(href, baseUrl).href;
    } catch (e) {
        if (href.startsWith('http://') || href.startsWith('https://')) return href;
        if (href.startsWith('/')) {
            const origin = baseUrl.split('/').slice(0, 3).join('/');
            return origin + href;
        }
        const baseParts = baseUrl.split('/');
        if (!baseUrl.endsWith('/')) baseParts.pop();
        return baseParts.join('/') + '/' + href;
    }
}

/**
 * Normalizes text for comparison (removes punctuation, lowercases, replaces underscores/dots with spaces)
 */
function normalizeText(text) {
    if (!text) return "";
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Crawls a single h5ai server recursively using concurrent BFS via fallback HTML table
 */
async function crawlServer(rootUrl) {
    console.log(`[FTPBD] Starting crawl on server: ${rootUrl}`);
    const visited = new Set();
    const movieFiles = [];
    const queue = [rootUrl];
    const maxConcurrency = 10;
    
    let totalRequests = 0;
    const maxRequests = 200; // Safe threshold per server

    while (queue.length > 0 && totalRequests < maxRequests) {
        const batch = queue.splice(0, maxConcurrency);
        
        await Promise.all(batch.map(async (dirUrl) => {
            if (visited.has(dirUrl)) return;
            visited.add(dirUrl);
            
            try {
                totalRequests++;
                const html = await fetchText(dirUrl);
                const $ = cheerio.load(html);
                
                // Parse h5ai's fallback table anchors
                $('a').each((_, element) => {
                    const href = $(element).attr('href');
                    if (!href) return;
                    
                    // Skip parent directories, query params, or root links
                    if (href === '../' || href.endsWith('/../') || href.startsWith('?') || href.startsWith('/')) return;
                    
                    const absoluteUrl = resolveUrl(href, dirUrl);
                    
                    // Safety check: must stay within the server's root FTP directory
                    if (!absoluteUrl.startsWith(rootUrl)) return;
                    
                    if (href.endsWith('/')) {
                        if (!visited.has(absoluteUrl) && !queue.includes(absoluteUrl)) {
                            queue.push(absoluteUrl);
                        }
                    } else {
                        const ext = absoluteUrl.split('.').pop().toLowerCase();
                        const videoExtensions = ['mp4', 'mkv', 'avi', 'webm', 'ts', 'm3u8', 'mov'];
                        
                        if (videoExtensions.includes(ext)) {
                            const fileAnchorText = $(element).text().trim();
                            const decodedName = decodeURIComponent(absoluteUrl.split('/').pop());
                            const fileName = fileAnchorText && !fileAnchorText.includes('/') ? fileAnchorText : decodedName;
                            
                            movieFiles.push({
                                fileName,
                                url: absoluteUrl,
                                serverRoot: rootUrl
                            });
                        }
                    }
                });
            } catch (error) {
                console.error(`[FTPBD] Failed to crawl directory ${dirUrl}: ${error.message}`);
            }
        }));
    }
    
    console.log(`[FTPBD] Crawl finished for ${rootUrl}. Found ${movieFiles.length} video files.`);
    return movieFiles;
}

/**
 * Aggregates and caches files across all 3 servers in parallel
 */
async function getAllServersFilesList() {
    const now = Date.now();
    const crawlPromises = SERVERS.map(async (serverUrl) => {
        const cache = serverCaches[serverUrl];
        if (cache.files && (now - cache.timestamp < CACHE_TTL)) {
            return cache.files;
        }
        
        try {
            const files = await crawlServer(serverUrl);
            serverCaches[serverUrl] = { files, timestamp: now };
            return files;
        } catch (error) {
            console.error(`[FTPBD] Crawling server ${serverUrl} failed: ${error.message}`);
            return cache.files || []; // return stale cache if present
        }
    });
    
    const aggregatedResults = await Promise.all(crawlPromises);
    return aggregatedResults.flat();
}

/**
 * Fetches movie/show metadata from TMDB using TMDB ID
 */
export async function getTMDBDetails(tmdbId, mediaType) {
    const endpoint = mediaType === "tv" ? "tv" : "movie";
    const url = `${TMDB_BASE_URL}/${endpoint}/${tmdbId}?api_key=${TMDB_API_KEY}`;
    
    try {
        console.log(`[FTPBD] Fetching TMDB details for ${mediaType} ID: ${tmdbId}`);
        const response = await fetch(url, {
            headers: {
                "Accept": "application/json",
                "User-Agent": "Mozilla/5.0"
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        
        const data = await response.json();
        const title = mediaType === "tv" ? data.name : data.title;
        const releaseDate = mediaType === "tv" ? data.first_air_date : data.release_date;
        const year = releaseDate ? parseInt(releaseDate.split("-")[0]) : null;
        
        return { title, year };
    } catch (error) {
        console.error(`[FTPBD] Failed to fetch TMDB details: ${error.message}`);
        return null;
    }
}

/**
 * Parses season and episode tags from TV show filename
 */
function parseSeasonEpisode(fileName) {
    const nameLower = fileName.toLowerCase();
    
    // 1. Match: S01E02, S1E2, S01-E02, S01.E02 (handles custom XYZ-S01-E02-XYZ patterns)
    const pattern1 = nameLower.match(/s(\d+)[-.]?e(\d+)/i);
    if (pattern1) {
        return {
            season: parseInt(pattern1[1]),
            episode: parseInt(pattern1[2])
        };
    }
    
    // 2. Match: 1x02, 01x02, 1x2
    const pattern2 = nameLower.match(/\b(\d+)x(\d+)\b/i);
    if (pattern2) {
        return {
            season: parseInt(pattern2[1]),
            episode: parseInt(pattern2[2])
        };
    }
    
    // 3. Match: season 1 episode 2
    const pattern3 = nameLower.match(/season\s*(\d+)\s*episode\s*(\d+)/i);
    if (pattern3) {
        return {
            season: parseInt(pattern3[1]),
            episode: parseInt(pattern3[2])
        };
    }
    
    return null;
}

/**
 * Determines if a file name matches the target query and criteria
 */
function isMatch(fileName, mediaInfo, mediaType, season, episode) {
    const normFile = normalizeText(fileName);
    const normTitle = normalizeText(mediaInfo.title);
    
    // The filename must contain the target media title
    if (!normFile.includes(normTitle)) {
        return false;
    }
    
    if (mediaType === 'movie') {
        // Year matching logic (prevents sequels/prequels/remakes matches)
        if (mediaInfo.year) {
            const yearMatch = fileName.match(/\b(19\d{2}|20\d{2})\b/);
            if (yearMatch) {
                const fileYear = parseInt(yearMatch[1]);
                if (fileYear !== mediaInfo.year) {
                    return false; // Year mismatch
                }
            }
        }
        return true;
    } else if (mediaType === 'tv') {
        // TV episode matching logic (specifically supports S01-E01 custom patterns)
        if (season !== null && episode !== null) {
            const parsed = parseSeasonEpisode(fileName);
            if (parsed) {
                return parsed.season === season && parsed.episode === episode;
            }
            
            // Fallback strict substring checking if regex fails
            const sPad = String(season).padStart(2, '0');
            const ePad = String(episode).padStart(2, '0');
            return normFile.includes(`s${sPad}`) && normFile.includes(`e${ePad}`);
        }
        return true;
    }
    
    return false;
}

/**
 * Parses movie stream quality from a filename
 */
function parseQuality(fileName) {
    const nameLower = fileName.toLowerCase();
    if (nameLower.includes('2160p') || nameLower.includes('4k') || nameLower.includes('uhd')) return '4K';
    if (nameLower.includes('1080p') || nameLower.includes('fhd') || nameLower.includes('bluray')) return '1080p';
    if (nameLower.includes('720p') || nameLower.includes('hd')) return '720p';
    if (nameLower.includes('480p') || nameLower.includes('sd')) return '480p';
    if (nameLower.includes('cam') || nameLower.includes('screener') || nameLower.includes('hdtc') || nameLower.includes('ts')) return 'CAM';
    return '1080p'; // Default standard quality
}

/**
 * Main stream extraction coordinator
 */
export async function extractStreams(tmdbId, mediaType, season, episode) {
    // 1. Fetch TMDB details
    const mediaInfo = await getTMDBDetails(tmdbId, mediaType);
    if (!mediaInfo) {
        console.error(`[FTPBD] Could not retrieve media metadata for TMDB ID ${tmdbId}`);
        return [];
    }
    
    console.log(`[FTPBD] Searching for: "${mediaInfo.title}" (${mediaInfo.year || "N/A"})`);
    
    // 2. Fetch the entire files directory tree across all 3 servers
    const allFiles = await getAllServersFilesList();
    if (allFiles.length === 0) {
        console.warn(`[FTPBD] All FTPBD servers returned 0 accessible files.`);
        return [];
    }
    
    // 3. Match search target with files list
    const matchedFiles = allFiles.filter(file => 
        isMatch(file.fileName, mediaInfo, mediaType, season, episode)
    );
    
    console.log(`[FTPBD] Found ${matchedFiles.length} file matches for "${mediaInfo.title}".`);
    
    // 4. Map matches to Nuvio stream schema
    const streams = matchedFiles.map(file => {
        const cleanTitle = file.fileName.replace(/\.[a-zA-Z0-9]{2,4}$/, '');
        
        // Extract server index for display name (e.g. server2 -> FTPBD 2)
        const serverMatch = file.serverRoot.match(/server(\d+)/i);
        const serverName = serverMatch ? `FTPBD ${serverMatch[1]}` : "FTPBD";
        
        return {
            name: serverName,
            title: cleanTitle,
            url: file.url,
            quality: parseQuality(file.fileName),
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        };
    });
    
    // Sort high-quality streams first
    const qualityOrder = { "4K": 4, "1080p": 2, "720p": 1, "480p": 0, "CAM": -1 };
    return streams.sort((a, b) => (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0));
}
