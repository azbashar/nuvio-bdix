export const SERVER_ROOTS = [
    // These contain share folders
    "http://10.16.100.206/ftps3/",
    "http://10.16.100.202/ftps10/",
    "http://10.16.100.213/iccftps13/",
    "http://10.16.100.212/iccftps12/"
];


export const DIRECT_MOVIE_ROOTS = [
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
    "http://10.16.100.250/ftps10d2/",
    

];

export const TMDB_API_KEY = "1865f43a0549ca50d341dd9ab8b29f49";

export const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export const VIDEO_EXTENSIONS = [
    ".mkv",
    ".mp4",
    ".avi",
    ".m4v",
    ".mov"
];

export const CACHE_TTL = 24 * 60 * 60 * 1000; // 15 minutes

export const REQUEST_HEADERS = {
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    "Accept": "text/html,application/json,*/*"
};