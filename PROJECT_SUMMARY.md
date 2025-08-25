## TrackSol (ManagerSol) – Architecture and Implementation Summary

### 1 Product Overview
TrackSol is a construction-focused management app (Expo React Native) backed by a Node/Express + MySQL API. It supports user auth, company-scoped data, declarations/actions, zones/modules, and a calendar for planning activities (audits, corrective actions, declarations, sampling, inventory).

Primary experiences:
- Mobile app (Expo) for field users: login, dashboard, calendar (create/list events), declarations, profile.
- REST backend (Express) with MySQL connection pooling and simple auth token attach.

Color palette: white (#FFFFFF), blue (#11224e), accent orange (#f87b1b).

---

### 2 Repository Structure (high-level)

```
MangerSol/               # Web admin + backend project
  backend/               # Node/Express API
    db/db.js             # mysql2 pool (dateStrings enabled)
    index.js             # Express app, CORS, static uploads, route mounting
    middleware/auth.js   # Attaches req.user from Bearer token (id:timestamp)
    routes/              # Modular routers (auth, users, company, declarations, calendar, ...)
    uploads/             # Uploaded files (logos, photos)

ManagerSol/              # Expo React Native app
  app/                   # expo-router structure
    (auth)/login.tsx     # Login screen (redesigned)
    (tabs)/              # Tabs (dashboard, tasks, declaration, profile)
      index.tsx          # Dashboard with month calendar + events
      profile.tsx        # Profile (redesigned)
    config/api.ts        # BASE_URL config
  components/            # Reusable UI
    CalendarComp.tsx     # Month calendar with event indicators
    CreateCalendarEventModal.tsx # Event creation modal (date/time pickers)
    DayEventsModal.tsx   # Day sheet with event list (icons + time)
    EventDetailsModal.tsx# Detailed event view (fetches /calendar/:id)
  constants/Calendar.ts  # Centralized calendar contexts (label + icon)
  services/calendarService.ts # API calls (create, fetch)
```

---

### 3 Backend Highlights (Express + MySQL)

- DB connection: `mysql2` pool with `dateStrings: true` to avoid TZ shifts when returning DATE/DATETIME as strings.
- Auth: `middleware/auth.js` reads Bearer token (base64 `id:timestamp`), loads user via DB, sets `req.user`.
- CORS: permissive; uploads served under `/uploads`.

#### Calendar API (key routes)
- `GET /calendar?date=YYYY-MM-DD` or `start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` (optional `context`)
  - Company-scoped, user-scoped for `role=user`.
  - Returns rows with `c.*` plus creator `firstname, lastname`.
- `GET /calendar/:id` – details for a single event (company/user scoped).
- `POST /calendar` – create event (validates context, date `YYYY-MM-DD`, optional time `HH:MM[:SS]`, checks start<end).
- `PUT /calendar/:id` – partial update with validation.
- `DELETE /calendar/:id` – delete event after permission checks.

Validation notes:
- Contexts are one of: `declaration_anomalie`, `action_corrective`, `audit_zone`, `prelevement_echantillon`, `inventaire_article`.
- Date: plain `YYYY-MM-DD` string (no TZ handling across layers).
- Time: `HH:MM` or `HH:MM:SS`. If both provided, `heur_fin` must be after `heur_debut`.

Security/scoping:
- All calendar queries scope by `id_company`.
- For `role=user`, additional `AND c.id_user = ?` filter.

Other routes present: users, companies, declarations, actions, zones, modules, etc.

---

### 4 Mobile App Highlights (Expo + TypeScript)

#### Auth
- `contexts/AuthContext.tsx`: stores token/user in AsyncStorage; only `role='user'` can login on mobile. Auth header set as `Authorization: Bearer <token>`.

#### Calendar (Dashboard)
- `components/CalendarComp.tsx`
  - 6×7 month grid (Monday-first).
  - Day cell shows date number + up to three tiny colored dots (context indicators), and `+N` for overflow.
  - Indicators use `eventsByDate[YYYY-MM-DD]` (array of context strings). Keys are generated via `formatDateKey(date)` to avoid TZ-off-by-one.
  - Emits `onMonthChange(startIso, endIso)` so the parent can fetch events for the visible month.
  - Emits `onDayPress(dateIso)` to open the daily sheet.

- `app/(tabs)/index.tsx` (Dashboard)
  - Loads events per month from `GET /calendar?start_date&end_date` and builds `eventsByDate` map.
  - `CreateCalendarEventModal`: opens via "+ Create Event". On submit, calls `POST /calendar` using `services/calendarService.ts`. Optimistically updates `eventsByDate` for the selected date.
  - `DayEventsModal`: opens on day press; loads day’s events and lists them with context icons and time chips.
  - `EventDetailsModal`: opens on event tap; fetches `/calendar/:id` and shows full details (context icon, title, date, time, module, function, company, creator, description). Animated entry.

#### UI/UX improvements
- Tab bar: custom, absolute positioned, Android spacing fixes, content bottom padding resolved.
- Calendar visual fixes: 7 columns per row with stable sizing; indicators aligned; off-by-one bugs eliminated by staying on string dates end-to-end.
- Create Event modal: unified date/time picking via `react-native-modal-datetime-picker`; inputs styled as touchable pills; validation with alerts.
- DayEvents modal: refined cards (icon, badges, time chip) with subtle animations.
- Login page redesigned: brand logo, construction-themed hero, refined inputs and CTA.
- Profile tab redesigned: header card (avatar/name/role), quick actions, tidy menu list.

---

### 5 Contexts & Icons (single source of truth)

`constants/Calendar.ts` contains:
- `CALENDAR_CONTEXTS`: array of `{ value, label, icon: require(...) }` used by both the Day list and Event details.
- This ensures consistent labeling and iconography across the app.

---

### 6 Date & Time Strategy (No Timezone Surprises)

- Backend: `dateStrings: true` in MySQL pool ensures DATE/DATETIME/TIMESTAMP are returned as strings; no implicit UTC conversion.
- Frontend: use date keys and payloads as plain strings `YYYY-MM-DD`. Avoid `new Date('YYYY-MM-DD')`/`toISOString()` for calendar days.
- Indicators and lists use local-format helpers and never apply timezone math to dates.

---

### 7 Notable Implementation Details

- Calendar grid logic: `buildMonthGrid(year, month)` produces a fixed 42-cell view starting on Monday with trailing/leading days.
- Event indicators: color-coded via `contextToColor()`, placed inside `indicatorsRow` at the bottom of each day cell.
- Fetch loop fix: `onMonthChange` effect depends only on `visibleMonth` to prevent infinite re-fetching when handler identity changes.
- SQL string mutation error fix: changed `const sql/checkSql` to `let` where `+=` is used.

---

### 8 End-to-End Flow (Calendar)

1. User opens Dashboard → Calendar renders current month.
2. `CalendarComp` emits `onMonthChange` with month bounds.
3. Dashboard fetches events, builds `eventsByDate` and passes to Calendar.
4. User taps a day → Dashboard fetches that day’s events, opens `DayEventsModal`.
5. User taps an event → `EventDetailsModal` fetches `/calendar/:id` and displays details.
6. User creates a new event → POST `/calendar` succeeds → `eventsByDate[date]` is updated optimistically → dot appears instantly.



---

### 10 Quick Dev Notes

- API base: `app/config/api.ts` (ngrok for dev). Ensure tunnel exposes `/uploads` for images (context icons are bundled, not remote).
- Respect company/user scoping on the API. Mobile is for `role='user'` by design.
- Keep design tokens: blue `#11224e`, orange `#f87b1b`, neutral grays. Maintain high contrast and minimal chrome.


