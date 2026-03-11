import "./load-env.mjs";
import fs from "fs/promises";
import path from "path";

const BPM_API_KEY = process.env.GETSONGBPM_API_KEY;
if (!BPM_API_KEY) {
  console.error("Missing GETSONGBPM_API_KEY env var.");
  process.exit(1);
}

const OUTPUT_PATH = path.resolve("data", "music-songs-discovered.json");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const slugify = (value) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

const classifyEnergy = (bpm) => {
  if (bpm >= 175) return "extreme";
  if (bpm >= 155) return "high";
  if (bpm >= 120) return "medium";
  return "low";
};

const classifyWorkout = (bpm) => {
  const workouts = [];
  if (bpm >= 170) workouts.push("speed_work");
  if (bpm >= 150 && bpm < 180) workouts.push("tempo_run");
  if (bpm >= 120 && bpm < 160) workouts.push("easy_run");
  if (bpm >= 155) workouts.push("finish_kick");
  if (bpm >= 130 && bpm < 170) workouts.push("long_run");
  if (bpm < 120) workouts.push("warm_up");
  return workouts.length ? workouts : ["easy_run"];
};

const searchSongs = async (query) => {
  const url = `https://api.getsong.co/search/?api_key=${BPM_API_KEY}&type=song&lookup=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url);
    if (res.status === 429) {
      console.log("  Rate limited, waiting 10s...");
      await sleep(10000);
      return searchSongs(query);
    }
    if (!res.ok) {
      console.log(`  API error ${res.status} for "${query}"`);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data.search) ? data.search : [];
  } catch (err) {
    console.log(`  Fetch error for "${query}": ${err.message}`);
    return [];
  }
};

// All the songs we want in our catalog
const SONG_QUERIES = [
  // === CLASSIC RUNNING ANTHEMS ===
  "Eye of the Tiger", "Lose Yourself", "Till I Collapse", "Can't Hold Us",
  "Stronger Kanye", "Blinding Lights", "Power Kanye", "Levels Avicii",
  "Thunderstruck", "Born to Run", "Run the World", "Pump It",
  "Remember the Name", "Harder Better Faster Stronger", "Sandstorm Darude",
  "Unstoppable Sia", "Dog Days Are Over", "Don't Stop Me Now",
  "We Will Rock You", "Jump Van Halen", "Livin' on a Prayer",
  "Welcome to the Jungle", "Enter Sandman", "Seven Nation Army",
  "I'm Shipping Up to Boston", "Mr. Brightside", "Sabotage Beastie Boys",
  "Killing in the Name", "Smells Like Teen Spirit", "Back in Black",
  "Run Boy Run", "Born To Be Wild", "Gonna Fly Now",

  // === POP/DANCE ===
  "Levitating Dua Lipa", "Physical Dua Lipa", "Don't Start Now",
  "Good as Hell", "Juice Lizzo", "About Damn Time",
  "Shake It Off", "Bad Blood Taylor Swift", "Anti-Hero",
  "Cruel Summer", "Flowers Miley Cyrus", "As It Was",
  "Espresso Sabrina Carpenter", "Titanium David Guetta", "Turn Down for What",
  "Get Lucky", "One More Time", "Uptown Funk",
  "Shut Up and Dance", "Counting Stars", "Fight Song",
  "Hall of Fame", "Centuries", "Warriors Imagine Dragons",
  "Radioactive", "Thunder Imagine Dragons", "Believer Imagine Dragons",
  "Whatever It Takes", "Natural Imagine Dragons", "Happy Pharrell",
  "Can't Stop the Feeling", "Shape of You", "Castle on the Hill",
  "Roar Katy Perry", "Firework Katy Perry", "Dark Horse",
  "Starships Nicki Minaj", "Super Bass", "Bang Bang Jessie J",
  "Problem Ariana Grande", "Break Free", "Into You",
  "7 Rings", "Thank U Next", "Bad Guy Billie Eilish",
  "Therefore I Am", "Birds of a Feather", "New Rules",
  "Attention Charlie Puth", "Closer Chainsmokers", "Something Just Like This",
  "Roses Chainsmokers", "Don't Let Me Down", "Stay Kid LAROI",
  "Industry Baby", "Montero", "Old Town Road",
  "Sunflower Post Malone", "Congratulations Post Malone", "Rockstar Post Malone",
  "Circles Post Malone", "Watermelon Sugar", "Adore You",
  "Drivers License", "Good 4 U", "Brutal Olivia Rodrigo",
  "Deja Vu Olivia Rodrigo", "Vampire Olivia Rodrigo", "Save Your Tears",
  "Starboy", "Die With a Smile", "Poker Face",
  "Born This Way", "Just Dance Lady Gaga", "Telephone Lady Gaga",
  "Señorita Camila Cabello", "Havana",

  // === INDIE/ALTERNATIVE ===
  "Tongue Tied Grouplove", "Pumped Up Kicks", "Take Me Out",
  "Last Nite Strokes", "Reptilia", "Are You Gonna Be My Girl",
  "Fluorescent Adolescent", "Do I Wanna Know", "R U Mine",
  "505 Arctic Monkeys", "Lonely Boy Black Keys", "Gold on the Ceiling",
  "Somebody Told Me", "When You Were Young", "Human Killers",
  "The Pretender Foo Fighters", "Everlong", "Best of You Foo Fighters",
  "My Hero Foo Fighters", "Learn to Fly", "All My Life Foo Fighters",
  "My Own Worst Enemy", "Song 2 Blur", "1901 Phoenix",
  "Midnight City", "Sweater Weather", "Electric Feel",
  "Kids MGMT", "Float On Modest Mouse", "Stressed Out",
  "Ride Twenty One Pilots", "Heathens",

  // === ROCK CLASSICS ===
  "Bohemian Rhapsody", "Another One Bites the Dust", "Paradise City",
  "Sweet Child O' Mine", "Highway to Hell", "You Shook Me All Night Long",
  "TNT AC/DC", "Master of Puppets", "Crazy Train",
  "Iron Man Black Sabbath", "Paranoid Black Sabbath", "Immigrant Song",
  "Whole Lotta Love", "Take On Me", "Rebel Yell",
  "Pour Some Sugar On Me", "You Give Love a Bad Name", "It's My Life Bon Jovi",
  "The Final Countdown", "We're Not Gonna Take It", "Kickstart My Heart",
  "Run to the Hills", "The Trooper", "Holy Diver",
  "Breaking the Law", "Cochise Audioslave", "Black Hole Sun",
  "Alive Pearl Jam", "Even Flow",

  // === MODERN ROCK/PUNK ===
  "Chop Suey", "Toxicity", "BYOB System of a Down",
  "Last Resort Papa Roach", "Numb Linkin Park", "In the End",
  "Faint Linkin Park", "What I've Done", "Crawling",
  "New Divide", "Bulls on Parade", "Guerrilla Radio",
  "Down with the Sickness", "Bodies Drowning Pool", "Headstrong Trapt",
  "Hero Skillet", "Monster Skillet", "All the Small Things",
  "What's My Age Again", "American Idiot", "Holiday Green Day",
  "Basket Case", "Boulevard of Broken Dreams", "Self Esteem Offspring",
  "You're Gonna Go Far Kid", "The Kids Aren't Alright",
  "Fat Lip Sum 41", "In Too Deep Sum 41", "Misery Business",
  "Hard Times Paramore", "Sugar We're Goin Down", "Thnks fr th Mmrs",
  "Dance Dance Fall Out Boy", "Welcome to the Black Parade",
  "The Middle Jimmy Eat World", "Move Along",

  // === HIP-HOP / RAP ===
  "HUMBLE Kendrick Lamar", "DNA Kendrick Lamar", "Alright Kendrick",
  "Not Like Us", "SICKO MODE", "Goosebumps Travis Scott",
  "Antidote Travis Scott", "All I Do Is Win", "Started From the Bottom",
  "God's Plan", "Nice For What", "Jumpman",
  "No Role Modelz", "Middle Child", "Mask Off",
  "Godzilla Eminem", "Rap God", "Without Me Eminem",
  "Not Afraid Eminem", "The Real Slim Shady", "Forgot About Dre",
  "Still D.R.E.", "In Da Club", "Power Kanye West",
  "Black Skinhead", "Gold Digger", "All of the Lights",
  "Bodak Yellow", "I Like It Cardi B", "Mo Bamba",
  "XO Tour Llif3", "Lucid Dreams", "WHATS POPPIN",
  "Ransom Lil Tecca", "Mood 24kGoldn", "Highest in the Room",

  // === EDM / ELECTRONIC ===
  "Kernkraft 400", "Satisfaction Benny Benassi", "Animals Martin Garrix",
  "Lean On Major Lazer", "Faded Alan Walker", "Alone Alan Walker",
  "Wake Me Up Avicii", "The Nights Avicii", "Waiting for Love",
  "Hey Brother Avicii", "This Is What You Came For",
  "Summer Calvin Harris", "Feel So Close", "How Deep Is Your Love Calvin Harris",
  "Scary Monsters and Nice Sprites", "Save the World Swedish House Mafia",
  "Don't You Worry Child", "Strobe Deadmau5", "Ghosts N Stuff",
  "Opus Eric Prydz", "Losing It Fisher", "Piece of Your Heart",
  "Calabria", "Blue (Da Ba Dee)", "Insomnia Faithless",
  "Better Off Alone", "Show Me Love Robin S",

  // === FLORENCE + THE MACHINE ===
  "Dog Days Are Over Florence", "Shake It Out Florence",
  "You've Got the Love", "Spectrum Florence", "What Kind of Man",
  "Ship to Wreck", "Hunger Florence", "Free Florence",

  // === R&B / BEYONCE ===
  "Crazy in Love", "Single Ladies", "Love on Top",
  "Freedom Beyonce", "Formation", "Halo Beyonce",
  "Kill Bill SZA", "Good Days SZA", "Kiss Me More",
  "Paint the Town Red", "Say So Doja Cat", "Woman Doja Cat",
  "Truth Hurts Lizzo", "Greedy Tate McRae", "Water Tyla",

  // === 80s/90s/2000s CARDIO CLASSICS ===
  "Gonna Make You Sweat", "Pump Up the Jam", "Everybody Dance Now",
  "Get Ready for This", "No Limit 2 Unlimited", "Rhythm Is a Dancer",
  "Rhythm of the Night", "What Is Love Haddaway", "Show Me Love",
  "Firestarter Prodigy", "Breathe Prodigy", "Galvanize Chemical Brothers",
  "Right Here Right Now Fatboy Slim", "Praise You Fatboy Slim",
  "Born Slippy Underworld", "Girls Just Want to Have Fun",
  "Walking on Sunshine", "I Gotta Feeling", "Let's Get It Started",
  "Boom Boom Pow", "Hey Ya", "B.O.B. OutKast",
  "Crazy Gnarls Barkley", "Paper Planes", "Tik Tok Kesha",
  "September Earth Wind Fire", "Boogie Wonderland", "Stayin' Alive",
  "Push It Salt-N-Pepa", "Blue Monday", "Personal Jesus",

  // === MODERN HITS 2023-2026 ===
  "Houdini Dua Lipa", "Dance the Night", "Speed Drive Charli XCX",
  "360 Charli XCX", "Von Dutch Charli XCX", "Beautiful Things Benson Boone",
  "Too Sweet Hozier", "Unwritten", "Pocketful of Sunshine",
  "Fortnight Taylor Swift", "Karma Taylor Swift", "Lavender Haze",
  "Style Taylor Swift", "Blank Space", "22 Taylor Swift",
  "I Knew You Were Trouble", "Love Story Taylor Swift",
  "Look What You Made Me Do", "Padam Padam Kylie",
  "Rush Troye Sivan", "Unholy Sam Smith",

  // === LATIN ===
  "Despacito", "Bailando Enrique Iglesias", "Vivir Mi Vida",
  "Danza Kuduro", "Gasolina", "Mi Gente",
  "Waka Waka Shakira", "Hips Don't Lie", "Pepas Farruko",
  "Taki Taki", "Suavemente",
];

const run = async () => {
  // Load existing
  let existing = [];
  try {
    const raw = await fs.readFile(OUTPUT_PATH, "utf8");
    existing = JSON.parse(raw);
    console.log(`Loaded ${existing.length} existing tracks.`);
  } catch {
    console.log("No existing tracks file.");
  }

  // Build map of existing by item_key
  const songMap = new Map();
  for (const s of existing) {
    songMap.set(s.item_key, s);
  }

  console.log(`Searching ${SONG_QUERIES.length} queries via GetSongBPM API...`);
  let added = 0;

  for (let i = 0; i < SONG_QUERIES.length; i++) {
    const query = SONG_QUERIES[i];
    const results = await searchSongs(query);

    let found = 0;
    for (const r of results) {
      const title = r.title;
      const artist = r.artist?.name;
      const tempo = parseInt(r.tempo, 10);
      if (!title || !artist || !tempo || tempo <= 0) continue;

      const key = slugify(`${artist} ${title}`);
      if (songMap.has(key)) continue;

      const song = {
        item_key: key,
        spotify_id: null,
        title,
        artist,
        bpm: tempo,
        genre: r.artist?.genres ?? [],
        energy: classifyEnergy(tempo),
        workout: classifyWorkout(tempo),
        popularity: 50, // Default popularity since we don't have Spotify data
        source: "getsongbpm",
        upvotes: 0,
        downvotes: 0,
      };

      songMap.set(key, song);
      found++;
      added++;
    }

    console.log(`  [${i + 1}/${SONG_QUERIES.length}] "${query}": ${results.length} results, ${found} new`);
    await sleep(300); // Rate limit ~3 req/sec
  }

  const all = [...songMap.values()];
  // Sort: songs with BPM first, then by popularity
  all.sort((a, b) => {
    if (a.bpm && !b.bpm) return -1;
    if (!a.bpm && b.bpm) return 1;
    return (b.popularity ?? 0) - (a.popularity ?? 0);
  });

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(all, null, 2));
  console.log(`\nDone. Added ${added} new songs. Total: ${all.length} songs saved.`);
};

run().catch((err) => { console.error(err); process.exit(1); });
