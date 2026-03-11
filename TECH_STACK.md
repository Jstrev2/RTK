# Technology Stack Recommendations

## Overview

This document outlines recommended technologies for building the Running Companion App as a modern, responsive web application optimized for a side project with potential to scale.

---

## Architecture Philosophy

### Principles
1. **Start Simple**: Use proven, well-documented technologies
2. **Minimize Operational Overhead**: Prefer managed services over self-hosting
3. **Developer Experience**: Choose tools that are enjoyable and productive
4. **Scalability Path**: Architecture should allow growth without complete rewrites
5. **Cost-Conscious**: Free tier friendly, pay as you grow

### Architecture Pattern
**Jamstack + API**
- Static frontend deployed to CDN
- Serverless API functions
- Database as a service
- Third-party authentication

---

## Frontend Stack

### Framework: **Next.js 14** (React)

**Why Next.js:**
- React-based (huge ecosystem, great for interactive UIs)
- Built-in routing
- Server-side rendering (SSR) for SEO
- API routes (can handle simple backend tasks)
- Image optimization out of the box
- Great developer experience
- Deploy easily to Vercel (free tier)

**Alternative:** SvelteKit (lighter, faster, but smaller ecosystem)

### UI Component Library: **shadcn/ui** + **Tailwind CSS**

**Why shadcn/ui:**
- Beautiful, accessible components
- Copy components into your project (not a dependency)
- Built on Radix UI (accessibility first)
- Highly customizable
- Free and open source

**Why Tailwind CSS:**
- Utility-first CSS (fast development)
- No naming conventions to learn
- Responsive design made easy
- Excellent documentation
- Small production bundle size

**Additional UI Libraries:**
- **Framer Motion**: Animations
- **Recharts**: Charts and graphs
- **React Hook Form**: Form handling
- **Zod**: Schema validation

### State Management

**Local State:** React hooks (useState, useReducer)
**Server State:** **TanStack Query** (React Query)
- Caching
- Automatic refetching
- Optimistic updates
- Perfect for API data

**Global State (if needed):** Zustand (simple, lightweight)

---

## Backend Stack

### API Layer: **Serverless Functions**

**Option 1: Vercel Edge Functions** (Recommended for MVP)
- Deploy alongside Next.js
- Free tier: 100GB-hrs/month
- Fast (edge network)
- Simple deployment

**Option 2: Supabase Edge Functions**
- Deno-based
- Integrated with Supabase
- Good if using Supabase for database

**API Framework:**
- Next.js API Routes (for simple endpoints)
- tRPC (for type-safe APIs with frontend)

### Database: **Supabase** (PostgreSQL)

**Why Supabase:**
- Managed PostgreSQL database
- Built-in authentication
- Realtime subscriptions
- Auto-generated REST API
- Row-level security
- File storage included
- Generous free tier: 500MB database, 1GB file storage
- Great developer experience

**Database Schema Design:**
```
Tables needed:
- users
- shoes (database)
- user_shoes (user's shoe collection)
- clothing_items
- songs
- song_votes
- training_plans
- workout_logs
- fueling_logs
- user_playlists
```

**Alternative:** PlanetScale (MySQL, also good free tier)

### Authentication: **Supabase Auth**

**Features:**
- Email/password
- OAuth (Google, GitHub, etc.)
- Magic links
- JWT tokens
- Row-level security built-in

**Alternative:** Clerk (great UX, more expensive)

### File Storage: **Supabase Storage** or **Cloudinary**

**For:**
- User profile photos
- Shoe images
- Workout photos
- Custom attire uploads (future)

**Supabase Storage:**
- 1GB free
- Integrated with database
- CDN delivery

**Cloudinary:**
- Image optimization
- Transformations
- Better free tier for images (25GB bandwidth/month)

---

## API Integrations

### Strava API
**Purpose:** Import workout data
**Documentation:** https://developers.strava.com/
**Authentication:** OAuth 2.0
**Cost:** Free (rate limits: 100 requests per 15 min, 1,000 per day)

**Implementation:**
```typescript
// OAuth flow
1. User clicks "Connect Strava"
2. Redirect to Strava authorization
3. Receive authorization code
4. Exchange for access token
5. Store token in database
6. Use token to fetch activities
```

### Spotify API
**Purpose:** Song metadata, BPM, previews, playlist creation
**Documentation:** https://developer.spotify.com/
**Authentication:** OAuth 2.0 or Client Credentials
**Cost:** Free

**Features to Use:**
- Search for tracks
- Get audio features (BPM, energy, tempo)
- Get track previews (30 seconds)
- Create playlists (future)

### Apple Music API (Optional)
**Purpose:** Alternative music integration
**Cost:** Free with Apple Developer account ($99/year)
**Complexity:** Higher than Spotify

### Apple Health / HealthKit (Future)
**Challenge:** Web-based access limited
**Options:**
- Build iOS companion app (significant effort)
- Use third-party services like Terra API ($49/month)
- Wait for user to export Health data manually

### Garmin Connect API (Future)
**Documentation:** https://developer.garmin.com/
**Challenge:** Requires approval, limited access for non-corporate apps
**Alternative:** File import (user downloads from Garmin, uploads to app)

---

## Deployment & Hosting

### Frontend Hosting: **Vercel**

**Why Vercel:**
- Made for Next.js
- Automatic deployments from Git
- Global CDN
- Preview deployments for branches
- Free tier: Unlimited projects, 100GB bandwidth/month
- Custom domains
- Automatic HTTPS

**Alternative:** Netlify (similar features)

### Backend/API: **Vercel Serverless Functions**
- Automatically deployed with frontend
- No separate backend server to manage
- Scales automatically
- Pay per execution (free tier is generous)

### Database: **Supabase Cloud**
- Free tier included
- Managed PostgreSQL
- Automatic backups (paid)
- Located in multiple regions

---

## Development Tools

### Version Control: **GitHub**
- Free private repos
- GitHub Actions for CI/CD
- Project management tools
- Community contributions (future)

### Package Manager: **pnpm** or **npm**
- pnpm: Faster, more efficient disk usage
- npm: Standard, comes with Node.js

### Code Quality Tools

**Linting:**
- ESLint (with Next.js config)
- Prettier (code formatting)

**Type Safety:**
- TypeScript (highly recommended)
- Strict mode enabled

**Testing (Optional for MVP, recommended post-MVP):**
- Vitest (unit tests)
- Playwright (E2E tests)

### Development Environment

**Required:**
- Node.js 18+ (LTS)
- Git
- Code editor (VS Code recommended)

**Recommended VS Code Extensions:**
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Prettier
- ESLint

---

## Monitoring & Analytics

### Error Tracking: **Sentry**
- Free tier: 5,000 errors/month
- Real-time error alerts
- Performance monitoring
- Release tracking

### Analytics: **Plausible** or **Vercel Analytics**

**Plausible:**
- Privacy-friendly (GDPR compliant)
- Simple, lightweight
- $9/month for 10k pageviews

**Vercel Analytics:**
- Free with Vercel hosting
- Web vitals tracking
- Real user monitoring

**Alternative:** Google Analytics 4 (free, but privacy concerns)

### Application Monitoring: **Vercel Monitoring**
- Built into Vercel
- Tracks function execution times
- Shows bandwidth usage
- Free tier included

---

## Development Workflow

### Local Development

```bash
# Clone repository
git clone [repo-url]

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Add Supabase URL and keys
# Add Strava API keys
# Add Spotify API keys

# Run development server
pnpm dev

# Open http://localhost:3000
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

STRAVA_CLIENT_ID=your-client-id
STRAVA_CLIENT_SECRET=your-client-secret

SPOTIFY_CLIENT_ID=your-client-id
SPOTIFY_CLIENT_SECRET=your-client-secret

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Git Workflow

```
main (production)
  └── develop (staging)
       └── feature branches
```

**Branch Naming:**
- `feature/shoe-selector`
- `fix/login-bug`
- `chore/update-dependencies`

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/main.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: pnpm install
      - run: pnpm build
      - run: pnpm lint
```

---

## Cost Estimate (Monthly)

### Free Tier
- **Vercel Hosting**: Free (up to 100GB bandwidth)
- **Supabase**: Free (500MB database, 1GB storage, 2GB file transfers)
- **Strava API**: Free
- **Spotify API**: Free
- **GitHub**: Free (private repos)
- **Sentry**: Free (5k errors/month)

**Total: $0/month** for MVP with light usage

### Growth Stage (1000+ active users)
- **Vercel Pro**: $20/month (if needed for bandwidth)
- **Supabase Pro**: $25/month (8GB database, better performance)
- **Plausible Analytics**: $9/month
- **Domain**: $12/year (~$1/month)
- **Cloudinary**: Free tier likely sufficient, or $89/month for advanced

**Total: ~$55/month** at scale

---

## Security Considerations

### Best Practices

1. **API Keys**: Never commit to Git, use environment variables
2. **Supabase RLS**: Enable row-level security on all tables
3. **Input Validation**: Use Zod for all user inputs
4. **Rate Limiting**: Implement on API routes (Vercel provides basic protection)
5. **HTTPS**: Automatic with Vercel
6. **CORS**: Configure properly for API endpoints
7. **Authentication**: Use Supabase Auth, never roll your own

### Data Privacy

**GDPR Compliance:**
- Allow users to export their data
- Allow users to delete their account and data
- Clear privacy policy
- Cookie consent (if using analytics cookies)

**Data Minimization:**
- Only collect data that's needed
- Anonymous usage where possible
- User controls over data sharing

---

## Scalability Considerations

### Current Architecture Scales To:
- 10,000+ monthly active users
- 100,000+ monthly page views
- 1M+ API requests/month

### When to Upgrade:

**Database:**
- Supabase Pro at 500MB+ database size
- Consider read replicas for heavy traffic

**Hosting:**
- Vercel Pro if exceeding bandwidth limits
- Add CDN caching for static assets

**Search:**
- If song database grows large, add Algolia or Meilisearch
- $1/month for Meilisearch Cloud (500k records)

---

## Alternative Stack Considerations

### If You Want to Go Full Serverless
**Alternative: Firebase**
- NoSQL database (Firestore)
- Built-in auth
- Real-time database
- Cloud functions
- Good free tier

**Pros:** All-in-one Google solution
**Cons:** NoSQL can be limiting, vendor lock-in

### If You Want More Control
**Alternative: Self-hosted**
- **Frontend:** Same (Vercel/Netlify)
- **Backend:** Express.js + Docker + DigitalOcean/Railway
- **Database:** PostgreSQL on managed service

**Pros:** More control, potentially cheaper at scale
**Cons:** More DevOps work, server management

### If You Want Native Mobile
**Alternative: React Native**
- Share code with web (React)
- True native apps
- Better integration with HealthKit/Apple Health

**Pros:** Better mobile experience, app store presence
**Cons:** App store approval, 2-3x development time

---

## Recommended MVP Stack Summary

```
Frontend:
- Next.js 14 (React + TypeScript)
- Tailwind CSS + shadcn/ui
- Framer Motion (animations)
- TanStack Query (data fetching)

Backend:
- Vercel Serverless Functions
- Supabase (PostgreSQL + Auth + Storage)

APIs:
- Strava API
- Spotify API

Hosting:
- Vercel (frontend + API)
- Supabase Cloud (database)

Tools:
- GitHub (version control)
- Sentry (error tracking)
- Plausible or Vercel Analytics

Total Cost: $0 for MVP
```

This stack prioritizes:
✅ Fast development
✅ Minimal operations
✅ Free to start
✅ Easy to scale
✅ Great developer experience
✅ Modern, performant user experience
