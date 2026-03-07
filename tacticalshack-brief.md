# TacticalShack.com — Product Brief v1.0

## Overview

TacticalShack is a precision shooter's utility platform. It helps serious rifle shooters find ranges, locate gunsmiths, track NFA wait times, and verify parts compatibility — all in one place. The goal of V1 is to build a clean, well-structured site framework with placeholder content for each major feature, so that each section can be developed in detail independently.

---

## Tech Stack

- **Frontend**: React + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (via Prisma ORM)
- **Auth**: Clerk or Auth.js (email + Google)
- **Hosting**: Railway (frontend + backend + DB)
- **Repo**: GitHub

---

## Site Structure

### Global Layout
- Fixed top navigation bar with logo (left) and nav links (right)
- Mobile-responsive hamburger menu
- Footer with links to About, Contact, Terms, Privacy
- Consistent page wrapper with max-width container

### Navigation Items (in order)
1. Find a Range
2. Find a Gunsmith
3. NFA Tracker
4. Parts Compatibility
5. Matches & Events *(Phase 2 — include in nav, show "coming soon")*

---

## Pages & Routes

### `/` — Home
- Hero section with tagline and brief description of the platform
- Four feature cards linking to each main section
- Simple search bar (location-based) as the primary CTA
- No complex logic required in V1 — static layout only

---

### `/ranges` — Find a Range
**Purpose**: Help shooters find ranges that match their needs — primarily max shooting distance and location.

**Data model (ranges table)**:
- id, name, slug
- address, city, state, zip, lat, lng
- max_distance_yards (integer)
- range_type (enum: public, private, club, military)
- surface_types (array: grass, gravel, concrete, dirt)
- covered_positions (boolean)
- prone_allowed (boolean)
- steel_targets_allowed (boolean)
- membership_required (boolean)
- day_fee (decimal)
- website, phone, email
- description (text)
- verified (boolean)
- created_at, updated_at

**V1 UI**:
- Search bar (location + distance filter)
- Filter sidebar: max distance, membership required, steel allowed, covered shooting
- Results list with range cards (name, distance, max yardage, city/state)
- Individual range detail page (`/ranges/[slug]`)
- "Claim this listing" CTA on each listing (form only, no logic yet)

---

### `/gunsmiths` — Find a Gunsmith
**Purpose**: Connect shooters with vetted gunsmiths filtered by specialty and location.

**Data model (gunsmiths table)**:
- id, name, slug
- shop_name
- address, city, state, zip, lat, lng
- specialties (array: chassis fitting, barrel work, trigger jobs, suppressor installs, cerakote, action truing, stock work)
- accepts_mail_in (boolean)
- avg_turnaround_weeks (integer)
- website, phone, email
- description (text)
- verified (boolean)
- rating (decimal, computed from reviews)
- created_at, updated_at

**Reviews table**:
- id, gunsmith_id, user_id, rating (1–5), body, created_at

**V1 UI**:
- Search bar (location)
- Filter sidebar: specialty, accepts mail-in, rating minimum
- Results list with gunsmith cards (name, shop, specialties, rating, location)
- Individual gunsmith detail page (`/gunsmiths/[slug]`) with review section
- "Submit a review" form (auth required)
- "Claim this listing" CTA

---

### `/nfa-tracker` — NFA Wait Tracker
**Purpose**: Give NFA buyers visibility into Form 4 wait times by examiner and submission date.

**Data model (nfa_submissions table)**:
- id, user_id
- form_type (enum: Form1, Form4, eForm1, eForm4)
- item_type (enum: suppressor, SBR, SBS, MG, AOW)
- submitted_date
- approved_date (nullable)
- examiner_name (nullable)
- status (enum: pending, approved, denied)
- trust_or_individual (enum)
- notes (text)
- created_at

**V1 UI**:
- Dashboard showing average wait times by form type (computed from submitted data)
- "Log my submission" form for registered users
- Simple chart showing wait time trend over time (recharts)
- Individual submission tracker page for logged-in users
- No external API required — crowdsourced data model

---

### `/compatibility` — Parts Compatibility
**Purpose**: Let shooters check what chassis, barrels, stocks, and accessories fit their action or platform.

**Data model (components table)**:
- id, name, slug, brand
- component_type (enum: action, chassis, barrel, stock, trigger, bottom_metal)
- action_family (e.g. Remington 700, Savage 110, Tikka T3)
- inlet_type (for chassis/stocks)
- thread_pattern (for barrels)
- compatible_with (array of component ids — many-to-many via compatibility_pairs table)
- affiliate_url
- created_at

**compatibility_pairs table**:
- id, component_a_id, component_b_id, verified (boolean), notes

**V1 UI**:
- Start with action/platform selector
- Returns list of compatible components by category
- Each result links to affiliate URL (Brownells, MidwayUSA, etc.)
- "Suggest a compatibility" form for community submissions
- Admin review queue for submitted pairs

---

### `/matches` — Matches & Events *(Phase 2)*
- Route exists, page shows "Coming Soon" with email capture
- Intended feature: searchable calendar of PRS/NRL/local precision rifle matches by state

---

## Auth & User Accounts

- Sign up / log in (email or Google)
- User profile page with:
  - Saved ranges and gunsmiths
  - NFA submissions dashboard
  - Submitted reviews
- No payments in V1

---

## Admin
- Basic admin panel at `/admin` (protected route)
- Tables for: pending listing claims, pending reviews, pending compatibility suggestions
- Simple approve/reject workflow

---

## V1 Scope — What to Build First

Build the shell. Every page should exist with its correct route, layout, navigation, and data model wired up. Seed each section with 10–20 real sample records so the UI is functional and demonstrable. Individual features can then be developed one section at a time.

**Explicit out of scope for V1**:
- Payments / premium listings
- Email notifications
- Mobile app
- Map view (add in V1.1 once listings are populated)
- Match calendar

---

## Design Direction

- Dark, utilitarian aesthetic — think field equipment, not consumer tech
- Color palette: near-black background, warm off-white text, single accent color (olive, burnt orange, or coyote tan)
- Typography: strong, geometric sans-serif (not Inter)
- No stock photography — iconography and data-forward UI instead
- Must be fully mobile responsive from day one
