const { getStreams } = require('./providers/iccftp-movies.js');

async function run() {
    const items = await getStreams("769", "movie");
    console.log(items);
}

run();
