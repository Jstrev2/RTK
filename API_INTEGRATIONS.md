# API Integrations Guide

## Overview

This document provides detailed implementation guidance for all third-party API integrations needed for the Running Companion App.

---

## Integration Priority

### MVP (Phase 1):
1. ✅ **Spotify API** - Music metadata and BPM
2. ✅ **Strava API** - Workout import (read-only)

### Post-MVP (Phase 2):
3. 🔄 **Apple Health / HealthKit** - Automatic workout sync
4. 🔄 **Garmin Connect API** - Workout data import
5. 🔄 **YouTube API** - Music video embeds (optional)

---

## 1. Spotify Web API

### Purpose
- Search for songs
- Get track audio features (BPM, energy, tempo)
- Retrieve 30-second preview clips
- Get album artwork
- (Future) Create and export playlists

### Official Documentation
https://developer.spotify.com/documentation/web-api

### Setup Requirements

1. **Create Spotify Developer Account**
   - Go to https://developer.spotify.com/dashboard
   - Create a new app
   - Note your Client ID and Client Secret

2. **Configure Redirect URIs**
   - Add `http://localhost:3000/api/auth/spotify/callback` (development)
   - Add `https://yourapp.com/api/auth/spotify/callback` (production)

3. **API Access Types**
   - **Client Credentials Flow**: For server-side, non-user-specific requests (song search, track features)
   - **Authorization Code Flow**: For user-specific actions (creating playlists)

### Implementation

#### Client Credentials Flow (For MVP)

```typescript
// lib/spotify.ts

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export async function getSpotifyAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });
  
  const data: SpotifyTokenResponse = await response.json();
  return data.access_token;
}

// Search for a track
export async function searchTrack(query: string) {
  const token = await getSpotifyAccessToken();
  
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  
  return await response.json();
}

// Get audio features (BPM, energy, etc.)
export async function getAudioFeatures(trackId: string) {
  const token = await getSpotifyAccessToken();
  
  const response = await fetch(
    `https://api.spotify.com/v1/audio-features/${trackId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  
  return await response.json();
}
```

#### API Routes (Next.js)

```typescript
// app/api/music/search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { searchTrack } from '@/lib/spotify';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  
  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 });
  }
  
  try {
    const results = await searchTrack(query);
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
```

### Key Endpoints for MVP

#### 1. Search Tracks
```
GET https://api.spotify.com/v1/search
Parameters:
  - q: search query (e.g., "Eye of the Tiger")
  - type: "track"
  - limit: 10

Response includes:
  - Track name
  - Artist name
  - Album name
  - Album artwork URL
  - Track ID (for further queries)
  - Preview URL (30-second clip)
```

#### 2. Get Audio Features
```
GET https://api.spotify.com/v1/audio-features/{id}

Response includes:
  - tempo: BPM (e.g., 109.977)
  - energy: 0.0 to 1.0
  - danceability: 0.0 to 1.0
  - valence: 0.0 to 1.0 (positivity)
  - acousticness, instrumentalness, liveness, speechiness
  - duration_ms
  - time_signature
  - key, mode
```

### Rate Limits
- Client Credentials: Generally very high, no specific public limit
- Authorization Code: Rate limited per user
- Best practice: Cache results, don't make same request repeatedly

### Caching Strategy
```typescript
// Cache token until expiry
let cachedToken: { token: string; expiry: number } | null = null;

export async function getSpotifyAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiry) {
    return cachedToken.token;
  }
  
  // Fetch new token...
  const data = await fetchToken();
  
  cachedToken = {
    token: data.access_token,
    expiry: Date.now() + (data.expires_in * 1000) - 60000, // 1 min buffer
  };
  
  return cachedToken.token;
}
```

### User Flow for Song Submission

1. User enters song name and artist
2. Frontend calls `/api/music/search?q=Song+Artist`
3. Display search results with album art
4. User selects correct track
5. Automatically fetch audio features (BPM)
6. Pre-fill submission form with metadata
7. User adds tags and submits

---

## 2. Strava API

### Purpose
- Import workout activities (runs, bikes)
- Read activity details (distance, time, pace, route)
- Get user profile data
- (Future) Write workouts back to Strava

### Official Documentation
https://developers.strava.com/docs/

### Setup Requirements

1. **Create Strava API Application**
   - Go to https://www.strava.com/settings/api
   - Create an app
   - Note your Client ID and Client Secret

2. **Configure Authorization**
   - Authorization Callback Domain: `yourapp.com`
   - Read and Write scopes available
   - For MVP: Use `activity:read_all` scope

3. **OAuth 2.0 Flow**
   - Authorization Code flow required
   - Each user must authorize your app
   - Access tokens expire (refresh tokens needed)

### Implementation

#### OAuth Flow

```typescript
// app/api/auth/strava/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/strava/callback`;
  
  const authUrl = new URL('https://www.strava.com/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId!);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'activity:read_all');
  
  return NextResponse.redirect(authUrl.toString());
}
```

#### OAuth Callback Handler

```typescript
// app/api/auth/strava/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.redirect('/error?message=Authorization failed');
  }
  
  // Exchange code for access token
  const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  });
  
  const tokens = await tokenResponse.json();
  
  // Store tokens in database
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.redirect('/login');
  }
  
  await supabase.from('strava_connections').upsert({
    user_id: user.id,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + (tokens.expires_in * 1000),
    athlete_id: tokens.athlete.id,
  });
  
  return NextResponse.redirect('/dashboard?connected=strava');
}
```

#### Token Refresh

```typescript
// lib/strava.ts

export async function getValidStravaToken(userId: string): Promise<string> {
  const supabase = createClient();
  
  const { data: connection } = await supabase
    .from('strava_connections')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (!connection) {
    throw new Error('Strava not connected');
  }
  
  // Check if token is expired
  if (Date.now() >= connection.expires_at) {
    // Refresh token
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: connection.refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    
    const tokens = await response.json();
    
    // Update stored tokens
    await supabase
      .from('strava_connections')
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: Date.now() + (tokens.expires_in * 1000),
      })
      .eq('user_id', userId);
    
    return tokens.access_token;
  }
  
  return connection.access_token;
}
```

#### Fetch Activities

```typescript
export async function getStravaActivities(
  userId: string,
  page: number = 1,
  perPage: number = 30
) {
  const token = await getValidStravaToken(userId);
  
  const response = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?page=${page}&per_page=${perPage}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  
  return await response.json();
}

export async function getStravaActivity(userId: string, activityId: number) {
  const token = await getValidStravaToken(userId);
  
  const response = await fetch(
    `https://www.strava.com/api/v3/activities/${activityId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  
  return await response.json();
}
```

### Key Endpoints

#### 1. List Athlete Activities
```
GET https://www.strava.com/api/v3/athlete/activities

Response includes:
  - id: activity ID
  - name: activity name
  - type: "Run", "Ride", etc.
  - distance: meters
  - moving_time: seconds
  - elapsed_time: seconds
  - average_speed: m/s
  - average_heartrate: bpm (if available)
  - start_date: ISO timestamp
  - map: polyline of route
```

#### 2. Get Activity Details
```
GET https://www.strava.com/api/v3/activities/{id}

Additional details:
  - splits_metric: array of km splits
  - best_efforts: array of PR segments
  - calories: estimated
  - device_name: Garmin, Apple Watch, etc.
  - gear_id: associated shoe/bike
```

### Rate Limits

**Very Important:** Strava has strict rate limits

- **15-minute limit**: 100 requests per 15 minutes
- **Daily limit**: 1,000 requests per day
- These apply **per application** (not per user)

**Mitigation Strategies:**
1. Cache activities locally (sync periodically, not on-demand)
2. Implement webhook subscriptions (Strava pushes updates to you)
3. Batch imports (import multiple activities at once)
4. Respect 429 rate limit responses

### Webhook Subscriptions (Recommended)

Instead of polling for new activities, have Strava notify you:

```typescript
// app/api/strava/webhook/route.ts

export async function GET(request: NextRequest) {
  // Webhook verification challenge
  const params = request.nextUrl.searchParams;
  const mode = params.get('hub.mode');
  const token = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');
  
  if (mode === 'subscribe' && token === process.env.STRAVA_VERIFY_TOKEN) {
    return NextResponse.json({ 'hub.challenge': challenge });
  }
  
  return NextResponse.json({ error: 'Invalid verification' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const event = await request.json();
  
  // Handle new activity
  if (event.object_type === 'activity' && event.aspect_type === 'create') {
    // Fetch full activity details
    // Store in database
    // Notify user
  }
  
  return NextResponse.json({ success: true });
}
```

### Database Schema for Strava

```sql
CREATE TABLE strava_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  athlete_id BIGINT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE imported_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  strava_id BIGINT NOT NULL,
  name TEXT,
  type TEXT,
  distance FLOAT, -- meters
  moving_time INT, -- seconds
  elapsed_time INT,
  start_date TIMESTAMP WITH TIME ZONE,
  average_speed FLOAT, -- m/s
  average_heartrate FLOAT,
  raw_data JSONB, -- store full Strava response
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, strava_id)
);
```

---

## 3. Apple Health / HealthKit (Future)

### Challenge
HealthKit is iOS-only and requires native app access. Web apps cannot directly access HealthKit.

### Options

#### Option 1: Build iOS Companion App
- React Native or Swift
- Use HealthKit framework
- Sync data to backend
- **Effort:** High (3-6 weeks for basic app)

#### Option 2: Third-Party API Service (Easier)

**Terra API** (https://tryterra.co/)
- Aggregates data from Apple Health, Garmin, Fitbit, etc.
- REST API
- Pricing: $49/month + $0.01 per user/month
- Handles OAuth, data parsing, webhook delivery

```typescript
// Example with Terra
export async function syncHealthData(userId: string) {
  const response = await fetch(
    `https://api.tryterra.co/v2/daily/${userId}`,
    {
      headers: {
        'X-API-Key': process.env.TERRA_API_KEY,
      },
    }
  );
  
  const data = await response.json();
  // data.data contains workouts, heart rate, sleep, etc.
}
```

**Vital API** (https://www.tryvital.io/)
- Similar to Terra
- Pricing: $99/month + usage
- Good documentation

#### Option 3: Manual Export (MVP Approach)
- User exports Health data from iPhone
- Upload XML file to app
- Parse and import workouts

**Implementation:**
```typescript
import { parseStringPromise } from 'xml2js';

export async function parseHealthKitExport(xmlContent: string) {
  const parsed = await parseStringPromise(xmlContent);
  const workouts = parsed.HealthData.Record.filter(
    (record: any) => record.$.type === 'HKWorkoutTypeIdentifier'
  );
  
  return workouts.map((workout: any) => ({
    type: workout.$.workoutActivityType,
    start: workout.$.startDate,
    end: workout.$.endDate,
    duration: workout.$.duration,
    distance: workout.$.totalDistance,
    // ... more fields
  }));
}
```

**Recommendation for MVP:** Skip HealthKit integration initially. Focus on Strava (which many iPhone users also use) and manual logging. Consider Terra API for Phase 2 if budget allows.

---

## 4. Garmin Connect API (Future)

### Official Documentation
https://developer.garmin.com/

### Challenge
Garmin API access is notoriously difficult for indie developers:
- Application approval required
- Business justification needed
- Can take weeks/months for approval
- Limited documentation

### Alternative Approaches

#### Option 1: Official API (If Approved)
- OAuth 2.0 flow
- REST API similar to Strava
- Access to activities, heart rate, sleep, etc.

#### Option 2: Terra API
- Same service mentioned for Apple Health
- Supports Garmin Connect
- No approval process needed
- Easier integration

#### Option 3: File Import
- User downloads FIT files from Garmin Connect
- Upload to app
- Parse FIT file format

```typescript
import FitParser from 'fit-file-parser';

export async function parseFitFile(buffer: ArrayBuffer) {
  const fitParser = new FitParser();
  
  return new Promise((resolve, reject) => {
    fitParser.parse(buffer, (error: any, data: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}
```

**Recommendation:** For MVP, allow Garmin users to import via Strava (most sync Garmin → Strava) or manual logging. Consider Terra API for Phase 2.

---

## 5. YouTube API (Optional)

### Purpose
- Embed music videos
- Show "official" versions of songs

### Setup
1. Get API key from Google Cloud Console
2. Enable YouTube Data API v3
3. Free quota: 10,000 units per day (100 searches)

### Implementation

```typescript
export async function searchYouTube(query: string) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?` +
    `part=snippet&type=video&videoCategoryId=10&` + // Music category
    `q=${encodeURIComponent(query)}&` +
    `key=${process.env.YOUTUBE_API_KEY}&` +
    `maxResults=1`
  );
  
  const data = await response.json();
  const video = data.items[0];
  
  return {
    videoId: video.id.videoId,
    title: video.snippet.title,
    thumbnail: video.snippet.thumbnails.default.url,
  };
}
```

### Embedding

```tsx
// components/YouTubeEmbed.tsx
export function YouTubeEmbed({ videoId }: { videoId: string }) {
  return (
    <iframe
      width="560"
      height="315"
      src={`https://www.youtube.com/embed/${videoId}`}
      title="YouTube video player"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}
```

---

## Integration Testing Checklist

### Spotify
- [ ] Can search for tracks
- [ ] BPM is returned accurately
- [ ] Preview URLs work
- [ ] Album art loads
- [ ] Token refresh works
- [ ] Rate limiting handled

### Strava
- [ ] OAuth flow completes
- [ ] Activities are imported
- [ ] Token refresh works
- [ ] Webhook receives events
- [ ] Rate limits respected
- [ ] Disconnect functionality works

### Future Integrations
- [ ] HealthKit data imports
- [ ] Garmin activities sync
- [ ] YouTube embeds work

---

## Error Handling Best Practices

```typescript
export async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  retries: number = 3
): Promise<T> {
  try {
    return await fetchFn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(fetchFn, retries - 1);
    }
    throw error;
  }
}

// Usage
const activities = await fetchWithRetry(() => 
  getStravaActivities(userId)
);
```

---

## Cost Summary

| Service | MVP Cost | At Scale (1000 users) |
|---------|----------|------------------------|
| Spotify API | Free | Free |
| Strava API | Free | Free |
| YouTube API | Free | Free (within quota) |
| Terra API (optional) | N/A | $49/mo + $10/mo (users) |
| **Total** | **$0** | **$59/mo** (if using Terra) |

---

## Security Considerations

1. **API Keys**: Store in environment variables, never commit
2. **OAuth Tokens**: Encrypt at rest in database
3. **Token Expiry**: Always check and refresh
4. **Rate Limiting**: Implement app-level rate limiting
5. **User Privacy**: Allow disconnection and data deletion
6. **Webhook Security**: Verify webhook signatures

---

## Development Priorities

### MVP Launch:
1. ✅ Spotify API (song search and BPM)
2. ✅ Strava API (activity import)

### Post-MVP (Based on User Demand):
3. Health tracking integration (Terra API or manual)
4. Garmin integration (via Terra or file import)
5. Spotify playlist export
6. YouTube embeds for songs
