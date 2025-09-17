# QualiPhoto — Feature Guide

This guide documents the QualiPhoto feature end-to-end: data flow, backend APIs, mobile UI/UX, and usage.

- Purpose: capture and browse quality photos per project/zone.
- Scope: Backend Express API, Expo/React Native screens and modal, filtering and pagination.

---

## High-level Flow

1. User opens the QualiPhoto tab (gallery).
2. App loads Projects. When a Project is selected, the app loads its Zones.
3. User can filter by Project or by Zone (Zone takes precedence if selected).
4. User can tap Create to open the modal, capture a photo, and submit it with metadata.
5. Gallery supports pagination and pull-to-refresh.

---

## Backend API

File: `backend/routes/qualiphotoRoutes.js`

### Auth and Access
- All endpoints require authentication (`requireAuth`).
- Results are company-scoped via `JOIN project p` with `p.id_company = req.user.company_id`.

### Storage and Validation
- `multer` stores images in `/uploads/qualiphoto` (created if missing).
- Allowed types: jpeg, jpg, png, webp, gif. Max size: 15MB.
- Image URLs are normalized to absolute via `normalizePhotoUrl(req, relativePath)`.

### Endpoints

#### POST `/qualiphoto`
Create a new QualiPhoto.

- Form-data fields:
  - `photo` (file, required)
  - `id_zone` (string, required)
  - `id_project` (string, optional; must match the zone’s project if provided)
  - `commentaire` (string, optional)
  - `date_taken` (string `YYYY-MM-DD HH:mm:SS`, optional; normalized to MySQL datetime)
- Validates that the zone belongs to a project within the user’s company.
- Response 201 example:
```json
{
  "id_project": "<uuid>",
  "id_zone": "<uuid>",
  "photo": "https://host/uploads/qualiphoto/qualiphoto-...jpg",
  "commentaire": null,
  "date_taken": null
}
```

Example:
```bash
curl -X POST "https://api.example.com/qualiphoto" \
  -H "Authorization: Bearer <TOKEN>" \
  -F "photo=@/path/to/image.jpg" \
  -F "id_zone=<ZONE_ID>" \
  -F "commentaire=Optional" \
  -F "date_taken=2025-09-17 10:25:00"
```

#### GET `/qualiphoto`
List photos with optional filters and pagination.

- Query:
  - `id_project` (optional)
  - `id_zone` (optional)
  - `page` (default 1)
  - `limit` (default 20, max 100)
- Response 200 example:
```json
{
  "items": [
    {
      "id": "<uuid>",
      "id_project": "<uuid>",
      "id_zone": "<uuid>",
      "photo": "https://...",
      "commentaire": null,
      "date_taken": "2025-09-17 10:25:00",
      "project_title": "Project A",
      "zone_title": "Zone 1"
    }
  ],
  "page": 1,
  "limit": 30,
  "total": 123
}
```

#### GET `/projects/:projectId/zones`
Zones for a given project (company-scoped).

- Response: `[{ id, title, code, logo? }]` (logo URL normalized).

---

## Mobile — Gallery Screen

File: `app/(tabs)/qualiphoto.tsx`

### Responsibilities
- Load and display photos in a 2-column grid with infinite scroll and pull-to-refresh.
- Provide filters:
  - Project dropdown → loads Zones
  - Zone dropdown (enabled after Project)
- Keep a modern, consistent header UI similar to the Declarations screen.

### Key State
- `photos`, `page`, `limit`, `total`, `isLoading`, `isRefreshing`.
- `projects`, `zones`, `loadingProjects`, `loadingZones`.
- `selectedProject`, `selectedZone`, dropdown open states.

### Data Loading Logic
- On mount: fetch projects.
- On project change: clear `selectedZone`, fetch zones for that project.
- Listing rules:
  - If `selectedZone` is set → call GET `/qualiphoto?id_zone=<id>`
  - Else if `selectedProject` is set → call GET `/qualiphoto?id_project=<id>`
  - Else → call GET `/qualiphoto` without filters
- Pagination: increases `page`; server returns `items` and `total`.
- Refresh: resets to page 1 and reloads.

### Header & Filters UI
- Two-tier header:
  - Top row: left icon + subtitle (e.g., `N photos`), right: `Create` button.
  - Second row: Project and Zone selects.
- Selects have white background, `#E5E5EA` borders, 12 radius, subtle shadow; menus are scrollable with hairline dividers.
- `Create` opens the creation modal.

---

## Mobile — Create Modal

File: `components/CreateQualiPhotoModal.tsx`

### Responsibilities
- Allow selecting Project, then Zone.
- Capture photo via camera; optional date and comment.
- Validate inputs before submit.

### Key State
- `projects`, `zones`, `selectedProject`, `selectedZone`.
- `photo`, `dateTaken`, `comment`, `submitting`, error banner.
- Dropdown open states and date picker state.

### Behavior
- On open: fetch projects, close dropdowns, prefill `dateTaken`.
- When project changes: fetch zones and clear selected zone.
- Submit: POST `/qualiphoto` with multipart form.
- Success: returns created payload; modal calls `onSuccess` and resets.

---

## Types (client expectations)

- `QualiPhotoItem`: `{ id, id_project, id_zone, photo, commentaire?, date_taken?, project_title?, zone_title? }`
- `QualiProject`: `{ id, title, ... }`
- `QualiZone`: `{ id, title, code, logo? }`

---

## UX Notes & Accessibility
- Dropdowns show “All projects” / “All zones” to clear filters quickly.
- Zone dropdown disabled until a Project is selected.
- Buttons and selects expose `accessibilityRole="button"` and labels.
- Touch targets sized ~44px height; readable 14px text.

---

## Error Handling & Edge Cases
- 401/403: ensure token is valid; user must belong to the company of target data.
- 400 validation: zone not accessible, mismatched `id_project`, invalid date.
- Multer errors: file too large or unsupported type.
- Empty states: no projects/zones/photos → display informative messages.

---

## Quick Reference

- Create: POST `/qualiphoto` (multipart: `photo`, `id_zone`, optional `id_project`, `commentaire`, `date_taken`).
- List: GET `/qualiphoto` with `id_project` or `id_zone`, plus pagination.
- Zones by project: GET `/projects/:projectId/zones`.
- Mobile files: `app/(tabs)/qualiphoto.tsx`, `components/CreateQualiPhotoModal.tsx`.
- Backend file: `backend/routes/qualiphotoRoutes.js`.

If you extend the feature (edit/delete photo), follow existing patterns: auth, company scoping, input validation, safe file handling, and normalized URLs.
