## TrackSol (ManagerSol) – Architecture and Implementation Summary

### 1. Product Overview
TrackSol is a construction-focused field app (Expo React Native) backed by a Node/Express + MySQL API. It enables authenticated company users to create and manage declarations, corrective actions, audits, samples, inventory items, and calendarized work.

- Mobile app (Expo) for field users: login, dashboard (calendar), declarations, tasks (actions), and more.
- REST backend (Express) with MySQL pooling and auth middleware; static uploads for images.
- Company scoping for data access; user scoping where appropriate.

Brand/color palette
- Background: `#FFFFFF`
- Main: `#11224e` (blue)
- Accent: `#f87b1b` (orange)

---

### 2. Monorepo Structure (high level)

```
MangerSol/                 # Backend (Node/Express) + potential web admin
  backend/
    db/db.js               # mysql2 pool (dateStrings enabled)
    index.js               # Express app, CORS, static `/uploads`, routers mount
    middleware/auth.js     # Bearer token -> attaches `req.user`
    routes/
      declarationRoutes.js
      declarationActionRoutes.js
      zoneRoutes.js        # Ensures zone.logo paths saved under /uploads/zones
      ...                  # other domain routers
    uploads/
      actions/             # action photos
      declarations/        # declaration photos
      chats/               # chat photos
      zones/               # zone logos

ManagerSol/                # Mobile app (Expo + TypeScript)
  app/
    (auth)/login.tsx
    (tabs)/
      _layout.tsx          # Tab navigator (uses CustomTabBar)
      index.tsx            # Dashboard (calendar)
      declaration.tsx      # Declarations list/search
      tasks.tsx            # Tasks: Actions created-by/assigned-to
      audit.tsx            # Placeholder screen
      echantillon.tsx      # Placeholder screen
      inventaire.tsx       # Placeholder screen
      profile.tsx          # Profile (still accessible via header nav)
    config/api.ts          # BASE_URL (must expose `/uploads`)
  components/
    ActionsModal.tsx       # Create/list/update actions for a declaration
    CalendarComp.tsx       # Month grid with indicators
    CreateCalendarEventModal.tsx
    DayEventsModal.tsx
    EventDetailsModal.tsx
    CreateDeclarationModal.tsx
    DeclarationCard.tsx
    CustomTabBar.tsx       # Custom PNG icons for tabs
  constants/Calendar.ts    # Contexts metadata (value, label, icon)
  contexts/AuthContext.tsx # Auth state; injects Authorization header
  services/
    calendarService.ts
    declarationService.ts
  types/
    declaration.ts         # Shared types across app
```

---

### 3. Backend Highlights (Express + MySQL)

- DB: `mysql2` pool with `dateStrings: true` so DATE/DATETIME return as strings (no TZ drift).
- Auth: `middleware/auth.js` decodes Bearer token (`id:timestamp`), loads user, populates `req.user` including `company_id`.
- Static: `/uploads/**` exposed for images (zones, actions, declarations, chats).

#### Declarations API
- `POST /declarations` (auth): now requires and persists `title` in addition to `id_declaration_type`, `id_zone`, `description`, optional `severite`. Inserts with user’s `id_company`.
- `GET /declarations` (auth): returns `d.*` plus `declaration_type_title`, `zone_title`, with photo and chat counts aggregated.
- `GET /declarations/:id` (auth): returns full details with photos and chats.

#### Declaration Actions API
- Column rename: `id_user_validateur` → `assigned_to` across SELECT/INSERT/UPDATE.
- `GET /declarations/:id/actions` (auth): actions for a specific declaration, returns creator/assignee names and `company_title`.
- `POST /declarations/:id/actions` (auth, multipart): create action (optional `photo`), supports `id_zone`, `assigned_to`, plans execution dates, `sort_order`.
- `PUT /declarations/:id/actions/:actionId` (auth, multipart): partial update (replace/remove photo, update fields incl. `assigned_to`).
- `DELETE /declarations/:id/actions/:actionId` (auth): delete after ownership check.
- Company-scoped users for assignment: `GET /company-users` (auth) → active users with same `company_id` as requester.
- Task feeds:
  - `GET /my-actions` (auth): actions where `id_user = req.user.id` with joins for names, `company_title`, `zone_title`.
  - `GET /assigned-actions` (auth): actions where `assigned_to = req.user.id` with the same enrichments.

#### Zones API
- `GET /zones` returns `z.*` including `logo` (normalized `'/uploads/zones/...'`).
- Logos saved consistently on create/update.

---

### 4. Mobile App Highlights (Expo + TypeScript)

#### Global
- TypeScript-first, functional components, descriptive names.
- Color system adheres to: background white, blue main `#11224e`, accent orange `#f87b1b`.

#### Declarations
- `CreateDeclarationModal.tsx`
  - Adds required `title` input (validated) above declaration type selector.
  - Zone dropdown shows zone name + logo (parent and children when relevant).
- `DeclarationCard.tsx`
  - Displays `declaration.title` as primary heading; `declaration_type_title` demoted to secondary text.
- `app/(tabs)/declaration.tsx`
  - Header search bar filters declarations by `title` (case-insensitive); empty state reflects filtering.

#### Actions (per Declaration)
- `ActionsModal.tsx`
  - Search bar filters by action `title`.
  - Create Action form includes:
    - Zone selector defaulting to declaration’s parent zone; shows children with visual hierarchy and logos.
    - Company-scoped user selector for `assigned_to` (from `/company-users`).
    - Photo attach (ImagePicker), planned/execution dates.
  - Action list cards with improved readability: creator and assignee on separate lines; optional photo; dates section.
  - Action details modal shows people, dates (`date_planification`, `date_execution`), context (`zone_title`, `company_title`), and status.
  - Update flow: edit modal reuses the same modern styling, triggers API `PUT`, and supports updating zone, dates, assignment, description, title, and photo.

#### Tasks (My Actions / Assigned to Me)
- `app/(tabs)/tasks.tsx`
  - Two-tab layout: "Created by me" and "Assigned to me"; each action opens details; supports updating using the same edit UI style as `ActionsModal`.
  - Fetches data via `declarationService.getMyActions` and `getAssignedActions`.
  - Uses the same company user selector and zone logic for edits.
  - Card alignment/spacing corrected; buttons within details modal centered and bordered for crisp alignment.

#### Calendar (Dashboard)
- `CalendarComp.tsx` renders a stable 6×7 grid with string-based day keys; day indicators reflect event contexts.
- `index.tsx` manages monthly fetching and event aggregation; integrates creation and day details modals.

#### Navigation and Branding
- `CustomTabBar.tsx` renders branded PNG icons for all tabs except Home (Ionicons retained). Full-color icons preserved (no tint); inactive state uses opacity.
- `_layout.tsx` includes new tabs (Audit, Echantillon, Inventaire); Profile tab removed from bar (access via header).
- `app/(tabs)/index.tsx` header redesigned to show app logo + name (TrackSol) on the left, notification and profile icons on the right; user name removed for cleaner layout; larger logo.

---

### 5. Shared Types (ManagerSol/types/declaration.ts)

- `Zone` expanded: `logo?: string | null`, `id?: string`, `level?: number | null`.
- `Declaration` and `CreateDeclarationData`: added required `title`.
- `DeclarationAction` and `CreateActionData`:
  - Renamed `id_user_validateur` → `assigned_to`.
  - Added `company_title?: string | null`, `zone_title?: string | null`, optional `id_zone`.
  - Exposed derived names: `creator_firstname/lastname`, `assigned_firstname/lastname`.
- `CompanyUser` interface: `{ id, firstname, lastname, email, role? }` used for assignment pickers.

---

### 6. Services (ManagerSol/services/declarationService.ts)

- `createDeclaration(data)`: now sends `title`.
- `createAction(declarationId, data)`: sends `assigned_to` and optional `photo` (FormData); supports JSON payload.
- `updateAction(declarationId, actionId, data)`: `PUT` with support for JSON or FormData to replace/remove photo.
- `getMyActions()` and `getAssignedActions()` feed the Tasks screen.

---

### 7. UI/UX Patterns and Styling Conventions

- Inputs: white background, subtle gray borders `#E5E5EA`, 10px radius, compact vertical padding.
- Dropdowns: composed of a header (chevron, selected preview) and a box list with checkmark for current selection; child zones visually indented and may display logos.
- Primary actions: green CTA `#34C759` for submit/update; secondary actions use bordered buttons colored by purpose (e.g., orange `#f87b1b`).
- Spacing: container padding 16; card padding 16; consistent gaps between rows.
- Action details modal: sectioned layout (People, Dates, Context) with uppercase section headers and right-aligned values.

---

### 8. Security, Scoping, and Validation

- All mutating endpoints check ownership (e.g., declarations must belong to `req.user.id`).
- Company scoping: actions and users tied to `req.user.company_id`; assignment list filtered via `/company-users`.
- Images validated by MIME type; size-limited (10 MB) via Multer.
- Mobile app injects `Authorization: Bearer <token>` from `AuthContext`.

---

### 9. Developer Notes & Gotchas

- Dates are plain strings (`YYYY-MM-DD`) end-to-end for calendar and actions planning; do not use `toISOString()` for day-only flows.
- Ensure your dev BASE_URL in `app/config/api.ts` exposes `/uploads` to render photos/logos.
- Custom TabBar uses PNGs with full color; avoid `tintColor`, prefer opacity for inactive state.
- Keep imports consistent: `declarationService` is a default export.
- Zone logos are server-hosted; build URIs as `${BASE_URL}${logo}`.

---

### 10. Pending/Next Work

- Implement "Add mini action" (sub-action via `id_parent_action`) from Action Details, reusing the existing create/edit patterns with parent linkage.
- Calendar enhancement (future): color full day cells by context instead of dots (design to be finalized).

---

### 11. End-to-End Flows (Quick Reference)

Declarations
1) Create declaration → `POST /declarations` (title + type + zone + description) → card lists with title-first, search by title in header.
2) Open declaration → `ActionsModal` shows actions; filter by title; create action with zone/assignee/dates/photo.
3) Tap action → details modal → Update opens edit modal → `PUT /declarations/:id/actions/:actionId`.

Tasks
1) Open Tasks tab → two lists (created-by-me, assigned-to-me) fetched via dedicated endpoints.
2) Tap any card → details modal (update, add mini action placeholder) → update uses same edit UI.

Calendar
1) Dashboard loads month events → day tap opens daily list → event tap opens details; create modal supports planning.

---

### 12. API Base and Configuration

- `ManagerSol/app/config/api.ts` holds `BASE_URL`.
- The backend serves uploaded media at `${BASE_URL}/uploads/...`.
- Ensure networking (ngrok/tunnel) exposes the backend for mobile testing.


