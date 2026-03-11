# Running Companion App - Project Documentation

## 📋 Quick Start for Developers

This documentation package contains everything needed to build the Running Companion App - a free, all-in-one web platform for runners that combines fun tools (shoe selector, attire guide, music) with serious utilities (fueling optimization, training plans, workout logging).

---

## 🎯 Project Overview

**Vision:** Provide runners with an integrated platform that makes running both enjoyable and results-driven.

**Business Model:** Free to start, validate market fit, monetize later through premium features and affiliate partnerships.

**Target Users:** Mixed experience runners (3-18 months of running) who want to improve performance while having fun.

**Tech Stack:** Next.js + Tailwind CSS + Supabase + Vercel (full stack web app)

---

## 📚 Documentation Structure

### [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)
**Read this first!**

Contains:
- Complete project vision and goals
- Target audience and user personas
- Competitive positioning
- Success criteria
- Development philosophy
- Timeline and milestones

**Key takeaways:**
- We're building 5 core tools in one integrated platform
- Starting 100% free to validate market fit
- Focus on fun + utility balance
- Mobile-first responsive web app (not native mobile)

---

### [MVP_SPEC.md](./MVP_SPEC.md)
**Most detailed document - your primary reference**

Contains detailed specifications for all 5 tools:

#### Tool 1: Shoe Selector (Interactive Quiz)
- Questionnaire-based shoe recommendations
- Database of 20-30 popular shoes
- Matching algorithm based on running style
- Filtering and comparison features

#### Tool 2: Attire Guide (Persona-Based)
- 5 runner personas (Party Animal, Speed Demon, Creative Cruiser, Minimalist Pro, All-Weather Warrior)
- Curated clothing recommendations per persona
- Browse by category and weather conditions
- Outfit builder and saving

#### Tool 3: Music Tools (Community Platform)
- Song database with voting system
- Browse by BPM, genre, energy level
- Submit and discover new running music
- Integration with Spotify for metadata and previews
- Auto-generated playlists

#### Tool 4: Fueling Calculator & Logger
- Personalized race fueling plans
- Calculator based on distance, time, weight
- Log actual fueling from training runs
- Track what works for your body
- Optimize strategy over time

#### Tool 5: Training Plans & Workout Logging
- Free training plan templates (5K to marathon)
- Calendar view of workouts
- Manual workout logging (Strava integration post-MVP)
- Progress tracking and stats
- Adherence monitoring

**Use this document for:**
- Understanding exact feature requirements
- Data structure definitions
- UI/UX requirements
- Success criteria per tool

---

### [TECH_STACK.md](./TECH_STACK.md)
**Your technology blueprint**

Contains:
- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Vercel Serverless Functions, Supabase (PostgreSQL + Auth + Storage)
- **Integrations:** Spotify API, Strava API
- **Hosting:** Vercel (frontend) + Supabase Cloud (database)
- **Analytics:** Sentry (errors), Vercel Analytics or Plausible

**Key decisions:**
- Jamstack architecture (static frontend + API)
- Serverless functions (no servers to manage)
- Supabase for everything backend (database, auth, file storage)
- TypeScript for type safety
- Deploy to Vercel free tier

**Cost:** $0/month for MVP, ~$55/month at 1000+ users

**Development setup:**
- Node.js 18+
- pnpm or npm
- Git + GitHub
- VS Code recommended

---

### [API_INTEGRATIONS.md](./API_INTEGRATIONS.md)
**Detailed integration guide**

Contains implementation details for:

#### 1. Spotify Web API (MVP)
- Client Credentials flow for song search
- Get audio features (BPM, energy, tempo)
- Access 30-second preview URLs
- Free, no rate limits for our use case
- Full code examples provided

#### 2. Strava API (MVP)
- OAuth 2.0 flow for user authorization
- Import workout activities
- Token refresh logic
- Webhook subscriptions (recommended)
- Important: Rate limits (100 requests/15 min, 1000/day)
- Full implementation code provided

#### 3. Apple Health / HealthKit (Future - Phase 2)
- Challenge: Web apps can't access HealthKit directly
- Options: Build iOS app, use Terra API ($49/mo), or manual export
- Recommendation: Skip for MVP, add in Phase 2 if demand exists

#### 4. Garmin Connect API (Future - Phase 2)
- Challenge: Difficult approval process for indie developers
- Options: Official API (if approved), Terra API, or file import
- Recommendation: Most Garmin users also use Strava

**Use this document for:**
- Copy-paste implementation code
- Understanding OAuth flows
- Rate limit handling
- Webhook setup
- Integration testing checklists

---

### [USER_STORIES.md](./USER_STORIES.md)
**How users will interact with the app**

Contains:
- Detailed user personas (Sarah, Marcus, Jennifer)
- User flows for each tool
- Cross-tool journeys
- Onboarding and returning user experiences
- Mobile-specific stories
- Social/sharing features

**Example user journey:**
```
Sarah (training for marathon):
1. Starts training plan (Tool 5)
2. Buys shoes with shoe selector (Tool 1)
3. Creates fueling plan (Tool 4)
4. Tests fueling on long runs, logs results (Tool 4)
5. Discovers tempo run music (Tool 3)
6. Buys race outfit with attire guide (Tool 2)
7. Runs marathon with optimized strategy
```

**Use this document for:**
- Understanding user motivations
- Designing user flows
- Creating acceptance criteria
- Planning features from user perspective

---

## 🚀 Development Roadmap

### Phase 1: MVP Development (Months 1-3)

**Sprint 1-2: Foundation (3-4 weeks)**
- [ ] Set up Next.js project structure
- [ ] Configure Tailwind CSS + shadcn/ui
- [ ] Set up Supabase project
- [ ] Implement authentication (Supabase Auth)
- [ ] Create basic layout and navigation
- [ ] Deploy to Vercel (get CI/CD working)

**Sprint 3-4: Tool 1 - Shoe Selector (2-3 weeks)**
- [ ] Build shoe database schema
- [ ] Create questionnaire UI
- [ ] Implement matching algorithm
- [ ] Build results page with filtering
- [ ] Populate database with 20-30 shoes
- [ ] Add shoe detail pages

**Sprint 5-6: Tool 2 - Attire Guide (2-3 weeks)**
- [ ] Create persona selection UI
- [ ] Build clothing item database
- [ ] Implement filtering by persona/weather
- [ ] Create outfit builder
- [ ] Add save favorites functionality

**Sprint 7-8: Tool 3 - Music Tools (2-3 weeks)**
- [ ] Integrate Spotify API
- [ ] Build song submission form
- [ ] Implement voting system
- [ ] Create browse/filter interface
- [ ] Build playlist generators

**Sprint 9-10: Tool 4 - Fueling Calculator (2 weeks)**
- [ ] Build fueling calculator logic
- [ ] Create calculator UI
- [ ] Build fueling logger
- [ ] Implement history and trends view

**Sprint 11-12: Tool 5 - Training Plans (3 weeks)**
- [ ] Create training plan database
- [ ] Populate with 8-10 plans
- [ ] Build plan selection UI
- [ ] Create workout logging interface
- [ ] Implement calendar view
- [ ] Build stats dashboard

**Sprint 13: Polish & Testing (1-2 weeks)**
- [ ] Responsive design testing
- [ ] Performance optimization
- [ ] Error handling
- [ ] Analytics setup
- [ ] SEO optimization
- [ ] User testing

### Phase 2: Integration & Enhancement (Months 4-6)

**Sprint 14-15: Strava Integration (2 weeks)**
- [ ] Implement Strava OAuth
- [ ] Build activity import
- [ ] Token refresh logic
- [ ] Sync imported workouts to logging

**Sprint 16: Polish & User Feedback (2 weeks)**
- [ ] Address user feedback
- [ ] Fix bugs
- [ ] Improve UX based on analytics
- [ ] Add requested features

**Sprint 17+: Growth (Ongoing)**
- [ ] Marketing and user acquisition
- [ ] Content updates (new shoes, music, plans)
- [ ] Community building
- [ ] Explore monetization

---

## 🎨 Design Principles

### Visual Design
- **Clean and modern**: Plenty of white space
- **Mobile-first**: Works great on phones
- **Fast**: Quick load times, responsive interactions
- **Accessible**: WCAG AA compliance minimum
- **On-brand**: Energetic but professional

### Color Palette (Suggested)
- **Primary**: Vibrant blue (#2563EB) - energy and motion
- **Secondary**: Orange (#F97316) - warmth and achievement
- **Accent**: Green (#10B981) - success and growth
- **Neutral**: Gray scale for text and backgrounds
- **Backgrounds**: White and very light gray

### Typography
- **Headers**: Bold, clear hierarchy
- **Body**: Readable, comfortable line height
- **Data/Stats**: Tabular numbers for alignment

### Component Style
- **Buttons**: Rounded corners, clear hover states
- **Cards**: Subtle shadows, organized information
- **Forms**: Clear labels, inline validation
- **Icons**: Lucide React (consistent, accessible)

---

## 💾 Database Schema Overview

### Core Tables

```sql
-- Users (handled by Supabase Auth)
users (provided by Supabase)

-- Shoes
shoes (
  id, name, brand, image_url, price, 
  usage_types[], foot_strike[], cushion_level,
  stability, surfaces[], weight_range, 
  stack_height, drop, description, pros[], cons[]
)

user_shoes (
  id, user_id, shoe_id, nickname, purchase_date,
  starting_mileage, current_mileage, is_retired
)

-- Clothing
clothing_items (
  id, name, brand, category, gender, image_url,
  price, personas[], weather[], features[], colors[]
)

-- Music
songs (
  id, title, artist, spotify_id, youtube_url,
  bpm, genre[], energy_level, best_for[],
  submitted_by, submitted_date, upvotes, downvotes
)

song_votes (
  id, user_id, song_id, vote_type, created_at
)

-- Fueling
fueling_logs (
  id, user_id, date, distance, duration,
  fueling_items[], hydration_items[],
  rating, notes, gi_issues, energy_level
)

-- Training
training_plans (
  id, name, distance_type, difficulty, weeks,
  runs_per_week, peak_mileage, description, weeks[]
)

user_training_plans (
  id, user_id, training_plan_id, start_date,
  current_week, completed_workouts[], status
)

workout_logs (
  id, user_id, date, workout_type, distance, time,
  pace, effort, route, notes, weather, shoe_id
)

-- Integrations
strava_connections (
  id, user_id, athlete_id, access_token,
  refresh_token, expires_at
)

imported_activities (
  id, user_id, strava_id, name, type,
  distance, moving_time, start_date, raw_data
)
```

---

## 🔐 Environment Variables

Create `.env.local` file:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Spotify
SPOTIFY_CLIENT_ID=your-client-id
SPOTIFY_CLIENT_SECRET=your-client-secret

# Strava
STRAVA_CLIENT_ID=your-client-id
STRAVA_CLIENT_SECRET=your-client-secret
STRAVA_VERIFY_TOKEN=random-string-for-webhook

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Analytics (optional)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

---

## 📝 Getting Started Checklist

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] GitHub account created
- [ ] Code editor installed (VS Code recommended)

### Project Setup
- [ ] Create Supabase account and project
- [ ] Create Vercel account
- [ ] Register Spotify Developer account and create app
- [ ] Register Strava API application
- [ ] Clone/create repository
- [ ] Install dependencies (`pnpm install`)
- [ ] Set up environment variables
- [ ] Run development server (`pnpm dev`)
- [ ] Verify app loads at localhost:3000

### First Sprint Tasks
- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Tailwind CSS
- [ ] Install and configure shadcn/ui
- [ ] Connect to Supabase
- [ ] Create homepage with navigation
- [ ] Deploy to Vercel
- [ ] Set up GitHub repository
- [ ] Create first database tables
- [ ] Implement basic authentication

---

## 🧪 Testing Strategy

### Unit Tests (Optional for MVP)
- Critical business logic (fueling calculations, matching algorithms)
- Use Vitest for speed

### Integration Tests (Recommended)
- API endpoints
- Database operations
- Third-party integrations

### E2E Tests (Post-MVP)
- Complete user flows
- Use Playwright for real browser testing

### Manual Testing (Required)
- Test on real devices (phone, tablet, desktop)
- Different browsers (Chrome, Safari, Firefox)
- Accessibility testing (keyboard navigation, screen readers)

---

## 📊 Success Metrics

### Technical Metrics
- Page load time < 2 seconds
- API response time < 500ms
- Mobile performance score > 90 (Lighthouse)
- Zero critical bugs at launch

### User Metrics
- 1,000 registered users (6 months)
- 30% monthly active rate
- 100+ daily active users
- Average session duration > 5 minutes
- Tool usage rates (which is most popular?)

### Business Metrics
- Organic traffic growth
- Social media shares
- Affiliate link click-through rate
- User retention (return within 7 days)
- Net Promoter Score (NPS) > 50

---

## 🤝 Contributing & Collaboration

### Git Workflow
```
main (production)
  └── develop (staging)
       └── feature/[tool-name]
       └── fix/[bug-description]
```

### Commit Message Format
```
feat: Add shoe selector questionnaire
fix: Resolve Strava token refresh issue
docs: Update API integration guide
style: Improve mobile responsive layout
```

### Code Review Checklist
- [ ] TypeScript types defined
- [ ] Responsive design tested
- [ ] Accessibility considered
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Documentation updated

---

## 📞 Support & Resources

### Key Documentation Links
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [Strava API](https://developers.strava.com/docs/)

### Community Resources
- Next.js Discord
- Supabase Discord
- Stack Overflow
- GitHub Discussions (create for project)

---

## 🎉 Ready to Build!

You now have everything needed to start building:
- ✅ Clear vision and goals
- ✅ Detailed feature specifications
- ✅ Technology stack defined
- ✅ API integration guides
- ✅ User stories and flows
- ✅ Database schema
- ✅ Development roadmap

**Next Step:** Set up your development environment and start Sprint 1!

**Recommended First Task:** Build the homepage and navigation structure. This establishes the foundation and lets you deploy early to get familiar with the workflow.

---

## 📄 Document Versions

- Version 1.0 - January 2025 - Initial comprehensive documentation
- All documents maintained in `/docs` folder
- Update as project evolves

---

**Questions?** Reference the specific document for detailed information:
- Vision/Strategy → PROJECT_OVERVIEW.md
- Features/Requirements → MVP_SPEC.md
- Technology → TECH_STACK.md
- Integrations → API_INTEGRATIONS.md
- User Experience → USER_STORIES.md

**Let's build something awesome! 🏃‍♂️💨**
