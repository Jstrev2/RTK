import "./common.mjs";
import { spawn } from "child_process";
import path from "path";

const runStep = (label, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { stdio: "inherit" });
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`${label} failed with code ${code}`));
      } else {
        resolve();
      }
    });
  });

const run = async () => {
  await runStep("fetch-spotify-playlists", [
    path.resolve("scripts", "fetch-spotify-playlists.mjs")
  ]);
  await runStep("import-songs", [
    path.resolve("scripts", "import-music-songs.mjs")
  ]);
  console.log("Music pipeline completed.");
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
