# TacticalShack — Ranges Feature Build Instructions
## Cursor Prompt: Phase 1 — Backend Foundation + Ranges

---

## Context

This is the first real feature build for TacticalShack.com — a precision shooter's utility platform. This phase establishes the **entire backend** that all future features (Gunsmiths, NFA Tracker, Parts Compatibility) will share. Build it properly now so it never needs to be restructured later.

The Ranges feature lets shooters search for shooting ranges by location, distance capability, and facilities. Range owners can claim their listing and edit it. Admins can manage everything. A future AI agent will be given API access to add and manage ranges programmatically.

---

## Full Stack

- **Frontend**: React + Vite + Tailwind CSS + React Router v6
- **Backend**: Node.js + Express (REST API)
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: Clerk (handles email, Google, sessions, JWTs)
- **Maps**: Google Maps JavaScript API (map display) + Google Places API (ratings, autocomplete)
- **File Storage**: Cloudinary (range photos)
- **Email**: Resend (transactional email)
- **Hosting**: Railway (separate services: frontend, backend, postgres)
- **Repo**: GitHub monorepo with `/client` and `/server` folders

---

## Project Structure

```
tacticalshack/
├── client/                   # React + Vite frontend
│   ├── src/
│   │   ├── components/       # Shared UI components
│   │   ├── pages/            # Route-level pages
│   │   │   ├── Home.jsx
│   │   │   ├── ranges/
│   │   │   │   ├── RangeSearch.jsx
│   │   │   │   ├── RangeDetail.jsx
│   │   │   │   ├── RangeClaimForm.jsx
│   │   │   │   └── RangeDashboard.jsx   # Owner edit dashboard
│   │   │   └── admin/
│   │   │       └── AdminDashboard.jsx
│   │   ├── hooks/            # Custom hooks (useAuth, useRanges, etc.)
│   │   ├── lib/              # API client, utils
│   │   └── App.jsx
├── server/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── ranges.js
│   │   │   ├── claims.js
│   │   │   ├── users.js
│   │   │   └── admin.js
│   │   ├── middleware/
│   │   │   ├── auth.js       # Clerk JWT verification
│   │   │   └── roles.js      # Role-based access control
│   │   ├── services/
│   │   │   ├── googlePlaces.js
│   │   │   └── email.js
│   │   └── index.js
│   └── prisma/
│       ├── schema.prisma
│       └── seed.js
```

---

## Database Schema (Prisma)

Define all of this in `schema.prisma`. This schema is designed to support all future features — add only ranges tables for now, but include the user/role infrastructure in full.

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── USERS & ROLES ────────────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  clerkId       String    @unique        // Clerk user ID
  email         String    @unique
  name          String?
  role          Role      @default(USER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  ownedRanges   Range[]   @relation("RangeOwner")
  claims        Claim[]
  reviews       Review[]
  apiKeys       ApiKey[]  // For AI agent access
}

enum Role {
  USER          // Regular shooter — can review, save, log NFA
  RANGE_OWNER   // Can edit their claimed range(s)
  GUNSMITH      // Can edit their claimed gunsmith listing
  ADMIN         // Full access
  AGENT         // AI agent — API key auth, elevated write access
}

// ─── API KEYS (for AI agent) ──────────────────────────────────

model ApiKey {
  id          String    @id @default(cuid())
  key         String    @unique @default(cuid())
  label       String                          // e.g. "Range Seeding Agent"
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  role        Role      @default(AGENT)
  active      Boolean   @default(true)
  lastUsed    DateTime?
  createdAt   DateTime  @default(now())
}

// ─── RANGES ───────────────────────────────────────────────────

model Range {
  id                    String        @id @default(cuid())
  slug                  String        @unique
  name                  String
  status                RangeStatus   @default(PENDING)  // Pending admin approval

  // Ownership
  ownerId               String?
  owner                 User?         @relation("RangeOwner", fields: [ownerId], references: [id])
  claimed               Boolean       @default(false)
  claimedAt             DateTime?

  // Location
  address               String
  city                  String
  state                 String
  zip                   String
  country               String        @default("US")
  lat                   Float
  lng                   Float

  // Google Places integration
  googlePlaceId         String?       @unique
  googleRating          Float?
  googleReviewCount     Int?
  googleRatingUpdated   DateTime?

  // Core specs
  maxDistanceYards      Int           // Max shooting distance
  numberOfLanes         Int?
  rangeType             RangeType     @default(PUBLIC)

  // Surface & position
  surfaceTypes          String[]      // ["grass", "gravel", "concrete", "dirt", "mat"]
  coveredPositions      Boolean       @default(false)
  proneAllowed          Boolean       @default(true)
  benchRests            Boolean       @default(false)
  numberOfBenches       Int?

  // Rules & features
  steelTargetsAllowed   Boolean       @default(false)
  membershipRequired    Boolean       @default(false)
  dayFeeAvailable       Boolean       @default(true)
  dayFeeAmount          Decimal?      @db.Decimal(8,2)
  membershipFeeAnnual   Decimal?      @db.Decimal(8,2)
  rfOfficerRequired     Boolean       @default(false)   // Range officer on duty required
  coldRangeOnly         Boolean       @default(false)   // Hot vs cold range policy

  // Caliber / equipment restrictions
  magRestrictions       String?       // e.g. "No .50 BMG", "No muzzle brakes over X dB"
  suppressorFriendly    Boolean       @default(true)

  // Facilities
  restroomsOnSite       Boolean       @default(false)
  parkingAvailable      Boolean       @default(true)
  roofedShooting        Boolean       @default(false)
  lightingAvailable     Boolean       @default(false)   // Night shooting possible
  targetRentals         Boolean       @default(false)
  ammoAvailable         Boolean       @default(false)
  gunRentals            Boolean       @default(false)
  classesOffered        Boolean       @default(false)
  fflOnSite             Boolean       @default(false)

  // Competitions
  hostsMatches          Boolean       @default(false)
  matchTypes            String[]      // ["PRS", "NRL", "F-Class", "Benchrest", "IPSC", "3-Gun"]
  matchScheduleUrl      String?

  // Hours
  hoursNotes            String?       // Free text: "Dawn to dusk", "Weekends only", etc.
  seasonalClosure       Boolean       @default(false)
  seasonalNotes         String?

  // Contact
  website               String?
  phone                 String?
  email                 String?

  // Media
  photos                String[]      // Cloudinary URLs
  heroPhoto             String?       // Primary listing photo

  // Content
  description           String?       // Owner/admin written description
  adminNotes            String?       // Internal — never shown publicly

  // Metadata
  verified              Boolean       @default(false)   // Admin has verified this listing
  featured              Boolean       @default(false)   // Paid featured placement
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt

  claims                Claim[]
  reviews               Review[]
  savedBy               SavedRange[]
}

enum RangeStatus {
  PENDING     // Just added, awaiting admin review
  ACTIVE      // Live and visible
  SUSPENDED   // Hidden, under review
  CLOSED      // Range permanently closed
}

enum RangeType {
  PUBLIC        // Open to general public
  PRIVATE       // Members only
  CLUB          // Gun club membership required
  COMMERCIAL    // Commercial range (pay per use)
  MILITARY      // Military / LE (for reference only)
}

// ─── CLAIMS ───────────────────────────────────────────────────

model Claim {
  id              String        @id @default(cuid())
  rangeId         String
  range           Range         @relation(fields: [rangeId], references: [id])
  userId          String
  user            User          @relation(fields: [userId], references: [id])
  status          ClaimStatus   @default(PENDING)

  // Verification info submitted by claimant
  claimantName    String
  claimantTitle   String        // e.g. "Range Manager", "Club President"
  claimantPhone   String
  claimantEmail   String
  verificationNote String?      // How they'll prove ownership (domain email, call, etc.)

  adminNote       String?       // Internal note from admin on decision
  reviewedAt      DateTime?
  createdAt       DateTime      @default(now())
}

enum ClaimStatus {
  PENDING
  APPROVED
  REJECTED
}

// ─── REVIEWS ──────────────────────────────────────────────────

model Review {
  id          String    @id @default(cuid())
  rangeId     String
  range       Range     @relation(fields: [rangeId], references: [id])
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  rating      Int       // 1–5
  body        String
  visitDate   DateTime?
  helpful     Int       @default(0)
  flagged     Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([rangeId, userId])   // One review per user per range
}

// ─── SAVED RANGES ─────────────────────────────────────────────

model SavedRange {
  id        String    @id @default(cuid())
  userId    String
  rangeId   String
  range     Range     @relation(fields: [rangeId], references: [id])
  createdAt DateTime  @default(now())

  @@unique([userId, rangeId])
}
```

---

## Backend API Routes

### Authentication Middleware

Every protected route runs through two middleware functions:

**`middleware/auth.js`** — Verify Clerk JWT or API key:
```js
// Supports both Clerk session tokens (web users) and 
// Bearer API keys (AI agent). Sets req.user on success.
```

**`middleware/roles.js`** — Role-based access:
```js
// requireRole('ADMIN') — admin only
// requireRole('RANGE_OWNER', 'ADMIN') — owner or admin
// requireRole('AGENT', 'ADMIN') — AI agent or admin
```

---

### Ranges Routes (`/api/ranges`)

```
GET    /api/ranges                    Public — search/filter ranges
GET    /api/ranges/:slug              Public — single range detail
POST   /api/ranges                    Auth: ADMIN or AGENT — create range
PUT    /api/ranges/:id                Auth: RANGE_OWNER (own) or ADMIN — full update
PATCH  /api/ranges/:id                Auth: RANGE_OWNER (own) or ADMIN — partial update
DELETE /api/ranges/:id                Auth: ADMIN only
POST   /api/ranges/:id/photos         Auth: RANGE_OWNER (own) or ADMIN — upload photos
DELETE /api/ranges/:id/photos/:url    Auth: RANGE_OWNER (own) or ADMIN
POST   /api/ranges/:id/refresh-google Auth: ADMIN or AGENT — pull fresh Google rating
```

**GET /api/ranges query parameters:**
```
lat, lng          Float — user's location for distance sorting
radiusMiles       Int — filter by distance from lat/lng
state             String — filter by state/province
minDistance       Int — minimum max shooting distance (yards)
maxDistance       Int — maximum max shooting distance (yards)  
rangeType         Enum — PUBLIC | PRIVATE | CLUB | COMMERCIAL
steelAllowed      Boolean
proneAllowed      Boolean
covered           Boolean
membershipRequired Boolean
hostsMatches      Boolean
matchType         String — filter by match type hosted
suppressorFriendly Boolean
dayFeeAvailable   Boolean
verified          Boolean
featured          Boolean
search            String — full text search on name, city, description
page              Int — pagination
limit             Int — results per page (default 20, max 50)
sort              Enum — distance | rating | newest | name
```

---

### Claims Routes (`/api/claims`)

```
POST   /api/claims                    Auth: any logged-in user — submit claim
GET    /api/claims                    Auth: ADMIN — list all claims
GET    /api/claims/:id                Auth: ADMIN or claim owner
PATCH  /api/claims/:id/approve        Auth: ADMIN — approve + assign RANGE_OWNER role
PATCH  /api/claims/:id/reject         Auth: ADMIN — reject with note
```

On claim approval:
1. Set `range.claimed = true`, `range.ownerId = user.id`, `range.claimedAt = now()`
2. Set `user.role = RANGE_OWNER` (unless already ADMIN)
3. Send confirmation email to claimant via Resend
4. Send notification email to admin

---

### Reviews Routes (`/api/reviews`)

```
GET    /api/reviews?rangeId=:id       Public — get reviews for a range
POST   /api/reviews                   Auth: USER+ — submit review
PUT    /api/reviews/:id               Auth: review author — edit own review
DELETE /api/reviews/:id               Auth: review author or ADMIN
POST   /api/reviews/:id/helpful       Auth: USER+ — mark as helpful
POST   /api/reviews/:id/flag          Auth: USER+ — flag for review
```

---

### Admin Routes (`/api/admin`)

```
GET    /api/admin/ranges              ADMIN — all ranges including PENDING
PATCH  /api/admin/ranges/:id/approve  ADMIN — set status to ACTIVE
PATCH  /api/admin/ranges/:id/suspend  ADMIN — set status to SUSPENDED
GET    /api/admin/claims              ADMIN — all pending claims
GET    /api/admin/stats               ADMIN — dashboard stats
POST   /api/admin/apikeys             ADMIN — generate API key for agent
DELETE /api/admin/apikeys/:id         ADMIN — revoke API key
```

---

## Google Places Integration

In `services/googlePlaces.js`, implement two functions:

**`findPlaceByName(name, address)`**
- Calls Google Places Text Search API
- Returns `place_id`, `rating`, `user_ratings_total`
- Used when creating a new range to auto-link Google data

**`refreshRatingById(googlePlaceId)`**
- Calls Google Places Details API
- Returns current `rating` and `user_ratings_total`
- Called by the refresh endpoint and on a weekly cron job

Store the `googlePlaceId` on the range record. Cache ratings in the DB — don't call the API on every page load. Refresh weekly via a simple cron job (`node-cron`).

On the range detail page, show:
- Google star rating (numeric + visual stars)
- Review count
- "View on Google Maps" link
- Embedded Google Map showing the range pin

The Google Map embed on the range detail page uses the **Maps JavaScript API** with a single marker. On the search results page, add a toggleable map view (later phase) showing all results as pins.

---

## Frontend Pages

### `/ranges` — Range Search Page

Layout: filter sidebar (left) + results list (right) + optional map toggle (top right)

**Search bar** at top:
- Location input with Google Places Autocomplete (city/zip/address)
- "Use my location" button (browser geolocation)
- Max distance slider (100 / 200 / 300 / 500 / 600 / 1000 / Any)

**Filter sidebar:**
- Range Type (checkboxes: Public, Club, Commercial)
- Min shooting distance (dropdown)
- Steel targets allowed (toggle)
- Prone shooting allowed (toggle)
- Covered positions (toggle)
- Membership not required (toggle)
- Hosts matches (toggle)
- Match type (multi-select: PRS, NRL, F-Class, etc.)
- Suppressor friendly (toggle)
- Verified only (toggle)

**Result card** shows:
- Range name + verified badge (if verified)
- City, State + distance from search location
- Max shooting distance (large, prominent)
- Range type badge
- Feature pills (Steel OK, Prone, Covered, Hosts PRS, etc.)
- Google star rating + review count
- Day fee amount (if available)
- Claim badge if unclaimed: "Is this your range? Claim it"

**Sort options:** Distance · Highest Rated · Max Distance · Newest

---

### `/ranges/:slug` — Range Detail Page

**Hero section:**
- Range name, verified badge
- Photo gallery (or placeholder if no photos)
- Address + "Get Directions" (opens Google Maps)
- Google rating widget (stars + count + "See Google Reviews" link)
- Our site review score
- Quick stats bar: Max Distance · Type · Day Fee · Membership

**Embedded Google Map** — full width, showing range location pin

**Detail sections (tabbed or stacked):**

*Shooting Conditions*
- Max distance, number of lanes, surface types
- Prone allowed, covered positions, bench rests
- Cold/hot range policy, RO required

*Rules & Access*
- Membership required + annual fee
- Day fee amount
- Steel targets, caliber restrictions
- Suppressor friendly

*Facilities*
- Restrooms, parking, roofed shooting
- Night shooting / lighting
- Target rentals, ammo sales, gun rentals
- Classes offered, FFL on site

*Matches & Competitions*
- Hosts matches: Yes/No
- Match types hosted
- Link to match schedule (if provided)

*Hours*
- Hours notes (free text)
- Seasonal closure info

*Contact*
- Website, phone, email (shown only if provided)

*Photos*
- Photo grid (Cloudinary URLs)

*Reviews*
- Community reviews with rating, body, visit date
- "Write a Review" button (requires login)
- Average rating breakdown

**Owner Actions** (shown only to verified owner or admin):
- "Edit This Listing" button → `/ranges/:slug/edit`
- "Manage Photos" button
- Last updated date

**Unclaimed banner** (shown if not claimed):
> "Is this your range? Claim this listing to manage your information, respond to reviews, and add photos."
> [Claim This Range →]

---

### `/ranges/:slug/claim` — Claim Form Page

Simple form collecting:
- Claimant full name
- Title / role at the range
- Phone number
- Email address (must match a domain-email format ideally)
- How they'll verify (dropdown: "I manage the range's website/email", "I can receive a call", "Other")
- Optional note

On submit: creates a `Claim` record with status PENDING, sends email to admin, shows confirmation screen.

---

### `/dashboard/ranges` — Range Owner Dashboard

Protected route — only accessible to users with `RANGE_OWNER` or `ADMIN` role.

Shows:
- List of ranges the owner manages
- Quick stats per range: views this month, review count, avg rating
- Edit button per range

---

### `/dashboard/ranges/:id/edit` — Range Edit Form

Full form matching all range fields. Organized in the same sections as the detail page (Shooting Conditions, Rules & Access, Facilities, etc.).

Only editable fields appear — some fields (lat/lng, slug, verified status) are admin-only.

On save: `PATCH /api/ranges/:id` — triggers status change to `PENDING` if major fields changed, so admin can re-verify. Minor edits (hours, phone, website) save without re-verification.

Photo management: upload new photos (Cloudinary), reorder, delete, set hero.

---

### `/admin` — Admin Dashboard

Protected route — ADMIN only.

Tabs:
- **Ranges** — table of all ranges with status, verified, claimed, created date. Actions: Approve, Suspend, Edit, Delete
- **Claims** — table of pending claims. Actions: View details, Approve, Reject (with note)
- **Reviews** — flagged reviews queue
- **API Keys** — manage agent API keys (create, label, revoke)
- **Stats** — total ranges, total claims pending, total reviews, ranges by state

---

## Seed Data

In `prisma/seed.js`, seed the following real ranges. Set `status: ACTIVE` and `verified: false` on all seeds (they're real but not yet verified by us):

```js
const ranges = [
  {
    name: "Chilliwack Fish & Game Protective Association",
    slug: "chilliwack-fish-game",
    address: "44000 Yale Rd W",
    city: "Chilliwack",
    state: "BC",
    zip: "V2R 4H4",
    country: "CA",
    lat: 49.1628,
    lng: -121.9544,
    maxDistanceYards: 200,
    rangeType: "CLUB",
    membershipRequired: true,
    proneAllowed: true,
    coveredPositions: true,
    steelTargetsAllowed: false,
    suppressorFriendly: true,
    restroomsOnSite: true,
    parkingAvailable: true,
    description: "Local fish and game club with rifle and pistol ranges available to members.",
    status: "ACTIVE"
  },
  {
    name: "Silver Star Shooting Range",
    slug: "silver-star-shooting-range",
    address: "Silver Star Mountain",
    city: "Vernon",
    state: "BC",
    zip: "V1B 3M1",
    country: "CA",
    lat: 50.3592,
    lng: -119.0614,
    maxDistanceYards: 300,
    rangeType: "PUBLIC",
    membershipRequired: false,
    dayFeeAvailable: true,
    proneAllowed: true,
    steelTargetsAllowed: true,
    suppressorFriendly: true,
    hostsMatches: false,
    description: "Outdoor shooting range in the BC Interior. Public access, multiple distances.",
    status: "ACTIVE"
  },
  {
    name: "Kamloops Rifle and Revolver Club",
    slug: "kamloops-rifle-revolver-club",
    address: "955 Holt St",
    city: "Kamloops",
    state: "BC",
    zip: "V2H 1G6",
    country: "CA",
    lat: 50.6745,
    lng: -120.3273,
    maxDistanceYards: 600,
    rangeType: "CLUB",
    membershipRequired: true,
    proneAllowed: true,
    coveredPositions: true,
    steelTargetsAllowed: true,
    suppressorFriendly: true,
    hostsMatches: true,
    matchTypes: ["F-Class", "Benchrest"],
    restroomsOnSite: true,
    parkingAvailable: true,
    description: "One of BC's premier rifle clubs, with ranges from 100 to 600 yards. Hosts F-Class and benchrest competitions.",
    status: "ACTIVE"
  },
  {
    name: "Bald Butte Shooting Range",
    slug: "bald-butte-shooting-range",
    address: "Bald Butte Rd",
    city: "Idaho Falls",
    state: "ID",
    zip: "83401",
    country: "US",
    lat: 43.5406,
    lng: -112.0341,
    maxDistanceYards: 1000,
    rangeType: "PUBLIC",
    membershipRequired: false,
    dayFeeAvailable: false,
    proneAllowed: true,
    steelTargetsAllowed: true,
    suppressorFriendly: true,
    hostsMatches: false,
    description: "Public BLM land shooting area outside Idaho Falls. Open to 1000 yards. Bring your own targets.",
    status: "ACTIVE"
  },
  {
    name: "Palisades Creek Shooting Range",
    slug: "palisades-creek-shooting-range",
    address: "Palisades Creek Rd",
    city: "Swan Valley",
    state: "ID",
    zip: "83449",
    country: "US",
    lat: 43.4088,
    lng: -111.2756,
    maxDistanceYards: 600,
    rangeType: "PUBLIC",
    membershipRequired: false,
    proneAllowed: true,
    steelTargetsAllowed: true,
    suppressorFriendly: true,
    description: "USFS managed shooting range near Swan Valley. Multiple shooting distances up to 600 yards.",
    status: "ACTIVE"
  },
  {
    name: "Lethbridge Rifle and Revolver Club",
    slug: "lethbridge-rifle-revolver-club",
    address: "Range Rd 21-4",
    city: "Lethbridge",
    state: "AB",
    zip: "T1J 4P4",
    country: "CA",
    lat: 49.7390,
    lng: -112.8480,
    maxDistanceYards: 600,
    rangeType: "CLUB",
    membershipRequired: true,
    proneAllowed: true,
    coveredPositions: false,
    steelTargetsAllowed: true,
    suppressorFriendly: true,
    hostsMatches: true,
    matchTypes: ["PRS", "F-Class"],
    restroomsOnSite: true,
    parkingAvailable: true,
    description: "Active shooting club in southern Alberta hosting precision rifle and F-Class events.",
    status: "ACTIVE"
  }
]
```

---

## Environment Variables

```env
# Server
DATABASE_URL=
PORT=3001
NODE_ENV=development

# Clerk
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=

# Google
GOOGLE_MAPS_API_KEY=
GOOGLE_PLACES_API_KEY=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Resend (email)
RESEND_API_KEY=
EMAIL_FROM=noreply@tacticalshack.com
ADMIN_EMAIL=admin@tacticalshack.com
```

---

## AI Agent Architecture (Build-Ready, Activate Later)

The backend is designed from day one to support an AI agent. Do not build the agent yet, but ensure these are in place:

**API Key auth** is already in the auth middleware — any request with `Authorization: Bearer <apikey>` where the key exists in the `ApiKey` table with `role: AGENT` is authenticated as that agent user.

**Agent-accessible endpoints** (already defined above):
- `POST /api/ranges` — create new range
- `PATCH /api/ranges/:id` — update range details
- `POST /api/ranges/:id/refresh-google` — pull Google rating
- `GET /api/admin/claims` — view pending claims
- `PATCH /api/claims/:id/approve` or `/reject` — process claims (ADMIN key required)

**When the agent is built**, it will be a separate Claude-powered service that:
1. Accepts a range name + location as input
2. Calls Google Places API to find details
3. Structures the data into the Range schema
4. Posts to `POST /api/ranges` using its API key
5. Can also poll pending claims and draft approval/rejection recommendations for admin review

The agent key is created in the Admin dashboard and stored in `.env` of the agent service.

---

## Build Order for Cursor

Work through this in sequence — do not skip ahead:

1. **Initialize monorepo** — set up `/client` (Vite + React + Tailwind + React Router) and `/server` (Express + Prisma). Connect to Railway Postgres. Run `prisma migrate dev` with the schema above.

2. **Auth layer** — install Clerk in both client and server. Implement `middleware/auth.js` (supports both Clerk JWT and API key Bearer tokens) and `middleware/roles.js`.

3. **Seed the database** — run `prisma/seed.js` with the 6 ranges above.

4. **Ranges API** — implement all routes in `routes/ranges.js`. Start with GET (search + detail). Add POST/PUT/PATCH/DELETE after.

5. **Google Places service** — implement `services/googlePlaces.js`. Wire up the refresh endpoint. Run it against the seeded ranges to populate `googlePlaceId` and `googleRating`.

6. **Range Search page** — build `/ranges` with location search, filters, and result cards. Connect to API.

7. **Range Detail page** — build `/ranges/:slug` with all sections, embedded map, Google rating widget, and review section.

8. **Reviews** — implement review routes and wire up the form on the detail page.

9. **Claim flow** — build the claim form page and the claims API routes. Wire up the admin approval flow and Resend emails.

10. **Owner dashboard** — build `/dashboard/ranges` and the edit form at `/dashboard/ranges/:id/edit`.

11. **Admin dashboard** — build `/admin` with the ranges, claims, reviews, and API keys tabs.

12. **Deploy to Railway** — set up three Railway services: client (static), server (node), postgres. Configure environment variables. Set up custom domain on tacticalshack.com.

---

## Notes for Cursor

- Use **Tailwind CSS only** for styling — no component libraries unless explicitly noted
- Follow the dark utilitarian aesthetic established in the framework HTML — dark backgrounds, off-white text, burnt orange accent (#c8622a), Barlow Condensed for headings
- All API responses follow the same envelope: `{ success: true, data: {...} }` or `{ success: false, error: "message" }`
- All list endpoints return: `{ success: true, data: [...], meta: { total, page, limit } }`
- Validate all inputs with **Zod** on both client and server
- Use **React Query (TanStack Query)** for all data fetching on the client
- Every database write should be wrapped in a try/catch with proper error logging
- Never expose `adminNotes` or internal fields in public API responses
