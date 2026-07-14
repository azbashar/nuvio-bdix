const { getStreams } = require('./providers/iccftp-movies.js');

const movieIds = [
    "872585",   // Oppenheimer
    "157336",   // Interstellar
    "603",      // The Matrix
    "27205",    // Inception
    "155",      // The Dark Knight
    "278",      // The Shawshank Redemption
    "550",      // Fight Club
    "424",      // Schindler's List
    "680",      // Pulp Fiction
    "299536",   // Avengers: Infinity War

    "118340",   // Guardians of the Galaxy
    "24428",    // The Avengers
    "299534",   // Avengers: Endgame
    "634649",   // Spider-Man: No Way Home
    "569094",   // Spider-Man: Across the Spider-Verse
    "315162",   // Puss in Boots: The Last Wish
    "508442",   // Soul
    "508943",   // Luca
    "862",      // Toy Story
    "585",      // Monsters, Inc.

    "808",      // Shrek
    "12",       // Finding Nemo
    "920",      // Cars
    "9806",     // The Incredibles
    "10193",    // Toy Story 3
    "150540",   // Inside Out
    "693134",   // Dune: Part Two
    "438631",   // Dune
    "49051",    // The Hobbit: An Unexpected Journey
    "122917",   // The Hobbit: The Battle of the Five Armies

    "120",      // The Lord of the Rings: The Fellowship of the Ring
    "121",      // The Lord of the Rings: The Two Towers
    "122",      // The Lord of the Rings: The Return of the King
    "671",      // Harry Potter and the Philosopher's Stone
    "672",      // Harry Potter and the Chamber of Secrets
    "673",      // Harry Potter and the Prisoner of Azkaban
    "674",      // Harry Potter and the Goblet of Fire
    "675",      // Harry Potter and the Order of the Phoenix
    "767",      // Harry Potter and the Half-Blood Prince
    "12444",    // Harry Potter and the Deathly Hallows Part 1

    "12445",    // Harry Potter and the Deathly Hallows Part 2
    "11",       // Star Wars: A New Hope
    "1891",     // The Empire Strikes Back
    "1892",     // Return of the Jedi
    "140607",   // Star Wars: The Force Awakens
    "181808",   // Star Wars: The Last Jedi
    "181812",   // Star Wars: The Rise of Skywalker
    "335984",   // Blade Runner 2049
    "78",       // Blade Runner
    "185",      // A Clockwork Orange

    "1574",     // Chicago
    "769",      // GoodFellas
    "13",       // Forrest Gump
    "497",      // The Green Mile
    "539",      // Psycho
    "424694",   // Bohemian Rhapsody
    "614930",   // Teenage Mutant Ninja Turtles: Mutant Mayhem
    "447365",   // Guardians of the Galaxy Vol. 3
    "76600",    // Avatar: The Way of Water
    "19995",    // Avatar

    "10138",    // Iron Man 2
    "1726",     // Iron Man
    "10195",    // Thor
    "1771",     // Captain America: The First Avenger
    "100402",   // Captain America: The Winter Soldier
    "271110",   // Captain America: Civil War
    "284053",   // Thor: Ragnarok
    "299537",   // Captain Marvel
    "284052",   // Doctor Strange
    "453395",   // Doctor Strange in the Multiverse of Madness

    "634649",   // Spider-Man: No Way Home
    "429617",   // Spider-Man: Far From Home
    "315635",   // Spider-Man: Homecoming
    "102382",   // The Amazing Spider-Man 2
    "1930",     // The Amazing Spider-Man
    "497698",   // Black Widow
    "497698",   // Black Widow
    "436270",   // Black Panther
    "505642",   // Black Panther: Wakanda Forever
    "497698",   // Black Widow

    "346698",   // Barbie
    "424783",   // The Menu
    "646097",   // Rebel Moon
    "399566",   // Godzilla vs Kong
    "299687",   // The 5th Wave
    "419430",   // Get Out
    "419704",   // Ad Astra
    "49026",    // The Dark Knight Rises
    "49047",    // Gravity
    "76341",    // Mad Max: Fury Road

    "76338",    // Thor: Love and Thunder
    "68726",    // Pacific Rim
    "87101",    // Terminator Genisys
    "218",      // The Terminator
    "280",      // Terminator 2: Judgment Day
    "578",      // Jaws
    "694",      // The Shining
    "329",      // Jurassic Park
    "330",      // The Lost World: Jurassic Park
    "135397"    // Jurassic World
];

async function run() {
    const originalLog = console.log;
    const results = [];

    for (const id of movieIds) {
        const start = Date.now();

        try {
            // // silence provider logs
            // console.log = () => {};

            const items = await getStreams(id, "movie");

            // restore console.log
            console.log = originalLog;

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
            console.log = originalLog;

            const elapsed = ((Date.now() - start) / 1000).toFixed(2);

            results.push({
                time: elapsed,
                title: `Error (${id}): ${err.message}`
            });
        }
    }

    console.log("\n===== Search Summary =====\n");

    for (const result of results) {
        console.log(`[${result.time}s] ${result.title}`);
    }

    const total = results.reduce((sum, r) => sum + Number(r.time), 0);

    console.log("\n==========================");
    console.log(`Movies checked: ${results.length}`);
    console.log(`Total time: ${total.toFixed(2)}s`);
    console.log(`Average: ${(total / results.length).toFixed(2)}s/movie`);
}

run();