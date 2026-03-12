# TacticalShack — Gunsmiths Feature Build Instructions
## Cursor Prompt: Phase 2 — Gunsmiths

---

## Context

This is the second feature build for TacticalShack.com. The backend, auth, roles, and API key infrastructure are already in place from Phase 1. This phase adds the Gunsmiths feature — including a rich specialty taxonomy that distinguishes rifle vs. handgun focused smiths, FFL verification against the ATF public database, and FFL document download so customers can easily send a gunsmith's FFL to a shipper.

Do not modify any existing auth, user, or ranges infrastructure. Add only what is defined here.

---

## Database Schema Additions (Prisma)

Add the following models to the existing `schema.prisma`. Run `prisma migrate dev --name add-gunsmiths` after.

```prisma
// ─── GUNSMITHS ────────────────────────────────────────────────

model Gunsmith {
  id                    String          @id @default(cuid())
  slug                  String          @unique
  name                  String          // Gunsmith's personal name
  shopName              String?         // Business/shop name if different
  status                GunsmithStatus  @default(PENDING)

  // Ownership
  ownerId               String?
  owner                 User?           @relation("GunsmithOwner", fields: [ownerId], references: [id])
  claimed               Boolean         @default(false)
  claimedAt             DateTime?

  // Location
  address               String
  city                  String
  state                 String
  zip                   String
  country               String          @default("US")
  lat                   Float
  lng                   Float

  // Service area
  acceptsMailIn         Boolean         @default(false)
  mailInOnly            Boolean         @default(false)   // No walk-in, ships only
  serviceRadiusMiles    Int?            // Walk-in service radius if applicable

  // FFL
  hasFfl                Boolean         @default(false)
  fflNumber             String?         // ATF FFL license number (format: XX-XXXXX-XX-XX-XXXXX)
  fflExpiry             DateTime?
  fflVerified           Boolean         @default(false)   // Verified against ATF database
  fflVerifiedAt         DateTime?
  fflLicenseType        FflLicenseType?
  fflFileUrl            String?         // Cloudinary URL of uploaded FFL document (PDF)
  fflAutoDownload       Boolean         @default(false)   // Allow public download without login

  // Primary focus
  primaryFocus          GunsmithFocus   @default(GENERAL)

  // Specialties — stored as string array matching enum values
  specialties           String[]

  // Platforms explicitly worked on
  platformsServiced     String[]        // e.g. ["AR-15", "AR-10", "Remington 700", "Glock", "1911"]

  // Calibers explicitly supported (for rare/exotic work)
  calibersServiced      String[]        // e.g. ["6.5 Creedmoor", "338 Lapua", "50 BMG"]

  // Turnaround
  avgTurnaroundWeeks    Int?
  turnaroundNotes       String?         // Free text: "Currently 8-10 weeks on barrel work"
  rushJobsAvailable     Boolean         @default(false)

  // Pricing transparency
  showsPricing          Boolean         @default(false)
  laborRatePerHour      Decimal?        @db.Decimal(8,2)
  pricingNotes          String?         // e.g. "Free estimates, call first"

  // Credentials & training
  credentials           String[]        // e.g. ["Armorer Certified", "Brownells Trained", "US Army Veteran"]
  yearsExperience       Int?
  insuranceCarried      Boolean         @default(false)

  // Contact
  website               String?
  phone                 String?
  email                 String?
  bookingUrl            String?         // Link to online booking if available

  // Google Places
  googlePlaceId         String?         @unique
  googleRating          Float?
  googleReviewCount     Int?
  googleRatingUpdated   DateTime?

  // Media
  photos                String[]
  heroPhoto             String?

  // Content
  bio                   String?         // Gunsmith's description of their work / background
  adminNotes            String?

  // Metadata
  verified              Boolean         @default(false)
  featured              Boolean         @default(false)
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt

  claims                GunsmithClaim[]
  reviews               Review[]        // Reuse existing Review model (add gunsmithId)
  savedBy               SavedGunsmith[]
}

enum GunsmithStatus {
  PENDING
  ACTIVE
  SUSPENDED
  CLOSED
}

enum GunsmithFocus {
  RIFLE           // Primarily long guns / rifles
  HANDGUN         // Primarily pistols and revolvers
  GENERAL         // Both equally
  SHOTGUN         // Primarily shotguns
  NFA             // Primarily NFA items (suppressors, SBR, MG)
}

enum FflLicenseType {
  TYPE_01   // Dealer in firearms
  TYPE_02   // Pawnbroker
  TYPE_06   // Manufacturer of ammo
  TYPE_07   // Manufacturer of firearms
  TYPE_08   // Importer
  TYPE_09   // Dealer in destructive devices
  TYPE_10   // Manufacturer of destructive devices
  TYPE_11   // Importer of destructive devices
  SOT_02    // SOT Class 2 — manufacturer NFA (most common for gunsmiths)
  SOT_03    // SOT Class 3 — dealer NFA
}

// ─── GUNSMITH CLAIMS ──────────────────────────────────────────

model GunsmithClaim {
  id                String        @id @default(cuid())
  gunsmithId        String
  gunsmith          Gunsmith      @relation(fields: [gunsmithId], references: [id])
  userId            String
  user              User          @relation(fields: [userId], references: [id])
  status            ClaimStatus   @default(PENDING)   // Reuse existing enum

  claimantName      String
  claimantTitle     String
  claimantPhone     String
  claimantEmail     String
  fflNumber         String?       // Can provide FFL during claim for faster verification
  verificationNote  String?
  adminNote         String?
  reviewedAt        DateTime?
  createdAt         DateTime      @default(now())
}

// ─── SAVED GUNSMITHS ──────────────────────────────────────────

model SavedGunsmith {
  id          String    @id @default(cuid())
  userId      String
  gunsmithId  String
  gunsmith    Gunsmith  @relation(fields: [gunsmithId], references: [id])
  createdAt   DateTime  @default(now())

  @@unique([userId, gunsmithId])
}
```

### Update existing Review model

Add `gunsmithId` as an optional field to the existing `Review` model so one review table serves both ranges and gunsmiths:

```prisma
model Review {
  // ... existing fields ...
  rangeId       String?         // Now optional
  range         Range?          @relation(...)
  gunsmithId    String?         // Add this
  gunsmith      Gunsmith?       @relation(fields: [gunsmithId], references: [id])
  // Add constraint: exactly one of rangeId or gunsmithId must be set (enforce in API layer)
}
```

### Update User model

Add to the existing `User` model:
```prisma
ownedGunsmiths    Gunsmith[]      @relation("GunsmithOwner")
gunsmithClaims    GunsmithClaim[]
```

---

## Specialty Taxonomy

Store specialties as a `String[]` on the Gunsmith record. The following is the complete canonical list — use these exact string values in code and seed data. Group them in the UI by category.

### RIFLE SPECIALTIES
```
BARREL_WORK           // Barrel fitting, threading, crowning, fluting
BARREL_CONTOUR        // Custom barrel profiling and turning
CHAMBERING            // Custom chamber reaming, headspace
ACTION_TRUING         // Blueprinting / truing bolt actions
CHASSIS_FITTING       // Chassis and stock inlet fitting
BEDDING               // Pillar and glass bedding
BOLT_WORK             // Bolt face truing, fluting, handle modification
TRIGGER_JOBS_RIFLE    // Trigger adjustment and replacement (rifles)
MUZZLE_DEVICES        // Brake, suppressor mount, flash hider installation
SUPPRESSOR_HOST_WORK  // Threading, baffling, suppressor service
SCOPE_MOUNTING        // Professional scope mounting and lapping
CERAKOTE_RIFLE        // Cerakote / DuraCoat for rifles and components
STOCK_WORK_RIFLE      // Custom stock fitting, inletting, pad fitting
REBARREL              // Complete rebarreling service
RESTOCK               // Complete restocking service
AR_BUILDS             // AR-15 / AR-10 complete builds and repairs
AR_TRIGGER            // AR trigger group work (Geissele, CMC, etc.)
AR_BARREL             // AR barrel fitting, gas system tuning
PRECISION_BUILD       // Full custom precision rifle builds
HUNTING_RIFLE_BUILD   // Hunting rifle builds and setup
AI_PLATFORM           // Accuracy International platform work
TIKKA_PLATFORM        // Tikka T1x / T3x specialist
REMINGTON_700         // Remington 700 / clone specialist
SAVAGE_PLATFORM       // Savage 10/110 specialist
```

### HANDGUN SPECIALTIES
```
1911_WORK             // 1911 / 2011 smithing — fitting, triggers, barrels
GLOCK_WORK            // Glock modifications — trigger, barrel, slide work
SIG_WORK              // SIG Sauer platform work
CZ_WORK               // CZ / Shadow 2 action work
REVOLVER_WORK         // Revolver timing, action jobs, cylinder work
TRIGGER_JOBS_PISTOL   // Trigger work — all semi-auto pistols
BARREL_FITTING_PISTOL // Match barrel fitting (pistols)
SLIDE_MILLING         // Red dot cuts, lightening cuts on slides
FRAME_WORK            // Frame modifications, grip reduction, undercut
STIPPLING             // Frame stippling / texturing
SIGHT_INSTALLATION    // Night sight, fiber optic, red dot installation
CERAKOTE_PISTOL       // Cerakote for pistols and slides
COMPENSATOR_INSTALL   // Compensator fitting and porting
COMPETITION_PISTOL    // Competition pistol builds (USPSA, IDPA, 3-Gun)
CARRY_PISTOL_BUILD    // Carry / defensive pistol builds and refinement
```

### SHOTGUN SPECIALTIES
```
SHOTGUN_WORK          // General shotgun service and repair
CHOKE_WORK            // Choke installation and threading
SHOTGUN_STOCK         // Shotgun stock fitting and modification
SHOTGUN_TRIGGER       // Shotgun trigger work
SHOTGUN_BUILD         // Competition shotgun builds (3-Gun, Skeet, Trap)
```

### NFA / CLASS III
```
SUPPRESSOR_SERVICE    // Suppressor cleaning, repair, baffle replacement
SUPPRESSOR_BUILD      // Custom suppressor manufacturing (SOT required)
SBR_CONVERSION        // Short barrel rifle conversions
SBS_CONVERSION        // Short barrel shotgun conversions
MG_SERVICE            // Machine gun service and repair (SOT required)
FORM_1_BUILDS         // Assist with Form 1 NFA builds
NFA_TRANSFERS         // SOT dealer handling NFA transfers
```

### GENERAL / OTHER
```
CLEANING_SERVICE      // General cleaning and maintenance
GENERAL_REPAIR        // Repairs — any platform
REFINISHING           // Bluing, Parkerizing, traditional refinishing
ENGRAVING             // Decorative engraving
WOOD_STOCK_WORK       // Wood stock repair, refinishing, checkering
LASER_ENGRAVING       // Laser engraving and personalization
APPRAISALS            // Firearm appraisals and valuations
CONSIGNMENT           // Firearm consignment sales
TRANSFERS             // FFL transfers (Type 01/07)
AMMO_RELOADING        // Reloading services
```

---

## FFL Verification System

### How it works

The ATF publishes its Federal Firearms Licensee database as a downloadable file updated monthly. It is public domain data available at:

`https://www.atf.gov/firearms/listing-federal-firearms-licensees`

The file is a pipe-delimited `.txt` download containing every active FFL in the US with license number, business name, address, license type, and expiry date.

### Implementation

**`services/fflVerification.js`** — implement the following:

```js
// downloadFflDatabase()
// Downloads the current ATF FFL file (approx 80MB, pipe-delimited)
// Parses it into a searchable structure
// Stores parsed data in a local cache file or database table
// Should be run monthly via cron job

// verifyFflNumber(fflNumber)
// Looks up an FFL number in the cached dataset
// Returns: { valid: boolean, licenseType, businessName, 
//            city, state, expiry, lastChecked }

// refreshFflCache()
// Admin-triggered or cron — re-downloads and re-parses the ATF file
// Updates the ffl_cache table in the database
```

**Database: `FflCache` table** — store the parsed ATF data:

```prisma
model FflCache {
  id            String    @id @default(cuid())
  fflNumber     String    @unique
  businessName  String
  premisesCity  String
  premisesState String
  licenseType   String
  expiryDate    DateTime
  rawRecord     String    // Full pipe-delimited row for reference
  lastSynced    DateTime  @default(now())
}

model FflSyncLog {
  id          String    @id @default(cuid())
  syncedAt    DateTime  @default(now())
  recordCount Int
  success     Boolean
  errorNote   String?
}
```

**Verification flow when a gunsmith adds or claims a listing:**

1. Gunsmith provides their FFL number during claim or in their profile
2. System calls `verifyFflNumber(fflNumber)` against the local cache
3. If found: sets `fflVerified = true`, populates `fflExpiry` and `fflLicenseType`
4. If not found: marks as unverified, shows admin alert to manually verify
5. Re-verification runs automatically monthly when the ATF file refreshes
6. If a previously verified FFL expires or disappears from the ATF data, `fflVerified` is set back to `false` and the gunsmith is notified via email

**Important note for Cursor:** The ATF FFL file download requires parsing a large pipe-delimited flat file. Use Node.js streams to parse it line by line rather than loading the full file into memory. The FFL number format to match on is: `X-XX-XXX-XX-XX-XXXXX` — normalize to this format before comparison as gunsmiths may enter it with or without dashes.

---

## FFL Document Download

When a gunsmith uploads their FFL document (the physical license copy as a PDF), store it in Cloudinary and enable the following:

**Public download (if `fflAutoDownload = true`):**
- A "Download FFL" button is shown on the gunsmith's public listing
- No login required
- Downloads the PDF directly from Cloudinary
- Button is labeled: "Download FFL (for shipping)"
- Tooltip / helper text: "Send this file to any dealer or shipper transferring a firearm to this gunsmith"

**Private download (if `fflAutoDownload = false`):**
- "Request FFL" button is shown
- Logged-in users can request — sends the gunsmith a notification email
- Gunsmith can then email the FFL directly, or flip the auto-download toggle on

**On the detail page, the FFL section shows:**
```
FFL Status:    ✓ Active  (verified against ATF database)
License Type:  Type 07 / SOT Class 2
License #:     X-XX-XXX-XX-XX-XXXXX
Expires:       December 31, 2025
[Download FFL →]   or   [Request FFL →]
```

If FFL is verified but expired, show a warning badge instead of Active.
If FFL is not verified, show "Unverified — contact gunsmith directly."

---

## Backend API Routes

### Gunsmiths Routes (`/api/gunsmiths`)

```
GET    /api/gunsmiths                     Public — search/filter
GET    /api/gunsmiths/:slug               Public — single detail
POST   /api/gunsmiths                     Auth: ADMIN or AGENT
PUT    /api/gunsmiths/:id                 Auth: GUNSMITH (own) or ADMIN
PATCH  /api/gunsmiths/:id                 Auth: GUNSMITH (own) or ADMIN
DELETE /api/gunsmiths/:id                 Auth: ADMIN
POST   /api/gunsmiths/:id/photos          Auth: GUNSMITH (own) or ADMIN
DELETE /api/gunsmiths/:id/photos/:url     Auth: GUNSMITH (own) or ADMIN
POST   /api/gunsmiths/:id/ffl-upload      Auth: GUNSMITH (own) or ADMIN — upload FFL PDF
DELETE /api/gunsmiths/:id/ffl             Auth: GUNSMITH (own) or ADMIN — remove FFL doc
POST   /api/gunsmiths/:id/verify-ffl      Auth: ADMIN or AGENT — trigger FFL verification
GET    /api/gunsmiths/:id/ffl-download    Public (if autoDownload) or Auth — download FFL
POST   /api/gunsmiths/:id/refresh-google  Auth: ADMIN or AGENT
```

**GET /api/gunsmiths query parameters:**
```
lat, lng              Float — for distance sorting
radiusMiles           Int
state                 String
city                  String
primaryFocus          Enum — RIFLE | HANDGUN | GENERAL | SHOTGUN | NFA
specialties           String[] — filter by one or more specialty codes
platformsServiced     String[] — filter by platform
acceptsMailIn         Boolean
mailInOnly            Boolean
hasFfl                Boolean
fflVerified           Boolean
fflLicenseType        String
maxTurnaroundWeeks    Int
rushJobsAvailable     Boolean
minRating             Float
verified              Boolean
featured              Boolean
search                String — full text on name, shopName, bio, city
page                  Int
limit                 Int (default 20, max 50)
sort                  Enum — distance | rating | turnaround | newest | name
```

### Gunsmith Claims Routes (`/api/gunsmith-claims`)

```
POST   /api/gunsmith-claims                     Auth: any logged-in user
GET    /api/gunsmith-claims                     Auth: ADMIN
GET    /api/gunsmith-claims/:id                 Auth: ADMIN or claim owner
PATCH  /api/gunsmith-claims/:id/approve         Auth: ADMIN
PATCH  /api/gunsmith-claims/:id/reject          Auth: ADMIN
```

On approval:
1. Set `gunsmith.claimed = true`, `gunsmith.ownerId = user.id`
2. Set `user.role = GUNSMITH` (unless already higher role)
3. Trigger FFL verification if FFL number was provided in claim
4. Send confirmation email via Resend
5. Send admin notification

### FFL Admin Routes

```
POST   /api/admin/ffl/sync          ADMIN — trigger ATF database re-download and parse
GET    /api/admin/ffl/sync-log      ADMIN — view sync history
POST   /api/admin/ffl/verify/:id    ADMIN — manually force re-verify a specific gunsmith's FFL
GET    /api/admin/ffl/expiring      ADMIN — list gunsmiths with FFL expiring in next 60 days
```

---

## Frontend Pages

### `/gunsmiths` — Gunsmith Search Page

Layout mirrors the Ranges search page: filter sidebar + results list.

**Search bar:**
- Location input with Google Places Autocomplete
- "Use my location" button
- Radius selector (25 / 50 / 100 / 200 miles / Any)

**Filter sidebar:**

*Focus Area*
- Radio group: All · Rifle · Handgun · General · Shotgun · NFA

*Specialties* (grouped, collapsible by category)
- Rifle Specialties (checkboxes for most common: Action Truing, Barrel Work, Chassis Fitting, Cerakote, Precision Build, etc.)
- Handgun Specialties (1911 Work, Glock Work, Slide Milling, Competition Pistol, etc.)
- NFA (Suppressor Service, SBR Conversion, NFA Transfers)
- Show more / less toggle to avoid overwhelming the sidebar

*Service Options*
- Accepts mail-in (toggle)
- Has active FFL (toggle)
- SOT / Class III capable (toggle)

*Turnaround*
- Max turnaround: 2 weeks / 4 weeks / 8 weeks / 12 weeks / Any

*Rating*
- Minimum: 4+ stars / 4.5+ stars / 5 stars

**Result card shows:**
- Name + shop name
- City, State + distance
- Primary focus badge (RIFLE / HANDGUN / NFA / GENERAL)
- Top 3–4 specialty pills
- Google star rating + our site rating
- Avg turnaround weeks
- FFL badge: "✓ FFL Verified" (if fflVerified = true)
- Accepts mail-in badge
- "Is this your shop? Claim it" if unclaimed

---

### `/gunsmiths/:slug` — Gunsmith Detail Page

**Hero section:**
- Name + shop name
- Photo gallery
- City/State + "Get Directions" link
- Google rating widget
- Primary focus badge
- Quick stats: Avg Turnaround · Years Experience · Accepts Mail-In

**Embedded Google Map** — location pin (same as ranges)

**Detail sections:**

*About*
- Bio / description
- Years experience
- Credentials and training
- Platforms serviced (badges)
- Calibers serviced (if specified)

*Specialties*
- Full list of specialties grouped by category (Rifle / Handgun / NFA / General)
- Each specialty shown as a labeled badge with a short plain-English description on hover

*Service & Pricing*
- Accepts walk-in / mail-in / both
- Rush jobs available
- Avg turnaround weeks + notes
- Labor rate (if disclosed)
- Pricing notes
- Booking URL button (if provided)

*FFL Information*
```
FFL Status:    ✓ Active  [green badge]   or   ⚠ Expired   or   Unverified
License Type:  [human-readable type name]
License #:     [masked: X-XX-XXX-**-**-*****  for privacy, show in full to logged-in users]
Expires:       [date]
[Download FFL →]  (if autoDownload enabled)
[Request FFL →]   (if not autoDownload — logged in required)
```

*Contact*
- Website, phone, email, booking link

*Photos*

*Reviews*
- Community reviews
- "Write a Review" (auth required, one per user)
- Average breakdown

**Owner actions** (GUNSMITH owner or ADMIN):
- Edit Listing
- Manage Photos
- Upload / Replace FFL Document
- Toggle FFL auto-download on/off

**Unclaimed banner** (if not claimed)

---

### `/gunsmiths/:slug/claim` — Gunsmith Claim Form

Fields:
- Full name
- Title / role (Owner, Manager, Employee)
- Phone
- Email
- FFL Number (optional — if provided, system auto-verifies on approval)
- Verification method dropdown: "I own the domain/email for this business" / "I can receive a call at the listed number" / "Other"
- Note

---

### `/dashboard/gunsmiths` — Gunsmith Owner Dashboard

- Lists claimed gunsmith listing(s)
- Stats: profile views, review count, avg rating, FFL status alert if expiring
- Edit button
- FFL expiry warning banner if within 60 days of expiry

---

### `/dashboard/gunsmiths/:id/edit` — Gunsmith Edit Form

Sections matching detail page layout:
- Basic Info (name, shop name, bio, years experience, credentials)
- Location & Service Area (address, accepts mail-in, service radius)
- Specialties (grouped checklist — full taxonomy above)
- Platforms & Calibers (tag input)
- Turnaround & Pricing
- FFL Management (upload PDF, toggle auto-download, view verification status)
- Contact & Booking
- Photos

On save: same partial re-verification logic as ranges (major changes → PENDING, minor → live immediately).

---

### Admin Dashboard Additions

Add a **Gunsmiths** tab to the existing `/admin` dashboard:
- Table of all gunsmiths (status, verified, claimed, FFL status)
- Actions: Approve, Suspend, Edit, Delete

Add a **FFL** tab:
- FFL sync status (last synced, record count)
- "Trigger Sync" button
- Expiring FFLs list (next 60 days)
- Gunsmiths with unverified FFLs

---

## Seed Data

Seed the following in `prisma/seed.js`. These are realistic entries covering the key geographies — BC, Idaho, and Alberta. Set `status: ACTIVE`, `verified: false`.

```js
const gunsmiths = [
  {
    name: "Ryan Callahan",
    shopName: "Cascade Precision Works",
    slug: "cascade-precision-works",
    address: "45750 Yale Rd",
    city: "Chilliwack",
    state: "BC",
    country: "CA",
    zip: "V2P 2N4",
    lat: 49.1578,
    lng: -121.9512,
    primaryFocus: "RIFLE",
    specialties: [
      "ACTION_TRUING", "BARREL_WORK", "CHASSIS_FITTING",
      "BEDDING", "CERAKOTE_RIFLE", "REMINGTON_700",
      "PRECISION_BUILD", "SCOPE_MOUNTING"
    ],
    platformsServiced: ["Remington 700", "Tikka T3x", "Savage 110", "MDT Chassis"],
    hasFfl: true,
    fflNumber: null,
    acceptsMailIn: true,
    avgTurnaroundWeeks: 6,
    turnaroundNotes: "Currently 5–7 weeks on precision builds. Barrel work 2–3 weeks.",
    yearsExperience: 14,
    credentials: ["Brownells Armorer Certified"],
    rushJobsAvailable: false,
    bio: "Precision rifle specialist in the Fraser Valley. Specialize in Remington 700 blueprinting, custom barrel fitting, and MDT chassis work. Built rifles that have won at the provincial level.",
    status: "ACTIVE"
  },
  {
    name: "Dave Hurst",
    shopName: "Interior Arms",
    slug: "interior-arms-kamloops",
    address: "1220 Battle St",
    city: "Kamloops",
    state: "BC",
    country: "CA",
    zip: "V2C 2N4",
    lat: 50.6731,
    lng: -120.3289,
    primaryFocus: "GENERAL",
    specialties: [
      "BARREL_WORK", "ACTION_TRUING", "TRIGGER_JOBS_RIFLE",
      "TRIGGER_JOBS_PISTOL", "GLOCK_WORK", "1911_WORK",
      "CERAKOTE_RIFLE", "CERAKOTE_PISTOL", "GENERAL_REPAIR",
      "TRANSFERS", "CLEANING_SERVICE"
    ],
    platformsServiced: ["Remington 700", "AR-15", "Glock", "1911", "Tikka T3x", "Ruger 10/22"],
    hasFfl: true,
    acceptsMailIn: true,
    avgTurnaroundWeeks: 4,
    turnaroundNotes: "General repair and cleaning 1–2 weeks. Custom work 4–6 weeks.",
    yearsExperience: 22,
    rushJobsAvailable: true,
    fflAutoDownload: false,
    bio: "Full-service gunsmith in Kamloops serving hunters, competitive shooters, and collectors for over 20 years. Rifles and handguns, warranty service for several major brands.",
    status: "ACTIVE"
  },
  {
    name: "Travis Kohl",
    shopName: "Flatland Precision",
    slug: "flatland-precision-lethbridge",
    address: "3217 26 Ave N",
    city: "Lethbridge",
    state: "AB",
    country: "CA",
    zip: "T1H 3R7",
    lat: 49.7128,
    lng: -112.8219,
    primaryFocus: "RIFLE",
    specialties: [
      "PRECISION_BUILD", "ACTION_TRUING", "BARREL_WORK",
      "CHAMBERING", "CHASSIS_FITTING", "BEDDING",
      "SUPPRESSOR_HOST_WORK", "MUZZLE_DEVICES",
      "CERAKOTE_RIFLE", "SCOPE_MOUNTING", "REMINGTON_700",
      "TIKKA_PLATFORM", "SAVAGE_PLATFORM"
    ],
    platformsServiced: ["Remington 700", "Tikka T3x", "Tikka T1x", "Savage 110", "Defiance Actions", "MDT Chassis"],
    hasFfl: false,
    acceptsMailIn: true,
    mailInOnly: false,
    avgTurnaroundWeeks: 8,
    turnaroundNotes: "Full custom builds currently 10–12 weeks. Calling ahead strongly recommended.",
    yearsExperience: 9,
    credentials: ["Competed PRS 2019–2023", "Brownells Trained"],
    rushJobsAvailable: false,
    bio: "Former PRS competitor turned full-time gunsmith. Specialize in building accurate rifles from the ground up for hunters and long range competitors across Alberta. All work is test-fired before return.",
    status: "ACTIVE"
  },
  {
    name: "Mike Sorenson",
    shopName: "Snake River Gun Works",
    slug: "snake-river-gun-works",
    address: "1845 E 17th St",
    city: "Idaho Falls",
    state: "ID",
    country: "US",
    zip: "83404",
    lat: 43.4912,
    lng: -112.0197,
    primaryFocus: "GENERAL",
    specialties: [
      "BARREL_WORK", "ACTION_TRUING", "TRIGGER_JOBS_RIFLE",
      "TRIGGER_JOBS_PISTOL", "1911_WORK", "AR_BUILDS",
      "AR_TRIGGER", "AR_BARREL", "SUPPRESSOR_HOST_WORK",
      "NFA_TRANSFERS", "TRANSFERS", "CERAKOTE_RIFLE",
      "CERAKOTE_PISTOL", "GENERAL_REPAIR", "CLEANING_SERVICE"
    ],
    platformsServiced: [
      "AR-15", "AR-10", "Remington 700", "Savage 110",
      "1911", "Glock", "Ruger", "Winchester Model 70"
    ],
    hasFfl: true,
    fflLicenseType: "TYPE_01",
    fflVerified: false,
    fflAutoDownload: false,
    acceptsMailIn: true,
    avgTurnaroundWeeks: 3,
    turnaroundNotes: "Most work 2–4 weeks. AR builds and custom rifles 6–8 weeks.",
    yearsExperience: 17,
    credentials: ["US Army Veteran", "Armorer Certified — Glock, Colt, Ruger"],
    rushJobsAvailable: true,
    bio: "Full-service FFL gunsmith in Idaho Falls. Military background, certified on multiple platforms. Fast turnaround on most work. NFA transfers welcome.",
    status: "ACTIVE"
  },
  {
    name: "Jason Merritt",
    shopName: "Merritt Competition Pistols",
    slug: "merritt-competition-pistols",
    address: "8820 Chinden Blvd",
    city: "Boise",
    state: "ID",
    country: "US",
    zip: "83714",
    lat: 43.6421,
    lng: -116.2895,
    primaryFocus: "HANDGUN",
    specialties: [
      "1911_WORK", "GLOCK_WORK", "CZ_WORK",
      "TRIGGER_JOBS_PISTOL", "BARREL_FITTING_PISTOL",
      "SLIDE_MILLING", "FRAME_WORK", "STIPPLING",
      "SIGHT_INSTALLATION", "CERAKOTE_PISTOL",
      "COMPENSATOR_INSTALL", "COMPETITION_PISTOL",
      "CARRY_PISTOL_BUILD"
    ],
    platformsServiced: [
      "1911", "2011", "Glock", "CZ Shadow 2",
      "SIG P320", "SIG P226", "Beretta 92"
    ],
    hasFfl: true,
    fflLicenseType: "TYPE_07",
    fflVerified: false,
    fflAutoDownload: true,
    acceptsMailIn: true,
    avgTurnaroundWeeks: 5,
    turnaroundNotes: "Full 2011 builds 10–14 weeks. Trigger jobs and slide work 3–4 weeks.",
    yearsExperience: 12,
    credentials: ["USPSA Master Class", "IDPA Expert"],
    rushJobsAvailable: false,
    bio: "Handgun specialist focused exclusively on competition and carry pistol builds. USPSA Master class shooter. Known for 1911/2011 trigger work and custom Glock builds. Mail-in service nationwide.",
    status: "ACTIVE"
  },
  {
    name: "Glen Forde",
    shopName: "NFA Solutions",
    slug: "nfa-solutions-boise",
    address: "3455 S Gekeler Ln",
    city: "Boise",
    state: "ID",
    country: "US",
    zip: "83706",
    lat: 43.5803,
    lng: -116.1872,
    primaryFocus: "NFA",
    specialties: [
      "SUPPRESSOR_SERVICE", "SUPPRESSOR_BUILD",
      "SBR_CONVERSION", "NFA_TRANSFERS",
      "SUPPRESSOR_HOST_WORK", "MUZZLE_DEVICES",
      "FORM_1_BUILDS", "MG_SERVICE"
    ],
    platformsServiced: [
      "AR-15", "AR-10", "Remington 700",
      "Ruger 10/22", "MP5", "AK Platform"
    ],
    hasFfl: true,
    fflLicenseType: "SOT_02",
    fflVerified: false,
    fflAutoDownload: true,
    acceptsMailIn: true,
    avgTurnaroundWeeks: 2,
    turnaroundNotes: "Most suppressor service within 1–2 weeks. SBR conversions 2–3 weeks.",
    yearsExperience: 8,
    credentials: ["SOT Class 2 Manufacturer", "NFA Trust Specialist"],
    rushJobsAvailable: true,
    bio: "Idaho's NFA specialist. SOT Class 2 manufacturer. We handle suppressor builds, service and repair, SBR/SBS conversions, Form 1 builds, and all NFA item transfers. Walk-ins welcome.",
    status: "ACTIVE"
  }
]
```

---

## Build Order for Cursor

Continue from the existing working codebase. Work in this sequence:

1. **Schema migration** — add Gunsmith, GunsmithClaim, SavedGunsmith, FflCache, FflSyncLog models and update Review model. Run `prisma migrate dev --name add-gunsmiths`.

2. **FFL service** — build `services/fflVerification.js` with the ATF file downloader/parser and `verifyFflNumber()`. Build the FflCache sync. Test against one real FFL number.

3. **Gunsmiths API** — implement all routes in `routes/gunsmiths.js`. Mirror the structure of `routes/ranges.js`.

4. **Gunsmith Claims API** — implement `routes/gunsmith-claims.js`.

5. **FFL admin routes** — add to `routes/admin.js`.

6. **Seed the database** — add the 6 gunsmiths above to `prisma/seed.js` and run.

7. **Gunsmith Search page** — build `/gunsmiths` with the specialty-grouped filter sidebar and result cards.

8. **Gunsmith Detail page** — full detail with all sections, FFL block, embedded map, reviews.

9. **FFL download/request flow** — wire up the download endpoint and the request notification email.

10. **Claim flow** — build `/gunsmiths/:slug/claim` and connect to the claims API with email notifications.

11. **Owner dashboard** — `/dashboard/gunsmiths` and the edit form.

12. **Admin dashboard additions** — Gunsmiths tab and FFL tab in `/admin`.

---

## AI Agent Notes

When the agent is activated, it should be able to:

- `POST /api/gunsmiths` — create a new gunsmith listing from scraped or submitted data
- `POST /api/gunsmiths/:id/verify-ffl` — trigger FFL verification after creation
- `GET /api/admin/ffl/expiring` — monitor upcoming FFL expirations and flag for admin review
- `PATCH /api/gunsmiths/:id` — update details (e.g. update turnaround time from owner-submitted request)
- `GET /api/gunsmith-claims` — review pending claims and surface recommendations to admin

---

## Notes for Cursor

- Reuse all existing auth middleware, role checks, error envelope format, and pagination patterns from the Ranges feature — do not reinvent
- The specialty taxonomy strings are the source of truth — store as `String[]` in the DB, validate against the canonical list in Zod schemas on both client and server
- FFL number normalization: strip all dashes and spaces before storing, reformat for display
- The ATF FFL file is US-only — Canadian gunsmiths will have `hasFfl: false`; do not show FFL UI elements for CA listings
- Never display a full FFL number to unauthenticated users — show masked version publicly, full number to logged-in users and the owner
- The `fflFileUrl` (uploaded PDF) is stored in Cloudinary but served through your own endpoint so you can control access — do not expose the Cloudinary URL directly
