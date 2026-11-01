
const { getStreams } = require('./providers/iccftp-series.js');

// ==========================================
// TV SHOWS
// ==========================================

const tvIds = [
    "1399",      // Game of Thrones
    "1396",      // Breaking Bad
    "1402",      // The Walking Dead
    "66732",     // Stranger Things
    "94997",     // House of the Dragon
    "82856",     // The Mandalorian
    "84958",     // Loki
    "60574",     // Peaky Blinders
    "71446",     // Money Heist
    "71912",     // The Witcher

    "76479",     // The Boys
    "1418",      // The Big Bang Theory
    "456",       // The Simpsons
    "1668",      // Friends
    "1398",      // The Sopranos
    "63174",     // Lucifer
    "63351",     // Narcos
    "87108",     // Chernobyl
    "100088",    // The Last of Us
    "93405",     // Squid Game

    "94605",     // Arcane
    "110316",    // Alice in Borderland
    "119051",    // Wednesday
    "71914",     // Foundation
    "103768",    // Sweet Tooth
    "76441",     // The Rookie
    "1434",      // Family Guy
    "1412",      // Arrow
    "60735",     // The Flash
    "1416",      // Grey's Anatomy

    "44217",     // Vikings
    "44264",     // The 100
    "46261",     // The Expanse
    "60572",     // Homeland
    "1408",      // House
    "1413",      // Yellowstone
    "8717",      // The Office (US)
    "48866",     // The 100
    "4614",      // NCIS
    "71712",     // The Good Doctor

    "100088",    // The Last of Us
    "93740",     // The Penguin
    "95557",     // Invincible
    "60708",     // Gotham
    "1419",      // Castle
    "1415",      // Supernatural
    "1405",      // Dexter
    "1411",      // Person of Interest
    "1438",      // The Wire
    "1667"       // Twin Peaks
];

// ==========================================
// ANIME
// ==========================================

const animeIds = [
    "46260",     // Naruto Shippuden
    "46261",     // Naruto
    "45790",     // One Piece
    "30984",     // Bleach
    "1429",      // Attack on Titan
    "85937",     // Demon Slayer
    "95479",     // Jujutsu Kaisen
    "127532",    // Solo Leveling
    "114410",    // Chainsaw Man
    "88803",     // Tokyo Revengers

    "110309",    // My Hero Academia
    "67075",     // Dragon Ball Super
    "12971",     // Dragon Ball Z
    "31911",     // Death Note
    "46298",     // Hunter x Hunter
    "46299",     // Fullmetal Alchemist: Brotherhood
    "64440",     // One Punch Man
    "62104",     // Sword Art Online
    "61663",     // Tokyo Ghoul
    "85938",     // Spy x Family

    "95557",     // Vinland Saga
    "209867",    // Blue Lock
    "114478",    // Mob Psycho 100
    "62741",     // Haikyuu!!
    "65942",     // Black Clover
    "46298",     // Hunter x Hunter
    "31917",     // Psycho-Pass
    "77721",     // Dr. Stone
    "114471",    // JoJo's Bizarre Adventure
    "106379",    // The Promised Neverland

    "72636",     // Re:Zero
    "85937",     // Demon Slayer
    "110316",    // Ranking of Kings
    "123249",    // Oshi no Ko
    "126308",    // Frieren: Beyond Journey's End
    "209867",    // Blue Lock
    "120089",    // Bocchi the Rock!
    "129552",    // Mashle
    "114410",    // Chainsaw Man
    "127532"     // Solo Leveling
];

// ==========================================
// TEST RUNNER
// ==========================================

async function testCategory(category, ids, season = 1, episode = 1) {
    console.log(`\n========== ${category.toUpperCase()} TEST ==========\n`);

    const results = [];

    for (const id of ids) {
        const start = Date.now();

        try {
            const items = await getStreams(id, "tv", season, episode);

            const elapsed = ((Date.now() - start) / 1000).toFixed(2);

            if (items && items.length > 0) {
                results.push({
                    time: elapsed,
                    title: items[0].title
                });
            } else {
                results.push({
                    time: elapsed,
                    title: `No results (${id})`
                });
            }

        } catch (err) {
            const elapsed = ((Date.now() - start) / 1000).toFixed(2);

            results.push({
                time: elapsed,
                title: `Error (${id}): ${err.message}`
            });
        }
    }

    for (const result of results) {
        console.log(`[${result.time}s] ${result.title}`);
    }

    const total = results.reduce(
        (sum, r) => sum + Number(r.time), 0
    );

    const successful = results.filter(
        r => !r.title.startsWith("No results") &&
             !r.title.startsWith("Error")
    ).length;

    const failed = results.length - successful;

    console.log("\n==========================");
    console.log(`Category: ${category}`);
    console.log(`Checked: ${results.length}`);
    console.log(`Found: ${successful}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total time: ${total.toFixed(2)}s`);
    console.log(
        `Average: ${(total / results.length).toFixed(2)}s/show`
    );
}

// ==========================================
// MAIN
// ==========================================

async function run() {
    const start = Date.now();

    await testCategory("tv", tvIds);
    await testCategory("anime", animeIds);

    console.log("\n========== FINAL SUMMARY ==========");
    console.log(`Total IDs: ${tvIds.length + animeIds.length}`);
    console.log(
        `Total execution time: ${((Date.now() - start) / 1000).toFixed(2)}s`
    );
    console.log("===================================");
}

run();
