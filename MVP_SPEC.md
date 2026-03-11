# MVP Feature Specifications

## Overview

This document provides detailed specifications for the 5 core tools that will comprise the MVP of the Running Companion App.

---

## Tool 1: Shoe Selector

### Purpose
Help runners find the perfect running shoe based on their individual needs, preferences, and running style.

### User Flow
1. User lands on shoe selector page
2. Completes interactive questionnaire
3. Receives personalized shoe recommendations
4. Can filter and sort results
5. View detailed shoe information
6. Links to purchase (affiliate opportunity for future monetization)

### Input Parameters

#### Required Inputs:
- **Usage Type** (select one or multiple)
  - Daily trainer
  - Long run
  - Speed work / tempo
  - Race day
  - Trail running
  - Recovery runs

- **Foot Strike** (select one)
  - Heel strike
  - Midfoot strike
  - Forefoot strike
  - Not sure (show explanation)

- **Cadence** (select one)
  - Low (<160 steps/min)
  - Average (160-180 steps/min)
  - High (>180 steps/min)
  - Not sure (link to explanation/how to measure)

- **Toe Box Width** (select one)
  - Narrow
  - Standard
  - Wide
  - Extra wide

- **Cushion Preference** (select one)
  - Minimal (firm, ground feel)
  - Moderate (balanced)
  - Maximum (plush, soft)

- **Support/Stability** (select one)
  - Neutral (no pronation issues)
  - Mild stability (slight overpronation)
  - Moderate stability (noticeable overpronation)
  - Motion control (severe overpronation)

- **Primary Surface** (select one or multiple)
  - Road
  - Track
  - Trail (groomed)
  - Trail (technical)
  - Treadmill
  - Mixed

#### Optional Input:
- **Weight** (lbs or kg)
  - Affects cushion recommendations
  - Can skip if uncomfortable sharing

### Shoe Database Structure

Each shoe should have:
```
{
  "name": "Nike Pegasus 41",
  "brand": "Nike",
  "image_url": "...",
  "price": 139,
  "usage_types": ["daily_trainer", "long_run"],
  "best_for_foot_strike": ["heel", "midfoot"],
  "best_for_cadence": ["average", "high"],
  "toe_box": "standard",
  "cushion_level": "moderate",
  "stability": "neutral",
  "surfaces": ["road", "track", "treadmill"],
  "weight_range": "all", // or "lightweight", "heavyweight"
  "stack_height": 36,
  "drop": 10,
  "weight_mens": 10.0, // oz
  "weight_womens": 8.0,
  "description": "Versatile daily trainer...",
  "pros": ["Versatile", "Durable", "Responsive"],
  "cons": ["Not exciting", "Can feel firm initially"],
  "affiliate_link": "" // for future
}
```

### Initial Shoe List (Minimum 20-30 Popular Shoes)

**Daily Trainers:**
- Nike Pegasus 41
- Brooks Ghost 16
- ASICS Gel-Nimbus 26
- Hoka Clifton 9
- New Balance 1080 v14
- Saucony Ride 17

**Speed/Tempo:**
- Nike Vaporfly 3
- Adidas Adizero Adios Pro 3
- Saucony Endorphin Speed 4
- New Balance FuelCell SuperComp Elite v4
- Hoka Rocket X 2

**Stability:**
- Brooks Adrenaline GTS 24
- ASICS GT-2000 12
- Saucony Guide 17
- New Balance 860 v14

**Trail:**
- Salomon Speedcross 6
- Hoka Speedgoat 6
- Nike Wildhorse 8
- Altra Lone Peak 8

### Recommendation Algorithm Logic

**Scoring system (0-100 points per shoe):**
- Usage type match: 25 points
- Foot strike compatibility: 20 points
- Cushion preference: 15 points
- Stability needs: 20 points
- Surface match: 15 points
- Cadence compatibility: 5 points
- (Weight consideration if provided)

**Display:**
- Show top 5-10 matches
- Sort by match score (default) or price or popularity
- Filter by brand, price range
- Show match percentage and why it's recommended

### UI Requirements
- Clean, visual interface with shoe images
- Filter sidebar (brand, price, features)
- Card-based layout for results
- Detailed view modal for each shoe
- Mobile-friendly responsive design
- Save favorites (if logged in)

---

## Tool 2: Attire Guide

### Purpose
Provide fun, persona-based clothing recommendations that match the runner's style and priorities.

### User Flow
1. User selects their "runner persona"
2. System displays curated outfit recommendations
3. User can browse by category (tops, bottoms, accessories)
4. View product details and purchase links

### Runner Personas

#### 1. Party Animal 🎉
**Description:** "You run for the vibes. Life's too short for boring clothes!"

**Style Characteristics:**
- Bold patterns and colors
- Graphic tees with funny running quotes
- Bright, eye-catching gear
- Fun accessories (neon shoelaces, themed headbands)
- Tutus for race day
- Costume runs are your favorite

**Example Brands/Items:**
- Oiselle
- Tracksmith (colorful pieces)
- Lululemon (fun patterns)
- Rabbit (bold prints)
- Gone For a Run (novelty items)

**Priority:** Fun > Fashion > Function > Speed

#### 2. Speed Demon 🏃‍♂️💨
**Description:** "Every second counts. Your kit is engineered for PRs."

**Style Characteristics:**
- Aerodynamic racing singlets
- Split shorts (minimal fabric)
- Performance compression
- Lightweight everything
- Technical fabrics only
- Matching race kits

**Example Brands/Items:**
- Nike Aeroswift
- Adidas Adizero
- On Cloud (racing line)
- Tracksmith (racing gear)
- Saysky (performance)
- Pro compression socks

**Priority:** Speed > Function > Fashion > Fun

#### 3. Creative Cruiser 🎨✨
**Description:** "You're here for the 'gram and the endorphins. Influencer vibes."

**Style Characteristics:**
- Trendy athleisure aesthetic
- Coordinated color schemes
- Fashion-forward activewear
- Latest drops from trendy brands
- Instagram-worthy everything
- Matching sets

**Example Brands/Items:**
- Outdoor Voices
- Alo Yoga
- Vuori
- Lululemon (fashion pieces)
- Girlfriend Collective
- Ciele Athletics (hats)

**Priority:** Fashion > Fun > Function > Speed

#### 4. Minimalist Pro 🎯
**Description:** "Function over everything. No frills, just miles."

**Style Characteristics:**
- Classic, timeless pieces
- Neutral colors (black, gray, navy)
- Quality basics that last
- No logos or minimal branding
- Versatile items
- Technical but understated

**Example Brands/Items:**
- Patagonia
- Janji
- Satisfy Running
- Tracksmith (classics)
- Ciele GOCap
- ASICS MetaRun line

**Priority:** Function > Speed > Fashion > Fun

#### 5. All-Weather Warrior ⛈️☀️
**Description:** "Rain, snow, or shine - you're out there. Prepared for anything."

**Style Characteristics:**
- Layering system master
- Weather-resistant gear
- Reflective elements
- Versatile pieces
- Practical accessories
- Temperature-rated items

**Example Brands/Items:**
- Brooks Nightlife collection
- Salomon (trail gear)
- Arc'teryx
- Smartwool base layers
- Craft Sportswear
- Nathan (visibility gear)

**Priority:** Function > Weather-Ready > Durability

### Clothing Database Structure

```
{
  "item_name": "Tracksmith Van Cortlandt Singlet",
  "brand": "Tracksmith",
  "category": "tops", // tops, bottoms, accessories, shoes, outerwear
  "gender": "unisex", // mens, womens, unisex
  "image_url": "...",
  "price": 68,
  "personas": ["speed_demon", "minimalist_pro"],
  "weather": ["warm", "hot"],
  "features": ["moisture-wicking", "lightweight", "reflective"],
  "colors_available": ["navy", "white", "red"],
  "description": "Race-day singlet...",
  "affiliate_link": ""
}
```

### UI Requirements
- Persona selection as first step (large, visual cards)
- Browse by category tabs
- Filter by weather conditions, price, gender
- Visual grid layout with hover effects
- Outfit builder (mix and match items)
- Save favorite looks (if logged in)

---

## Tool 3: Music Tools

### Purpose
Discover and share the best running music through community voting and curation.

### Features

#### 3.1 Song Database & Voting

**Song Entry Structure:**
```
{
  "song_title": "Eye of the Tiger",
  "artist": "Survivor",
  "spotify_id": "...", // if available
  "apple_music_id": "...", // if available
  "youtube_url": "...",
  "bpm": 109,
  "genre": ["rock", "80s", "motivational"],
  "energy_level": "high", // low, medium, high, extreme
  "best_for": ["tempo_run", "finish_line_sprint"],
  "submitted_by": "user_id",
  "submitted_date": "2025-01-15",
  "upvotes": 245,
  "downvotes": 12,
  "total_score": 233
}
```

#### 3.2 User Interactions

**Submit a Song:**
- Form with song title, artist
- Optional: Spotify/Apple Music link
- BPM (auto-detect if possible from streaming link)
- Genre tags (select multiple)
- Best for (select workout type)

**Vote on Songs:**
- Upvote/downvote system (Reddit-style)
- One vote per user per song
- Can change vote
- Shows net score

**Browse & Filter:**
- Sort by: Popular (all-time), Trending (this week), New, BPM
- Filter by: Genre, BPM range, Energy level, Workout type
- Search by song title or artist

#### 3.3 Curated Playlists

**Auto-Generated Playlists:**
- Top 50 Running Songs (all-time)
- Trending This Week
- Best for Easy Runs (BPM 140-160)
- Best for Tempo Runs (BPM 160-180)
- Best for Speed Work (BPM 180+)
- Genre-specific (Rock, Pop, Hip-Hop, Electronic, Country, etc.)

**Playlist Structure:**
```
{
  "playlist_name": "Top 50 Running Songs",
  "description": "Community favorites...",
  "song_ids": [...], // ordered array
  "auto_generated": true,
  "last_updated": "2025-01-15",
  "total_runtime": 235 // minutes
}
```

#### 3.4 Integration (Future Enhancement)
- Export to Spotify playlist
- Export to Apple Music playlist
- One-click "Start playlist on Spotify"

### UI Requirements
- Card-based song layout with album art (if available)
- Big voting buttons (upvote/downvote)
- Play preview button (30 seconds via embedded player)
- Filter sidebar with multiple options
- Leaderboard view (top songs)
- User can see their submissions and votes
- Mobile-optimized for on-the-go browsing

---

## Tool 4: Fueling Calculator & Logger

### Purpose
Help runners determine optimal fueling strategy for race day and track what works for them personally.

### 4.1 Baseline Fueling Calculator

#### User Inputs

**Required:**
- **Distance** (select one)
  - Half Marathon (13.1 miles)
  - Marathon (26.2 miles)
  
- **Goal Finish Time** (HH:MM:SS)
  - Validates reasonable range
  - Calculates average pace

- **Body Weight** (lbs or kg)
  - Used for personalized calorie calculations

**Optional:**
- **Height** (ft/in or cm)
  - For more accurate metabolic calculations
  
- **Running Pace** (min/mile or min/km)
  - Auto-calculated from distance + time
  - Can manually override if doing walk/run intervals

- **Experience Level**
  - First timer
  - Completed 1-3 races
  - Experienced (4+ races)
  - Elite
  - (Affects gut training recommendations)

- **Heat Conditions**
  - Cool (<50°F)
  - Moderate (50-70°F)
  - Warm (70-85°F)
  - Hot (>85°F)
  - (Affects hydration recommendations)

#### Calculation Logic

**Calorie Expenditure Formula:**
```
calories_per_mile = body_weight_lbs * 0.63 // simplified
total_calories = calories_per_mile * distance_miles
calories_per_hour = total_calories / (finish_time_hours)
```

**Carbohydrate Needs:**
```
// General guidelines:
// - <75 min: minimal fueling needed
// - 75-150 min: 30-60g carbs/hour
// - >150 min: 60-90g carbs/hour
// - Elite (>240 min): up to 120g carbs/hour if gut trained

if finish_time < 75_minutes:
    carbs_per_hour = 0-30g
elif finish_time < 150_minutes:
    carbs_per_hour = 30-60g
else:
    carbs_per_hour = 60-90g
```

**Hydration Needs:**
```
base_fluid_oz_per_hour = body_weight_lbs / 2 / finish_time_hours

// Adjust for conditions
if temp > 85°F:
    fluid_oz_per_hour *= 1.3
elif temp > 70°F:
    fluid_oz_per_hour *= 1.15
    
// Sodium recommendations
sodium_mg_per_hour = 300-700 // range based on sweat rate
```

#### Output Display

**Fueling Strategy Card:**
```
Your Race Day Fueling Plan:
- Total Race Time: 4:15:30
- Carbs per Hour: 60-75g
- Fluids per Hour: 16-20 oz
- Sodium per Hour: 400-500mg

Suggested Schedule:
Mile 3: Gel (25g carbs) + 8oz water
Mile 6: Chews (24g carbs) + 8oz sports drink
Mile 9: Gel (25g carbs) + 8oz water
... (continue every 3-4 miles)

Product Examples:
- GU Energy Gel (25g carbs)
- Maurten Gel 100 (25g carbs)
- Tailwind Nutrition (27g carbs per scoop)
- Skratch Labs Sports Drink
```

**Downloadable/Printable:**
- Save as PDF
- Email to self
- Save to profile

### 4.2 Fueling Logger

#### Purpose
Track actual fueling attempts during training runs and races to optimize personal strategy.

#### Log Entry Structure
```
{
  "log_id": "uuid",
  "user_id": "...",
  "date": "2025-01-15",
  "run_type": "long_run", // long_run, tempo, race, easy
  "distance": 18.0, // miles
  "duration": "2:45:30", // HH:MM:SS
  
  "fueling": [
    {
      "time": "0:45:00", // when consumed
      "mile": 6,
      "product": "GU Vanilla",
      "carbs": 25,
      "calories": 100
    },
    {
      "time": "1:30:00",
      "mile": 12,
      "product": "Maurten Gel",
      "carbs": 25,
      "calories": 100
    }
  ],
  
  "hydration": [
    {
      "time": "0:30:00",
      "amount_oz": 8,
      "type": "water"
    },
    {
      "time": "1:00:00",
      "amount_oz": 16,
      "type": "sports_drink"
    }
  ],
  
  "rating": 4, // 1-5 stars
  "notes": "Felt great until mile 16, should have taken gel at mile 15",
  "gi_issues": false,
  "energy_level": "good", // poor, okay, good, great
  "would_repeat": true
}
```

#### Log View & Analysis

**Individual Log View:**
- Timeline visualization of fuel/hydration
- Compare planned vs actual
- Notes and ratings prominent

**Trends Over Time:**
- Show all logs for a run distance
- Identify patterns (what worked best)
- Average carbs/hour that worked
- Success rate tracking

**AI Recommendations (Future):**
- "You perform best with gels every 40 minutes"
- "You handle liquid nutrition better than gels"
- "Your optimal carb intake is 65g/hour"

### UI Requirements
- Clean calculator with sliders and inputs
- Visual fueling schedule (timeline)
- Easy-to-use logger (during or post-run)
- Dashboard showing personal trends
- Shareable fueling plans
- Mobile-first for race-day reference

---

## Tool 5: Training Plans & Workout Logging

### Purpose
Provide structured training plans and allow runners to log their progress.

### 5.1 Training Plan Library

#### Available Plans (Free Templates)

**5K Plans:**
- Beginner: Couch to 5K (8 weeks)
- Intermediate: Sub-30 5K (6 weeks)
- Advanced: Sub-20 5K (8 weeks)

**10K Plans:**
- Beginner: Finish a 10K (10 weeks)
- Intermediate: Sub-60 10K (8 weeks)

**Half Marathon Plans:**
- Beginner: Finish Half Marathon (12 weeks)
- Intermediate: Sub-2:00 Half (12 weeks)
- Advanced: Sub-1:30 Half (12 weeks)

**Marathon Plans:**
- Beginner: Finish Marathon (16-18 weeks)
- Intermediate: Sub-4:00 Marathon (16 weeks)
- Advanced: Sub-3:30 Marathon (18 weeks)
- Advanced: Boston Qualifier (18 weeks)

#### Plan Structure

**Each Plan Contains:**
```
{
  "plan_id": "uuid",
  "name": "Sub-2:00 Half Marathon",
  "distance": "half_marathon",
  "difficulty": "intermediate",
  "duration_weeks": 12,
  "runs_per_week": 4,
  "peak_mileage": 35,
  
  "description": "12-week plan designed to...",
  "prerequisites": "Comfortably running 15+ miles per week",
  
  "weeks": [
    {
      "week_number": 1,
      "total_miles": 18,
      "workouts": [
        {
          "day": "Monday",
          "workout_type": "easy_run",
          "distance": 4,
          "pace_guidance": "comfortable, conversational",
          "description": "Easy shake-out run",
          "notes": "Focus on form and recovery"
        },
        {
          "day": "Wednesday",
          "workout_type": "tempo",
          "distance": 6,
          "pace_guidance": "10K pace for middle 3 miles",
          "description": "Tempo workout: 1mi warm-up, 3mi @ tempo, 2mi cool-down",
          "notes": "Tempo should feel comfortably hard"
        },
        {
          "day": "Friday",
          "workout_type": "easy_run",
          "distance": 4,
          "pace_guidance": "comfortable",
          "description": "Recovery run"
        },
        {
          "day": "Sunday",
          "workout_type": "long_run",
          "distance": 8,
          "pace_guidance": "easy, conversational",
          "description": "Long run at easy pace",
          "notes": "Practice fueling strategy"
        }
      ]
    }
    // ... weeks 2-12
  ]
}
```

#### Workout Types Defined

- **Easy Run**: Conversational pace, aerobic base building
- **Long Run**: Extended distance at easy pace, endurance
- **Tempo Run**: Sustained "comfortably hard" effort, lactate threshold
- **Intervals**: Short, fast repeats with recovery (e.g., 8x400m)
- **Progression Run**: Start easy, finish at tempo or faster
- **Race Pace**: Practice goal race pace
- **Recovery Run**: Very easy, active recovery
- **Cross Training**: Non-running cardio (bike, swim, elliptical)
- **Rest Day**: Complete rest or gentle stretching

### 5.2 Workout Logging

#### Manual Entry (MVP)

**Quick Log Form:**
```
Date: [calendar picker]
Workout Type: [dropdown: easy, tempo, intervals, long, race, etc.]
Distance: [input] miles/km
Time: [input] HH:MM:SS
Pace: [auto-calculated, can override]

Effort Level: [1-5 scale or RPE 1-10]
Route/Notes: [text area]
Weather: [optional: temp, conditions]
Shoe Used: [dropdown of user's shoes]

Associated Training Plan: [optional link to plan]
```

**Additional Options:**
- Photo upload (screenshot from watch, selfie)
- Share to social (future)
- Mark as race
- Link to Strava activity (future)

#### Log View Options

**Calendar View:**
- Monthly calendar showing logged workouts
- Color-coded by type
- Click date to see details
- Visual mileage tracking

**List View:**
- Chronological list
- Filter by date range, workout type
- Sort by distance, pace, date
- Export to CSV

**Stats Dashboard:**
- Total miles this week/month/year
- Average pace trends
- Workout type distribution (pie chart)
- Personal records (PRs)
- Training plan adherence (if following plan)

### 5.3 Plan Following (Basic)

**How It Works:**
1. User selects a training plan
2. Plan is copied to their account
3. Calendar shows upcoming workouts
4. User logs actual workout (can match to planned or log freestyle)
5. System tracks adherence and progress

**Plan Progress Tracking:**
- Weeks completed
- Workouts completed vs. skipped
- Total mileage vs. plan
- Simple progress bar

### 5.4 Future Integration Ideas (Post-MVP)

**Apple Health / HealthKit:**
- Auto-import workout data
- Sync heart rate
- Activity rings integration

**Garmin Connect:**
- OAuth integration
- Pull completed activities
- Sync workout details

**Strava:**
- OAuth connection
- Import activities automatically
- Bi-directional sync

### UI Requirements

**Training Plan Selection:**
- Browse plans by distance
- Filter by difficulty level
- Preview plan before selecting
- Clear expectations (weeks, mileage, time commitment)

**Workout Logging:**
- Fast, mobile-friendly input
- Pre-fill from plan if applicable
- Save as draft (for unfinished logs)
- Celebrate milestones (100 miles, longest run, etc.)

**Dashboard:**
- At-a-glance stats
- Upcoming workouts (if following plan)
- Recent activity feed
- Motivational elements (streaks, badges)

---

## Cross-Tool Integration

### User Profiles
- Save favorite shoes from shoe selector
- Track shoes from attire guide
- Link shoe mileage to workout logs
- Reference fueling logs when creating plans
- Music preferences across workouts

### Data Sharing
- Export workout data
- Share fueling strategies
- Recommend shoes based on logged workouts
- Generate insights from usage patterns

---

## MVP Success Criteria

### Each Tool Must:
1. Load quickly (<2 seconds)
2. Work on mobile and desktop
3. Provide immediate value without login
4. Offer enhanced features when logged in
5. Be visually appealing and on-brand
6. Include social sharing capability

### Metrics to Track:
- Tool usage rates (which gets used most?)
- Time on tool (engagement)
- Return visits
- User accounts created
- Data logged
- Social shares

### Quality Bars:
- No critical bugs
- Responsive on all screen sizes
- Accessible (WCAG AA minimum)
- Fast performance
- Clear, friendly copy
