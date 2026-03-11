# User Stories

## Overview

This document describes how different types of users will interact with the Running Companion App, organized by tool and user journey.

---

## User Personas

### Primary Personas

**1. Sarah - The Improving Amateur**
- Age: 32, Marketing Manager
- Running Experience: 2 years, completed 3 half marathons
- Goals: Break 2:00 in her next half, stay injury-free
- Pain Points: Unsure about shoes, confused by fueling options
- Tech Savviness: High - uses Strava, Instagram

**2. Marcus - The Social Runner**
- Age: 27, Graphic Designer
- Running Experience: 1 year, runs 3x/week with running club
- Goals: Have fun, look good, share achievements
- Pain Points: Bored with music, wants trendy gear
- Tech Savviness: Very High - early adopter, runs club has 20+ members

**3. Jennifer - The Comeback Runner**
- Age: 41, Teacher
- Running Experience: Used to run in college, restarting after 10 years
- Goals: Get back to 10K fitness, not get injured
- Pain Points: Overwhelmed by modern gear/tech, needs structure
- Tech Savviness: Moderate - uses apps but not deeply

---

## Tool 1: Shoe Selector

### Story 1.1: Finding the Right Shoe

**As Sarah**, I want to find the perfect shoe for my training runs, so I can avoid injury and run comfortably.

**Acceptance Criteria:**
- I can answer questions about my running style
- I receive personalized recommendations with explanations
- I can filter results by price and brand
- I can save my favorite shoes to my profile
- I can click through to purchase the recommended shoes

**User Flow:**
```
1. Sarah lands on homepage
2. Clicks "Find Your Perfect Shoe" button
3. Answers questionnaire:
   - Usage: Daily trainer + Long runs
   - Foot strike: Heel strike
   - Cadence: Average (170 spm)
   - Toe box: Standard
   - Cushion: Moderate
   - Stability: Neutral
   - Surface: Road + Treadmill
   - Weight: 135 lbs (optional - she provides)
4. Sees results:
   - Brooks Ghost 16 (95% match)
   - Nike Pegasus 41 (92% match)
   - ASICS Gel-Nimbus 26 (89% match)
5. Clicks into Brooks Ghost details
6. Reads pros/cons, sees price ($140)
7. Clicks "Where to Buy" → links to retailers
8. Saves Ghost 16 to favorites
```

### Story 1.2: Learning About Shoes

**As Jennifer**, I want to understand what makes different shoes good for different purposes, so I can make an informed decision.

**Acceptance Criteria:**
- I can access educational content about shoe features
- Terminology is explained (drop, stack height, etc.)
- I can compare multiple shoes side-by-side
- I understand why each shoe is recommended for me

**User Flow:**
```
1. Jennifer starts shoe selector
2. Clicks "Not sure?" link next to "Foot Strike"
3. Opens tooltip/modal explaining foot strike types
4. Watches 30-second embedded video
5. Returns to quiz, selects "Heel strike"
6. Completes quiz
7. Views results
8. Clicks "Compare Top 3" button
9. Sees side-by-side comparison table
10. Understands differences in cushioning and support
```

---

## Tool 2: Attire Guide

### Story 2.1: Discovering My Style

**As Marcus**, I want to find running clothes that match my personality, so I can express myself and feel confident.

**Acceptance Criteria:**
- I can select a persona that resonates with me
- I see curated outfit recommendations
- I can browse by category (tops, bottoms, accessories)
- I can create and save outfit combinations
- I can share my favorite looks on social media

**User Flow:**
```
1. Marcus navigates to Attire Guide
2. Sees 5 persona cards with descriptions
3. Reads "Creative Cruiser" - "That's me!"
4. Clicks Creative Cruiser card
5. Sees curated collection:
   - Oiselle patterned singlet
   - Lululemon fast and free shorts
   - Ciele GOCap
   - On Cloud X running shoes
6. Filters by "Race Day" category
7. Creates outfit: singlet + shorts + hat
8. Saves as "NYC Marathon Outfit"
9. Shares screenshot on Instagram
```

### Story 2.2: Weather-Appropriate Gear

**As Sarah**, I want to know what to wear for different weather conditions, so I'm prepared and comfortable.

**Acceptance Criteria:**
- I can filter by weather conditions
- I see layering recommendations
- I understand what fabrics work for what conditions
- I can save seasonal wardrobes

**User Flow:**
```
1. Sarah checks forecast: 35°F and rainy
2. Goes to Attire Guide → "All-Weather Warrior"
3. Filters by: Cold + Rain
4. Sees layering system:
   - Base: Merino wool long sleeve
   - Mid: Lightweight vest
   - Outer: Waterproof jacket
   - Bottom: Thermal tights
   - Accessories: Gloves, buff, waterproof hat
5. Clicks "Why these items?" for explanation
6. Adds to "Winter Running Checklist"
```

---

## Tool 3: Music Tools

### Story 3.1: Discovering New Running Music

**As Marcus**, I want to find new songs that match my running tempo, so my runs are more enjoyable and motivating.

**Acceptance Criteria:**
- I can browse songs by BPM range
- I can filter by genre
- I can hear 30-second previews
- I can upvote songs I like
- I can save songs to my favorites

**User Flow:**
```
1. Marcus starts warm-up run (easy pace, needs 140-150 BPM)
2. Opens Music Tools
3. Filters:
   - BPM: 140-150
   - Genre: Hip-Hop
   - Best for: Easy runs
4. Sees top-rated songs in range
5. Clicks play icon on "Good Days" by SZA
6. Listens to preview - loves it!
7. Upvotes the song
8. Adds to "Easy Run Playlist"
9. Opens Spotify and adds full song to his playlist
```

### Story 3.2: Contributing to the Community

**As Sarah**, I want to share songs that have motivated me, so other runners can benefit from my discoveries.

**Acceptance Criteria:**
- I can submit new songs easily
- The app helps me find the right song metadata
- I can tag songs appropriately
- Other users can vote on my submissions
- I get notifications when my songs are popular

**User Flow:**
```
1. Sarah finishes great tempo run powered by "Titanium"
2. Goes to Music Tools → "Submit a Song"
3. Types: "Titanium David Guetta"
4. App searches Spotify automatically
5. Shows search results with album art
6. She selects correct version
7. App auto-fills:
   - BPM: 126
   - Genre: Pop/Electronic (she can edit)
   - Energy: High
8. She adds tags: "Tempo Run", "Motivational"
9. Adds personal note: "Perfect for those final miles!"
10. Submits song
11. Gets notification: "10 people upvoted your song!"
```

---

## Tool 4: Fueling Calculator & Logger

### Story 4.1: Planning Race Day Nutrition

**As Sarah**, I want to know exactly what and when to eat during my half marathon, so I don't bonk or have GI issues.

**Acceptance Criteria:**
- I enter my race details and get a fueling plan
- The plan is specific and actionable
- I can see product recommendations
- I can save and print my plan
- I can adjust the plan based on preferences

**User Flow:**
```
1. Sarah registers for NYC Half Marathon
2. Opens Fueling Calculator
3. Enters:
   - Distance: Half Marathon
   - Goal time: 1:55:00
   - Weight: 135 lbs
   - Experience: 3rd half marathon
   - Weather: Expected 60°F
4. Clicks "Generate Plan"
5. Receives personalized strategy:
   
   Your Fueling Plan:
   - Total time: 1:55:00
   - Carbs per hour: 45-60g
   - Fluids per hour: 14-16 oz
   - Sodium per hour: 400mg
   
   Schedule:
   - Mile 4: GU Gel (25g) + 8oz water
   - Mile 7: Maurten Gel (25g) + 8oz sports drink
   - Mile 10: GU Gel (25g) + 8oz water
   
6. Clicks "Save Plan"
7. Downloads PDF to print for race day
8. Adds reminders to phone: "Buy gels"
```

### Story 4.2: Learning From Experience

**As Sarah**, I want to track what I eat during long runs, so I can figure out what works best for my stomach.

**Acceptance Criteria:**
- I can quickly log fueling during or after runs
- I can rate how well each strategy worked
- I can see patterns over time
- The app learns what works for me
- I can reference successful strategies later

**User Flow:**
```
1. Sarah completes 18-mile training run
2. Opens Fueling Logger
3. Quick log:
   - Date: Auto-filled to today
   - Distance: 18 miles
   - Time: 2:42:30
   - Add fueling:
     * Mile 6: Maurten Gel (25g carbs)
     * Mile 12: Maurten Gel (25g carbs)
   - Add hydration:
     * Mile 3: 8oz water
     * Mile 9: 16oz sports drink
     * Mile 15: 8oz water
4. Rates experience: 4/5 stars
5. Notes: "Felt great, no stomach issues. Maybe add one more gel?"
6. Submits log
7. Views "My Fueling History"
8. Sees: Last 3 long runs all used Maurten successfully
9. App suggests: "Maurten works well for you! Consider this for race day."
```

---

## Tool 5: Training Plans & Workout Logging

### Story 5.1: Following a Structured Plan

**As Jennifer**, I want a training plan to guide my comeback to 10K fitness, so I don't do too much too soon and get injured.

**Acceptance Criteria:**
- I can find a plan matching my current fitness
- The plan is clear and easy to follow
- I can see my weekly schedule at a glance
- I can log completed workouts
- I can track my progress over time

**User Flow:**
```
1. Jennifer decides to run a 10K in 3 months
2. Goes to Training Plans
3. Browses available plans
4. Selects "Finish a 10K - Beginner (10 weeks)"
5. Reads prerequisites: "Can run/walk 2 miles"
6. Thinks: "Yes, I can do that"
7. Clicks "Start This Plan"
8. Sees Week 1 schedule:
   - Monday: Rest or cross-train
   - Tuesday: 2 miles easy
   - Thursday: 2.5 miles easy
   - Saturday: 3 miles long run
9. Week 1, Tuesday arrives
10. Goes for 2-mile run
11. Returns home, opens app
12. Logs workout:
    - Matched to plan: "Week 1, Tuesday - 2 miles easy"
    - Distance: 2.1 miles
    - Time: 22:15
    - Pace: 10:35/mile
    - Effort: 4/5
    - Notes: "Felt good! Little slow but that's ok"
13. Green checkmark appears on calendar
14. Sees progress: "1/32 workouts complete"
```

### Story 5.2: Freestyle Logging

**As Marcus**, I want to log my runs even though I don't follow a formal plan, so I can track my progress and share with friends.

**Acceptance Criteria:**
- I can quickly log any run
- I don't need to follow a plan
- I can add photos and notes
- I can see my stats and trends
- I can share achievements

**User Flow:**
```
1. Marcus finishes Monday night run with running club
2. Takes group selfie
3. Opens app → Workout Logging
4. Quick log:
   - Type: Easy Run
   - Distance: 5.2 miles
   - Time: 45:30
   - Pace: 8:45/mile (auto-calculated)
   - Effort: 3/5
   - Upload photo: Group selfie
   - Notes: "Great vibes with the crew! New route through the park"
5. Clicks "Log Workout"
6. App shows: "New personal best: Longest run this month!"
7. Shares to Instagram story
8. Views dashboard:
   - This week: 12.4 miles (3 runs)
   - This month: 48.1 miles (11 runs)
   - Favorite route: Park loop (5.2 mi)
```

---

## Cross-Tool User Journeys

### Journey 1: Complete Race Preparation

**As Sarah preparing for a marathon:**

```
1. Selects "Sub-4:00 Marathon" training plan (Tool 5)
2. Week 1: Uses shoe selector to buy training shoes (Tool 1)
3. Week 4: Creates race day fueling plan (Tool 4)
4. Week 8: Tests fueling plan on 18-mile run, logs results (Tool 4)
5. Week 10: Discovers new tempo run music playlist (Tool 3)
6. Week 14: Buys race day outfit using attire guide (Tool 2)
7. Week 16: Finalizes fueling based on logged tests (Tool 4)
8. Race day: References fueling plan on phone
9. Post-race: Logs race and celebrates achievements (Tool 5)
```

### Journey 2: Becoming a Better Runner

**As Marcus exploring the app:**

```
1. First visit: Takes shoe quiz out of curiosity (Tool 1)
2. Discovers "Creative Cruiser" persona - "That's me!" (Tool 2)
3. Browses running fashion, saves favorite looks (Tool 2)
4. Submits his favorite running song (Tool 3)
5. Upvotes songs in his preferred BPM range (Tool 3)
6. Decides to try structured training (Tool 5)
7. Follows "Sub-30 5K" plan (Tool 5)
8. Logs workouts and tracks progress (Tool 5)
9. Shares PR on social media with outfit from attire guide (Tool 2)
10. Refers friends to app to vote on his song submissions (Tool 3)
```

---

## Onboarding User Stories

### Story: First-Time Visitor (Not Logged In)

**As a visitor**, I want to try the tools without creating an account, so I can decide if the app is valuable.

**Acceptance Criteria:**
- All tools work without login
- Results are shown immediately
- Clear CTAs to create account for enhanced features
- Smooth transition from guest to registered user

**User Flow:**
```
1. Visitor finds site through Google search "running shoe finder"
2. Lands on homepage
3. Sees clear value proposition
4. Clicks "Find Your Perfect Shoe" (no login required)
5. Completes questionnaire
6. Gets results
7. Sees banner: "Create free account to save your favorites"
8. Continues browsing other tools
9. Tries music tool, upvotes songs
10. Sees: "Create account to build playlists and track your votes"
11. Decides app is valuable
12. Clicks "Sign Up Free"
13. Registers with email or Google
14. Previous quiz results and votes are saved to account
```

### Story: Returning User

**As a registered user**, I want to quickly access my data and continue where I left off.

**Acceptance Criteria:**
- Fast login (email, Google, remembers me)
- Dashboard shows personalized content
- Quick access to current training plan
- Recent activity visible
- Notifications for new content

**User Flow:**
```
1. Sarah opens app on phone
2. Auto-logged in (saved session)
3. Sees dashboard:
   - "This Week: Week 8 of 16 - Sub-4:00 Marathon"
   - "Next workout: Thursday - 8x400m intervals"
   - "Your music: 5 new upvotes on your Titanium submission"
   - "Trending: Nike Pegasus 42 released"
4. Clicks "Log Yesterday's Run"
5. Quick-logs 8-mile long run
6. Checks upcoming workouts for the week
7. Done in under 2 minutes
```

---

## Admin/Content Management Stories

### Story: Adding New Shoes (Admin)

**As an admin**, I want to easily add new shoe releases to the database, so recommendations stay current.

**Acceptance Criteria:**
- Simple form to add shoes
- All attributes can be specified
- Can upload images
- Can preview shoe card before publishing
- Can edit or remove shoes

### Story: Moderating Music Submissions (Admin)

**As an admin**, I want to review flagged song submissions, so the database stays high-quality.

**Acceptance Criteria:**
- Can see reported songs
- Can verify song metadata
- Can edit incorrect information
- Can remove inappropriate submissions
- Can feature exceptional songs

---

## Mobile-Specific User Stories

### Story: Race Day Reference

**As Sarah on marathon morning**, I want to quickly reference my fueling plan on my phone, so I know what to take at aid stations.

**Acceptance Criteria:**
- App loads fast on mobile
- Fueling plan is easy to read at a glance
- No login required if already logged in
- Works offline (cached)
- Large, readable text

**User Flow:**
```
1. 5:00 AM race morning
2. Opens app on phone
3. Goes to "My Plans" → "NYC Marathon Fueling"
4. Sees clean, simple schedule:
   Mile 6: GU + water
   Mile 10: GU + Gatorade
   Mile 13: GU + water
   ...
5. Takes screenshot as backup
6. Puts phone in SpiBelt
7. During race, checks at aid stations
```

---

## Social/Community Stories

### Story: Sharing Achievements

**As Marcus**, I want to share my progress with friends, so they can support and celebrate with me.

**Acceptance Criteria:**
- Can share workout completions
- Can share milestone achievements
- Generated shareable images look good
- Easy one-click sharing to social media
- Includes app branding (for awareness)

**User Flow:**
```
1. Marcus completes Week 8 of 5K plan
2. App shows: "Congrats! You just ran your longest distance: 4.5 miles!"
3. Clicks "Share Achievement"
4. App generates image:
   - App logo
   - "4.5 Miles - New Record!"
   - Date and pace
   - "Training with Running Companion"
5. Options: Instagram, Twitter, Facebook, Copy Link
6. Shares to Instagram story
7. Friends see and comment
8. Some ask about the app → potential new users
```

---

## Success Metrics by Story

Each user story should track:
- Completion rate (started → finished)
- Time to complete
- Return rate (come back to use again)
- Conversion rate (guest → registered user)
- Sharing rate (social shares)
- Satisfaction (if surveyed)

**Example metrics for Shoe Selector:**
- 70% of visitors complete the quiz
- Average time: 2 minutes
- 40% save results (requires account)
- 60% return within 7 days
- 15% make purchase through affiliate link

---

## Future User Stories (Post-MVP)

- Connect with friends and compare progress
- Join challenges (run X miles in Y days)
- Earn badges and achievements
- Get AI-powered insights ("You run faster with playlist A")
- Export data to other apps
- Set up training plan reminders/notifications
- Create custom training plans
- Book virtual coaching sessions
