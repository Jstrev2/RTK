/*
 * "Save to Spotify" from the browser: Spotify's Authorization Code flow with
 * PKCE (no server secret involved). The playlist waits in sessionStorage
 * while the runner signs in to Spotify, then /tools/music/spotify finishes.
 *
 * Spotify keeps apps in development mode limited to allow-listed accounts. A
 * 403 from any step means this account isn't on the list yet; the finder then
 * offers the copy-and-open fallback.
 */

export type PendingPlaylist = {
  name: string;
  description: string;
  /** Spotify id when we know it; otherwise the song is looked up on Spotify after sign-in. */
  tracks: { id: string | null; title: string; artist: string }[];
};

type Pending = { verifier: string; state: string; clientId: string; redirectUri: string; playlist: PendingPlaylist };

const KEY = "rtk-spotify-save";
const SCOPES = "playlist-modify-private playlist-modify-public";

/** The two redirect addresses registered with Spotify. */
export const spotifyRedirectUri = () =>
  typeof window !== "undefined" && window.location.origin === "http://127.0.0.1:3202"
    ? "http://127.0.0.1:3202/tools/music/spotify"
    : "https://runnertoolkit.com/tools/music/spotify";

const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const randomString = (length: number) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => chars[v % chars.length]).join("");
};

export async function startSpotifySave(clientId: string, playlist: PendingPlaylist) {
  const verifier = randomString(64);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = base64url(new Uint8Array(digest));
  const state = randomString(16);
  const redirectUri = spotifyRedirectUri();
  const pending: Pending = { verifier, state, clientId, redirectUri, playlist };
  sessionStorage.setItem(KEY, JSON.stringify(pending));
  // Also keep it across tabs for the browsers that open the callback in a new one.
  try {
    localStorage.setItem(KEY, JSON.stringify(pending));
  } catch {
    /* private mode */
  }
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: SCOPES,
    code_challenge_method: "S256",
    code_challenge: challenge,
    state
  });
  window.location.assign(`https://accounts.spotify.com/authorize?${params}`);
}

export class SpotifyRefused extends Error {}

const api = async (token: string, path: string, init: RequestInit = {}) => {
  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) }
  });
  if (response.status === 403) throw new SpotifyRefused("Spotify refused this account");
  return response;
};

export type SaveResult = { url: string; name: string; added: number };

/** Finish the save on the callback page. */
export async function finishSpotifySave(search: URLSearchParams): Promise<SaveResult> {
  const raw = sessionStorage.getItem(KEY) ?? localStorage.getItem(KEY);
  if (!raw) throw new Error("This sign-in has expired. Go back and press Save to Spotify again.");
  const pending = JSON.parse(raw) as Pending;
  const clear = () => {
    sessionStorage.removeItem(KEY);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  };

  const error = search.get("error");
  if (error) {
    clear();
    if (error === "access_denied") throw new Error("Spotify sign-in was cancelled.");
    throw new SpotifyRefused(error);
  }
  if (search.get("state") !== pending.state) throw new Error("This sign-in doesn't match the playlist. Go back and try again.");

  const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: search.get("code") ?? "",
      redirect_uri: pending.redirectUri,
      client_id: pending.clientId,
      code_verifier: pending.verifier
    })
  });
  const token = (await tokenResponse.json().catch(() => null)) as { access_token?: string; error?: string } | null;
  if (!token?.access_token) {
    clear();
    if (tokenResponse.status === 403 || tokenResponse.status === 400) throw new SpotifyRefused(token?.error ?? "token refused");
    throw new Error("Spotify didn't finish the sign-in. Try again.");
  }
  const access = token.access_token;

  const me = await api(access, "/me");
  if (!me.ok) throw new SpotifyRefused("profile refused");
  const profile = (await me.json()) as { id: string };

  const body = JSON.stringify({ name: pending.playlist.name, description: pending.playlist.description, public: false });
  let created = await api(access, "/me/playlists", { method: "POST", body });
  if (created.status === 404 || created.status === 405) {
    created = await api(access, `/users/${encodeURIComponent(profile.id)}/playlists`, { method: "POST", body });
  }
  if (!created.ok) throw new Error(`Spotify couldn't create the playlist (${created.status}).`);
  const playlist = (await created.json()) as { id: string; external_urls?: { spotify?: string } };

  // Songs we have no Spotify id for yet: search Spotify as the runner.
  const all: string[] = [];
  for (const track of pending.playlist.tracks) {
    if (track.id) {
      all.push(`spotify:track:${track.id}`);
      continue;
    }
    const q = encodeURIComponent(`track:${track.title.replace(/\s*[([].*?[)\]]/g, "")} artist:${track.artist}`);
    const found = await api(access, `/search?type=track&limit=1&q=${q}`);
    if (!found.ok) continue;
    const item = ((await found.json()) as { tracks?: { items?: { uri: string }[] } }).tracks?.items?.[0];
    if (item) all.push(item.uri);
  }

  let added = 0;
  for (let i = 0; i < all.length; i += 100) {
    const uris = all.slice(i, i + 100);
    let response = await api(access, `/playlists/${playlist.id}/items`, { method: "POST", body: JSON.stringify({ uris }) });
    if (response.status === 404 || response.status === 405) {
      response = await api(access, `/playlists/${playlist.id}/tracks`, { method: "POST", body: JSON.stringify({ uris }) });
    }
    if (!response.ok) throw new Error(`Spotify made the playlist but wouldn't add the songs (${response.status}).`);
    added += uris.length;
  }
  clear();
  return {
    url: playlist.external_urls?.spotify ?? `https://open.spotify.com/playlist/${playlist.id}`,
    name: pending.playlist.name,
    added
  };
}
