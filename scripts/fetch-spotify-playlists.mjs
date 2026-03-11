import "./load-env.mjs";
import fs from "fs/promises";
import path from "path";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing Spotify credentials. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.");
  process.exit(1);
}

const OUTPUT_PATH = path.resolve("data", "music-songs-discovered.json");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getToken = async () => {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  if (!response.ok) {
    throw new Error(`Spotify token request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
};

const spotifyGet = async (token, url) => {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get("retry-after") || "5", 10);
    if (retryAfter > 30) {
      console.log(`  Rate limited for ${retryAfter}s — saving progress and stopping.`);
      return { __rateLimited: true };
    }
    console.log(`  Rate limited, waiting ${retryAfter}s...`);
    await sleep(retryAfter * 1000);
    return spotifyGet(token, url);
  }

  if (!response.ok) {
    console.log(`  API error ${response.status} for ${url}`);
    return null;
  }

  return response.json();
};

// Search queries — popular running/workout songs across genres and eras
const SEARCH_QUERIES = [
  // === CLASSIC RUNNING ANTHEMS ===
  "Eye of the Tiger",
  "Lose Yourself Eminem",
  "Till I Collapse Eminem",
  "Cant Hold Us Macklemore",
  "Stronger Kanye West",
  "Blinding Lights",
  "Power Kanye West",
  "Levels Avicii",
  "Thunderstruck AC/DC",
  "Born to Run Springsteen",
  "Run the World Beyonce",
  "Pump It Black Eyed Peas",
  "Remember the Name Fort Minor",
  "Harder Better Faster Stronger",
  "Sandstorm Darude",
  "Unstoppable Sia",
  "Dog Days Are Over Florence",
  "Dont Stop Me Now Queen",
  "We Will Rock You Queen",
  "Jump Van Halen",
  "Livin on a Prayer",
  "Welcome to the Jungle",
  "Enter Sandman",
  "Seven Nation Army",
  "Shipping Up to Boston",
  "Mr Brightside",
  "Sabotage Beastie Boys",
  "Killing in the Name",
  "Smells Like Teen Spirit",
  "Back in Black AC/DC",
  "Run Boy Run Woodkid",
  "Born To Be Wild Steppenwolf",
  "Gonna Fly Now Rocky",
  "Chariots of Fire Vangelis",

  // === POP/DANCE HITS ===
  "Levitating Dua Lipa",
  "Physical Dua Lipa",
  "Dont Start Now Dua Lipa",
  "Good as Hell Lizzo",
  "Juice Lizzo",
  "About Damn Time Lizzo",
  "Shake It Off Taylor Swift",
  "Bad Blood Taylor Swift",
  "Anti-Hero Taylor Swift",
  "Cruel Summer Taylor Swift",
  "Flowers Miley Cyrus",
  "As It Was Harry Styles",
  "Espresso Sabrina Carpenter",
  "Titanium David Guetta",
  "Turn Down for What",
  "Get Lucky Daft Punk",
  "One More Time Daft Punk",
  "Uptown Funk Bruno Mars",
  "Shut Up and Dance Walk the Moon",
  "Counting Stars OneRepublic",
  "Fight Song Rachel Platten",
  "Hall of Fame The Script",
  "Centuries Fall Out Boy",
  "Warriors Imagine Dragons",
  "Radioactive Imagine Dragons",
  "Thunder Imagine Dragons",
  "Believer Imagine Dragons",
  "Whatever It Takes Imagine Dragons",
  "Natural Imagine Dragons",
  "Bangarang Skrillex",
  "Clarity Zedd",

  // === MORE POP ESSENTIALS ===
  "Happy Pharrell",
  "Cant Stop the Feeling Justin Timberlake",
  "Shape of You Ed Sheeran",
  "Castle on the Hill Ed Sheeran",
  "Roar Katy Perry",
  "Firework Katy Perry",
  "Dark Horse Katy Perry",
  "Starships Nicki Minaj",
  "Super Bass Nicki Minaj",
  "Bang Bang Jessie J",
  "Problem Ariana Grande",
  "Break Free Ariana Grande",
  "Into You Ariana Grande",
  "7 Rings Ariana Grande",
  "Thank U Next Ariana Grande",
  "Bad Guy Billie Eilish",
  "Therefore I Am Billie Eilish",
  "Birds of a Feather Billie Eilish",
  "New Rules Dua Lipa",
  "Attention Charlie Puth",
  "Closer Chainsmokers",
  "Something Just Like This Chainsmokers",
  "Roses Chainsmokers",
  "Dont Let Me Down Chainsmokers",
  "Paris Chainsmokers",
  "Stay Kid LAROI",
  "Industry Baby Lil Nas X",
  "Montero Lil Nas X",
  "Old Town Road Lil Nas X",
  "Sunflower Post Malone",
  "Congratulations Post Malone",
  "Rockstar Post Malone",
  "Circles Post Malone",
  "Watermelon Sugar Harry Styles",
  "Adore You Harry Styles",
  "Drivers License Olivia Rodrigo",
  "Good 4 U Olivia Rodrigo",
  "Brutal Olivia Rodrigo",
  "Deja Vu Olivia Rodrigo",
  "Vampire Olivia Rodrigo",
  "Positions Ariana Grande",
  "Save Your Tears Weeknd",
  "Starboy Weeknd",
  "Die With a Smile Lady Gaga",
  "APT Rose Bruno Mars",
  "Poker Face Lady Gaga",
  "Born This Way Lady Gaga",
  "Just Dance Lady Gaga",
  "Telephone Lady Gaga",
  "Applause Lady Gaga",
  "Senorita Camila Cabello",
  "Havana Camila Cabello",

  // === INDIE/ALTERNATIVE ===
  "Tongue Tied Grouplove",
  "Pumped Up Kicks Foster the People",
  "Sit Next to Me Foster the People",
  "Take Me Out Franz Ferdinand",
  "Last Nite The Strokes",
  "Reptilia The Strokes",
  "Are You Gonna Be My Girl Jet",
  "Dakota Stereophonics",
  "Fluorescent Adolescent Arctic Monkeys",
  "Do I Wanna Know Arctic Monkeys",
  "R U Mine Arctic Monkeys",
  "505 Arctic Monkeys",
  "Lonely Boy Black Keys",
  "Gold on the Ceiling Black Keys",
  "Tighten Up Black Keys",
  "Somebody Told Me Killers",
  "When You Were Young Killers",
  "Human Killers",
  "Caution Killers",
  "Run Killers",
  "The Pretender Foo Fighters",
  "Everlong Foo Fighters",
  "Best of You Foo Fighters",
  "My Hero Foo Fighters",
  "Learn to Fly Foo Fighters",
  "All My Life Foo Fighters",
  "My Own Worst Enemy Lit",
  "Song 2 Blur",
  "1901 Phoenix",
  "Lisztomania Phoenix",
  "Midnight City M83",
  "Sweater Weather Neighbourhood",
  "Electric Feel MGMT",
  "Kids MGMT",
  "Time to Pretend MGMT",
  "Obstacle 1 Interpol",
  "Float On Modest Mouse",
  "Stressed Out Twenty One Pilots",
  "Ride Twenty One Pilots",
  "Heathens Twenty One Pilots",
  "Chlorine Twenty One Pilots",

  // === ROCK CLASSICS ===
  "Bohemian Rhapsody Queen",
  "Somebody to Love Queen",
  "Under Pressure Queen",
  "Another One Bites the Dust Queen",
  "Paradise City Guns N Roses",
  "Sweet Child O Mine Guns N Roses",
  "Highway to Hell AC/DC",
  "You Shook Me All Night Long AC/DC",
  "TNT AC/DC",
  "Master of Puppets Metallica",
  "One Metallica",
  "Seek and Destroy Metallica",
  "Crazy Train Ozzy",
  "Iron Man Black Sabbath",
  "Paranoid Black Sabbath",
  "Immigrant Song Led Zeppelin",
  "Whole Lotta Love Led Zeppelin",
  "Black Dog Led Zeppelin",
  "Take On Me A-ha",
  "Rebel Yell Billy Idol",
  "Pour Some Sugar On Me Def Leppard",
  "You Give Love a Bad Name Bon Jovi",
  "Its My Life Bon Jovi",
  "Here I Go Again Whitesnake",
  "The Final Countdown Europe",
  "We're Not Gonna Take It Twisted Sister",
  "Kickstart My Heart Motley Crue",
  "Run to the Hills Iron Maiden",
  "The Trooper Iron Maiden",
  "Aces High Iron Maiden",
  "Holy Diver Dio",
  "Breaking the Law Judas Priest",
  "You Could Be Mine Guns N Roses",
  "Cochise Audioslave",
  "Like a Stone Audioslave",
  "Black Hole Sun Soundgarden",
  "Spoonman Soundgarden",
  "Alive Pearl Jam",
  "Even Flow Pearl Jam",
  "Jeremy Pearl Jam",
  "Would Alice in Chains",
  "Rooster Alice in Chains",

  // === MODERN ROCK/PUNK ===
  "Chop Suey System of a Down",
  "Toxicity System of a Down",
  "BYOB System of a Down",
  "Last Resort Papa Roach",
  "Numb Linkin Park",
  "In the End Linkin Park",
  "Faint Linkin Park",
  "What Ive Done Linkin Park",
  "Crawling Linkin Park",
  "Somewhere I Belong Linkin Park",
  "New Divide Linkin Park",
  "Bulls on Parade RATM",
  "Bombtrack RATM",
  "Guerrilla Radio RATM",
  "Sugar RATM",
  "Down with the Sickness Disturbed",
  "Inside the Fire Disturbed",
  "Indestructible Disturbed",
  "Bodies Drowning Pool",
  "Headstrong Trapt",
  "Hero Skillet",
  "Monster Skillet",
  "Whispers in the Dark Skillet",
  "All the Small Things Blink 182",
  "Whats My Age Again Blink 182",
  "Dammit Blink 182",
  "American Idiot Green Day",
  "Holiday Green Day",
  "Basket Case Green Day",
  "Boulevard of Broken Dreams Green Day",
  "Brain Stew Green Day",
  "Self Esteem Offspring",
  "Come Out and Play Offspring",
  "You're Gonna Go Far Kid Offspring",
  "Bad Habit Offspring",
  "The Kids Arent Alright Offspring",
  "Fat Lip Sum 41",
  "In Too Deep Sum 41",
  "Still Waiting Sum 41",
  "Misery Business Paramore",
  "Decode Paramore",
  "Hard Times Paramore",
  "Sugar Were Goin Down Fall Out Boy",
  "Thnks fr th Mmrs Fall Out Boy",
  "Dance Dance Fall Out Boy",
  "My Songs Know What You Did",
  "Welcome to the Black Parade MCR",
  "I'm Not Okay MCR",
  "Helena MCR",
  "The Middle Jimmy Eat World",
  "Pain Jimmy Eat World",
  "Sweetness Jimmy Eat World",
  "Move Along All American Rejects",

  // === HIP-HOP / RAP ===
  "HUMBLE Kendrick Lamar",
  "DNA Kendrick Lamar",
  "Alright Kendrick Lamar",
  "ELEMENT Kendrick Lamar",
  "Backseat Freestyle Kendrick Lamar",
  "Swimming Pools Kendrick Lamar",
  "Not Like Us Kendrick Lamar",
  "SICKO MODE Travis Scott",
  "Goosebumps Travis Scott",
  "Antidote Travis Scott",
  "All I Do Is Win DJ Khaled",
  "Started From the Bottom Drake",
  "Gods Plan Drake",
  "Nice For What Drake",
  "Nonstop Drake",
  "Energy Drake",
  "Jumpman Drake Future",
  "No Role Modelz J Cole",
  "Middle Child J Cole",
  "Power Trip J Cole",
  "Mask Off Future",
  "March Madness Future",
  "Godzilla Eminem",
  "Rap God Eminem",
  "Without Me Eminem",
  "Not Afraid Eminem",
  "The Real Slim Shady Eminem",
  "Forgot About Dre",
  "Still Dre",
  "In Da Club 50 Cent",
  "Many Men 50 Cent",
  "POWER Kanye",
  "Black Skinhead Kanye",
  "Stronger Kanye",
  "Gold Digger Kanye",
  "All of the Lights Kanye",
  "Runaway Kanye",
  "Flashing Lights Kanye",
  "Bodak Yellow Cardi B",
  "I Like It Cardi B",
  "Money Cardi B",
  "Hot N Cold Katy Perry",
  "Mo Bamba Sheck Wes",
  "XO Tour Life Lil Uzi Vert",
  "Money Longer Lil Uzi",
  "Lucid Dreams Juice WRLD",
  "Robbery Juice WRLD",
  "Praise The Lord ASAP Rocky",
  "F*ckin Problems ASAP Rocky",
  "Laugh Now Cry Later Drake",
  "Way 2 Sexy Drake",
  "Hotline Bling Drake",
  "WHATS POPPIN Jack Harlow",
  "Lovin on Me Jack Harlow",
  "Ransom Lil Tecca",
  "Mood 24kGoldn",
  "Highest in the Room Travis Scott",
  "FE!N Travis Scott",

  // === EDM / ELECTRONIC ===
  "Kernkraft 400",
  "Satisfaction Benny Benassi",
  "Bonfire Knife Party",
  "Animals Martin Garrix",
  "Tremor Dimitri Vegas",
  "Tsunami DVBBS",
  "Turn Up the Speakers Afrojack",
  "Lean On Major Lazer",
  "Light It Up Major Lazer",
  "Cold Water Major Lazer",
  "Faded Alan Walker",
  "Alone Alan Walker",
  "The Spectre Alan Walker",
  "Wake Me Up Avicii",
  "The Nights Avicii",
  "Waiting for Love Avicii",
  "Hey Brother Avicii",
  "Without You Avicii",
  "Summertime Sadness Lana Del Rey remix",
  "This Is What You Came For Calvin Harris",
  "Summer Calvin Harris",
  "Feel So Close Calvin Harris",
  "How Deep Is Your Love Calvin Harris",
  "Sweet Nothing Calvin Harris",
  "Scary Monsters and Nice Sprites Skrillex",
  "Cinema Skrillex remix",
  "First of the Year Skrillex",
  "Where Are U Now Jack U",
  "Lean On Major Lazer",
  "Pjanoo Eric Prydz",
  "Calling Lose My Mind Sebastian Ingrosso",
  "Save the World Swedish House Mafia",
  "Dont You Worry Child Swedish House Mafia",
  "Greyhound Swedish House Mafia",
  "One Swedish House Mafia",
  "Antidote Swedish House Mafia",
  "Midnight Swedish House Mafia",
  "In My Mind Dynoro",
  "Calabria Enur",
  "Blue Da Ba Dee Eiffel 65",
  "Insomnia Faithless",
  "Sandcastle Kingdoms Purity Ring",
  "Strobe Deadmau5",
  "Ghosts N Stuff Deadmau5",
  "Some Chords Deadmau5",
  "Professional Griefers Deadmau5",
  "Opus Eric Prydz",
  "Reload Sebastian Ingrosso",
  "I Took a Pill in Ibiza Mike Posner remix",
  "Roses Imanbek remix SAINt JHN",
  "Head and Heart Joel Corry",
  "Losing It Fisher",
  "Cola CamelPhat",
  "Piece of Your Heart Meduza",
  "Lose Control Meduza",
  "Paradise Meduza",

  // === R&B / SOUL WITH ENERGY ===
  "Crazy in Love Beyonce",
  "Single Ladies Beyonce",
  "Love on Top Beyonce",
  "Freedom Beyonce",
  "Formation Beyonce",
  "Sorry Beyonce",
  "Halo Beyonce",
  "Irreplaceable Beyonce",
  "Kill Bill SZA",
  "Good Days SZA",
  "Snooze SZA",
  "Kiss Me More Doja Cat",
  "Paint the Town Red Doja Cat",
  "Say So Doja Cat",
  "Woman Doja Cat",
  "Greedy Tate McRae",
  "Water Tyla",
  "Truth Hurts Lizzo",
  "Boys a Liar PinkPantheress",
  "Buss It Erica Banks",

  // === 80s / 90s / 2000s CARDIO CLASSICS ===
  "Gonna Make You Sweat C+C Music Factory",
  "Pump Up The Jam Technotronic",
  "Everybody Dance Now",
  "Let Me Clear My Throat",
  "Get Ready For This 2 Unlimited",
  "No Limit 2 Unlimited",
  "Rhythm Is a Dancer Snap",
  "Rhythm of the Night Corona",
  "What Is Love Haddaway",
  "Be My Lover La Bouche",
  "Show Me Love Robin S",
  "Finally Cece Peniston",
  "Free Ultranaté",
  "Better Off Alone Alice Deejay",
  "Sandstorm Darude",
  "Firestarter Prodigy",
  "Breathe Prodigy",
  "Smack My Bitch Up Prodigy",
  "Block Rockin Beats Chemical Brothers",
  "Galvanize Chemical Brothers",
  "Star Guitar Chemical Brothers",
  "Hey Boy Hey Girl Chemical Brothers",
  "Right Here Right Now Fatboy Slim",
  "Praise You Fatboy Slim",
  "Weapon of Choice Fatboy Slim",
  "Born Slippy Underworld",
  "Song 2 Blur",
  "Girls Just Want to Have Fun Cyndi Lauper",
  "Walking on Sunshine Katrina",
  "I Gotta Feeling Black Eyed Peas",
  "Lets Get It Started Black Eyed Peas",
  "Boom Boom Pow Black Eyed Peas",
  "Where Is the Love Black Eyed Peas",
  "Imma Be Black Eyed Peas",
  "Scream and Shout will.i.am",
  "Hey Ya Outkast",
  "Roses Outkast",
  "BOB Outkast",
  "Ms Jackson Outkast",
  "Crazy Gnarls Barkley",
  "Paper Planes MIA",
  "Bad Girls MIA",
  "Galang MIA",
  "Tik Tok Kesha",
  "We R Who We R Kesha",
  "Die Young Kesha",
  "Blame It on the Boogie Jacksons",
  "September Earth Wind Fire",
  "Boogie Wonderland Earth Wind Fire",
  "Lets Groove Earth Wind Fire",
  "Le Freak Chic",
  "Good Times Chic",
  "Stayin Alive Bee Gees",
  "You Should Be Dancing Bee Gees",
  "Gonna Make You Sweat",
  "Push It Salt N Pepa",
  "Whip It Devo",
  "Tainted Love Soft Cell",
  "Blue Monday New Order",
  "Personal Jesus Depeche Mode",
  "Enjoy the Silence Depeche Mode",
  "Just Like Heaven The Cure",
  "Friday Im in Love The Cure",

  // === FLORENCE + THE MACHINE ===
  "Dog Days Are Over Florence",
  "Shake It Out Florence",
  "You Got the Love Florence",
  "Spectrum Florence",
  "What Kind of Man Florence",
  "Ship to Wreck Florence",
  "Hunger Florence Machine",
  "Free Florence Machine",

  // === MORE MODERN HITS 2023-2026 ===
  "Houdini Dua Lipa",
  "Training Season Dua Lipa",
  "Illusion Dua Lipa",
  "Unholy Sam Smith",
  "Padam Padam Kylie Minogue",
  "Rush Troye Sivan",
  "Got Me Started Troye Sivan",
  "Dance the Night Dua Lipa",
  "Speed Drive Charli XCX",
  "360 Charli XCX",
  "Von Dutch Charli XCX",
  "Apple Charli XCX",
  "Brat Charli XCX",
  "Beautiful Things Benson Boone",
  "Too Sweet Hozier",
  "Unwritten Natasha Bedingfield",
  "Pocketful of Sunshine Natasha Bedingfield",
  "On My Way Alan Walker",
  "Play Date Melanie Martinez",
  "Fortnight Taylor Swift",
  "Karma Taylor Swift",
  "Lavender Haze Taylor Swift",
  "Midnight Rain Taylor Swift",
  "Bejeweled Taylor Swift",
  "Style Taylor Swift",
  "Blank Space Taylor Swift",
  "22 Taylor Swift",
  "We Are Never Getting Back Together Taylor Swift",
  "I Knew You Were Trouble Taylor Swift",
  "Love Story Taylor Swift",
  "You Belong With Me Taylor Swift",
  "All Too Well Taylor Swift",
  "Delicate Taylor Swift",
  "Look What You Made Me Do Taylor Swift",

  // === LATIN / INTERNATIONAL ===
  "Despacito Luis Fonsi",
  "Bailando Enrique Iglesias",
  "Vivir Mi Vida Marc Anthony",
  "Danza Kuduro Don Omar",
  "Gasolina Daddy Yankee",
  "Con Calma Daddy Yankee",
  "Mi Gente J Balvin",
  "I Like It Cardi B",
  "Suavemente Elvis Crespo",
  "La Bamba Ritchie Valens",
  "Waka Waka Shakira",
  "Hips Dont Lie Shakira",
  "Whenever Wherever Shakira",
  "She Wolf Shakira",
  "Bamboo Shakira",
  "Loca Shakira",
  "Chantaje Shakira",
  "Pepas Farruko",
  "Taki Taki DJ Snake",
  "Reggaeton Lento CNCO",
];

const searchTracks = async (token, query, limit = 10) => {
  const data = await spotifyGet(
    token,
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`
  );

  if (!data) return [];
  if (data.__rateLimited) return "__RATE_LIMITED__";

  return (data.tracks?.items ?? []).map((track) => ({
    spotify_id: track.id,
    title: track.name,
    artist: track.artists?.map((a) => a.name).join(", ") ?? "",
    album: track.album?.name ?? "",
    popularity: track.popularity ?? 0,
    source: `search:${query}`
  }));
};

// Fetch audio features (BPM/tempo) in batches of 100
const fetchAudioFeatures = async (token, trackIds) => {
  const features = new Map();
  const batches = [];

  for (let i = 0; i < trackIds.length; i += 100) {
    batches.push(trackIds.slice(i, i + 100));
  }

  for (const batch of batches) {
    const data = await spotifyGet(
      token,
      `https://api.spotify.com/v1/audio-features?ids=${batch.join(",")}`
    );

    if (data) {
      for (const f of data.audio_features ?? []) {
        if (f && f.id) {
          features.set(f.id, {
            bpm: Math.round(f.tempo),
            danceability: f.danceability,
            energy: f.energy,
            valence: f.valence
          });
        }
      }
    }

    await sleep(200);
  }

  return features;
};

const classifyWorkout = (bpm, energy) => {
  const workouts = [];
  if (!bpm) return ["easy_run"];

  if (bpm >= 170) workouts.push("speed_work");
  if (bpm >= 150 && bpm < 180) workouts.push("tempo_run");
  if (bpm >= 120 && bpm < 160) workouts.push("easy_run");
  if (bpm >= 155 && energy > 0.8) workouts.push("finish_kick");
  if (bpm >= 130 && bpm < 170) workouts.push("long_run");
  if (bpm < 120) workouts.push("warm_up");

  return workouts.length ? workouts : ["easy_run"];
};

const classifyEnergy = (bpm, spotifyEnergy) => {
  if (spotifyEnergy > 0.85 && bpm >= 160) return "extreme";
  if (spotifyEnergy > 0.7 || bpm >= 150) return "high";
  if (spotifyEnergy > 0.45 || bpm >= 120) return "medium";
  return "low";
};

const slugify = (value) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

const run = async () => {
  console.log("Authenticating with Spotify...");
  const token = await getToken();

  // Load existing discovered songs to merge with
  let existingTracks = [];
  try {
    const existing = await fs.readFile(OUTPUT_PATH, "utf8");
    existingTracks = JSON.parse(existing);
    console.log(`Loaded ${existingTracks.length} existing tracks from previous run.`);
  } catch {
    // No existing file, start fresh
  }

  console.log(`Searching for tracks across ${SEARCH_QUERIES.length} queries...`);
  const allTracks = [];
  let rateLimited = false;

  for (const query of SEARCH_QUERIES) {
    const tracks = await searchTracks(token, query);
    if (tracks === "__RATE_LIMITED__") {
      console.log("Rate limited — saving what we have so far.");
      rateLimited = true;
      break;
    }
    allTracks.push(...tracks);
    console.log(`  "${query}": ${tracks.length} tracks`);
    await sleep(200);
  }

  // Merge with existing tracks from previous runs
  const mergedTracks = [...allTracks];
  for (const existing of existingTracks) {
    if (existing.spotify_id) {
      mergedTracks.push({
        spotify_id: existing.spotify_id,
        title: existing.title,
        artist: existing.artist,
        album: existing.album ?? "",
        popularity: existing.popularity ?? 0,
        source: existing.source ?? "spotify"
      });
    }
  }

  // Deduplicate by spotify_id, keeping highest popularity
  const seen = new Map();
  for (const track of mergedTracks) {
    const existing = seen.get(track.spotify_id);
    if (!existing || track.popularity > existing.popularity) {
      seen.set(track.spotify_id, track);
    }
  }

  const unique = [...seen.values()];
  console.log(`${unique.length} unique tracks after dedup.`);

  // Try to fetch BPM data (may fail on dev-mode apps since Nov 2024)
  console.log("Fetching audio features (BPM)...");
  const trackIds = unique.map((t) => t.spotify_id);
  const features = await fetchAudioFeatures(token, trackIds);
  console.log(`Got audio features for ${features.size} tracks.`);

  // Merge and classify
  const songs = unique
    .map((track) => {
      const f = features.get(track.spotify_id);
      const bpm = f?.bpm ?? null;
      const spotifyEnergy = f?.energy ?? 0.5;

      return {
        item_key: slugify(`${track.artist} ${track.title}`),
        spotify_id: track.spotify_id,
        title: track.title,
        artist: track.artist,
        bpm,
        genre: [],
        energy: bpm ? classifyEnergy(bpm, spotifyEnergy) : "medium",
        workout: bpm ? classifyWorkout(bpm, spotifyEnergy) : ["easy_run"],
        popularity: track.popularity,
        source: "spotify",
        upvotes: 0,
        downvotes: 0
      };
    })
    .filter((s) => s.title && s.artist); // Keep all tracks even without BPM

  // Sort by popularity
  songs.sort((a, b) => b.popularity - a.popularity);

  // Take top 2000
  const top = songs.slice(0, 2000);

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(top, null, 2));
  console.log(`Saved ${top.length} running songs to ${OUTPUT_PATH}.`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
