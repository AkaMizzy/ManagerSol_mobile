## Inventaire Feature Implementation

### Overview
This document details the end-to-end implementation of the Inventaire feature across backend and mobile (Expo) frontend. It covers data model decisions, API endpoints, security, UI/UX, and integration details suitable for a senior developer.

---

## Backend

### Tech Context
- Node.js/Express server (`backend/index.js`)
- MySQL/MariaDB via `pool`
- Auth: request-scoped `req.user` attached by middleware (`middleware/auth`)

### New Routes
File: `backend/routes/inventaireRoutes.js`

- `GET /api/inventaire/zones`
  - Purpose: fetch zones/blocs assigned to the authenticated user (`user_zone` table), enriched with zone metadata.
  - Data source: `user_zone` joined to `zone` and `zone_bloc`.
  - Output enrichment: returns absolute `zone_logo` URL derived from request protocol/host; includes `zone_latitude`, `zone_longitude`.
  - Auth: `requireAuth` (requires `req.user`).

- `GET /api/inventaire/declarations`
  - Purpose: list declarations of type "inventaire".
  - Query: `declaration` joined with `declaration_type` filtered on `title = 'inventaire'`.
  - Auth: `requireAuth`.

- `POST /api/inventaire/create`
  - Purpose: create a new `inventaire_zone` entry linking an inventaire declaration to a zone or a bloc.
  - Request body: `{ id_inventaire: string; id_zone?: string; id_bloc?: string }`
  - Validation: must provide `id_inventaire` and one of `id_zone` or `id_bloc`.
  - Access control: verifies the authenticated user has assignment in `user_zone` for either the zone or bloc.
  - Duplicate prevention: checks uniqueness (`id_inventaire` + zone or bloc) before insert.
  - Auth: `requireAuth`.

- `GET /api/inventaire/user-inventaires`
  - Purpose: list inventaire-zone links visible to current user (via `user_zone`), with titles.
  - Auth: `requireAuth`.

### Query Details and Fixes
- Zones endpoint query selects:
  - `z.title AS zone_title`, `z.id AS zone_id`, `z.logo AS zone_logo`, `z.latitude AS zone_latitude`, `z.longitude AS zone_longitude`
  - `b.intitule AS bloc_title`, `b.id AS bloc_id`
- Absolute asset URLs: the API normalizes `zone_logo` to an absolute URL using `req.protocol` and `req.get('host')`. This enables direct usage by clients, consistent caching, and future CDN.
- Note on bloc logos: bloc entities do not include a logo; only zones do.

### Data Integrity and Constraints
- `inventaire_zone_item` FK corrected to reference `inventaire_zone(id)` (not `declaration(id)`).
- `inventaire_zone` allows nullable `id_zone` and `id_bloc` to support either linkage.

### Security
- All endpoints enforce auth via `requireAuth`.
- Create endpoint verifies user assignment to zone or bloc before insert.

### Example Requests
```bash
curl -H "Authorization: Bearer <token>" \
  http://<host>/api/inventaire/zones | jq

curl -H "Authorization: Bearer <token>" \
  http://<host>/api/inventaire/declarations | jq

curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"id_inventaire":"<declId>", "id_zone":"<zoneId>"}' \
  http://<host>/api/inventaire/create
```

---

## Mobile (Expo) Frontend

### Files Added/Updated
- `services/inventaireService.ts`
  - Endpoints:
    - `getUserZones(token)` → `UserZone[]`
    - `getInventaireDeclarations(token)` → declarations of type inventaire
    - `createInventaireZone(data, token)` → create link
    - `getUserInventaires(token)`
  - Types:
    - `UserZone` includes: `zone_title`, `zone_id`, optional `zone_logo`, `zone_latitude`, `zone_longitude`, and bloc aliases.

- `components/ZoneList.tsx`
  - Modern card layout with logo support (via `expo-image`).
  - Header shows total assigned zones and CTA for new Inventaire.
  - Each item displays zone title and coordinates (`latitude, longitude`) to 6 decimals, if available.
  - Empty state with large icon, call to action.
  - Removed local URL assembly (backend now returns absolute URLs).

- `components/CreateInventaireModal.tsx`
  - Modal to create new `inventaire_zone` with two dropdowns:
    - Zone dropdown (from `user_zone`)
    - Declaration dropdown (filtered by `declaration_type.title = 'inventaire'`)
  - Validation and loading states; simplified content presentation.

- `app/(tabs)/inventaire.tsx`
  - Screen integrates `ZoneList` and `CreateInventaireModal`.
  - Loads zones and declarations in parallel; surfaces error states.
  - Uses `AppHeader` and consistent SafeArea layout.

### UI/UX Principles Applied
- Color palette: Blue `#11224e`, Orange `#f87b1b`, White `#FFFFFF`.
- Cards with elevation, rounded corners, and clean spacing.
- Large, informative empty state.
- Touch-friendly targets and accessible contrast.

### Notable Decisions
- Backend constructs absolute asset URLs for logos to simplify clients and enable caching/CDN.
- Coordinates rendered only when both latitude and longitude are valid numerics.
- Subtitle changed from static labels ("Zone") to geographic coordinates for higher utility.

### Error Handling
- Service-level `makeRequest` throws structured errors (message from API when available).
- Modal validates inputs and surfaces failures via alerts.
- Zone list renders gracefully without coordinates or logos.

---

## API Contracts

### GET /api/inventaire/zones → 200 OK
```json
[
  {
    "id": "<user_zone_id>",
    "id_user": "<user_id>",
    "id_zone": "<zone_id|null>",
    "id_bloc": "<bloc_id|null>",
    "zone_title": "<string|null>",
    "zone_id": "<string|null>",
    "zone_logo": "https://host/uploads/...",
    "zone_latitude": 35.123456,
    "zone_longitude": -5.123456,
    "bloc_title": "<string|null>",
    "bloc_id": "<string|null>",
    "created_at": "<timestamp>"
  }
]
```

### GET /api/inventaire/declarations → 200 OK
```json
[
  { "id": "...", "title": "...", "declaration_type_title": "inventaire" }
]
```

### POST /api/inventaire/create
Request:
```json
{ "id_inventaire": "<decl_id>", "id_zone": "<zone_id>" }
```
Responses:
- 201 Created `{ message, id }`
- 400/403/409/500 with `{ error }`

---

## Testing Checklist
- Auth required for all endpoints (401 without token).
- Zones endpoint returns absolute `zone_logo` when logo path is present.
- Zones include coordinates; frontend displays `lat, lng` to 6 decimals.
- Creating inventaire-zone:
  - Fails when user lacks assignment to provided zone/bloc.
  - Prevents duplicates for same inventaire + zone/bloc pair.
- Modal validates selections and handles loading and failure states.

---

## Future Enhancements
- If user assignments are bloc-only, enrich zones by resolving parent zone via `zone_bloc_zone` (if present) to ensure logo/coords even without `id_zone`.
- Add pagination to zones listing for large datasets.
- Introduce search/filter in Zone dropdown for many assignments.
- Consider signed URLs or CDN for uploads; add long-lived cache headers for `/uploads`.
- Add E2E tests for creation flow and visual snapshot tests for ZoneList.

---

## File Map (Key)
- Backend
  - `backend/routes/inventaireRoutes.js` (new)
  - `backend/index.js` (registered routes)
- Frontend
  - `services/inventaireService.ts` (new)
  - `components/ZoneList.tsx` (new)
  - `components/CreateInventaireModal.tsx` (new)
  - `app/(tabs)/inventaire.tsx` (updated)


