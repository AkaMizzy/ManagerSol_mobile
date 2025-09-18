# QualiPhoto — Feature Guide

This guide documents the QualiPhoto feature end-to-end: data flow, backend APIs, mobile UI/UX, and usage.

- Purpose: capture and browse quality photos per project/zone, with optional voice notes.
- Scope: Backend Express API, Expo/React Native screens and modal, filtering, and pagination.

---

## High-level Flow

1.  User opens the QualiPhoto tab (gallery).
2.  App loads Projects. User filters by a Project, which then loads the Zones for that project.
3.  User must select both a Project and a Zone to enable photo creation.
4.  User taps the "Create" icon to open the modal. The modal is pre-filled with the selected project and zone.
5.  User captures a photo, and can optionally record a voice note, add a comment, and set the date.
6.  Gallery supports pagination and pull-to-refresh.

---

## Backend API

File: `backend/routes/qualiphotoRoutes.js` (mounted at `/api`)

### Auth and Access
- All endpoints require authentication (`requireAuth`).
- Results are company-scoped via `JOIN project p` with `p.id_company = req.user.company_id`.

### Storage and Validation
- `multer` stores images in `/uploads/qualiphoto` and voice notes in `/uploads/qualiphoto/voice_notes`.
- Allowed image types: jpeg, jpg, png, webp, gif. Max size: 15MB.
- Allowed audio types: mp3, m4a, wav, aac. Max size: 15MB.
- URLs are normalized to absolute via `normalizePhotoUrl(req, relativePath)`.

### Endpoints

#### POST `/qualiphoto`
Create a new QualiPhoto.

- Form-data fields:
  - `photo` (file, required)
  - `voice_note` (file, optional)
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
  "date_taken": null,
  "voice_note": "https://host/uploads/qualiphoto/voice_notes/voicenote-...m4a"
}
```

Example:
```bash
curl -X POST "https://api.example.com/api/qualiphoto" \
  -H "Authorization: Bearer <TOKEN>" \
  -F "photo=@/path/to/image.jpg" \
  -F "voice_note=@/path/to/audio.m4a" \
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
      "voice_note": "https://...",
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
- Provide filters for Project and Zone.
- **Enforce filter selection**: The create button is disabled until both a project and a zone are selected.
- Keep a modern, consistent header UI.

### Data Loading Logic
- On mount: fetch projects.
- On project change: clear `selectedZone`, fetch zones for that project.
- Selecting "All Projects" now correctly clears both the project and zone filters.
- Listing rules:
  - If `selectedZone` is set → call GET `/qualiphoto?id_zone=<id>`
  - Else if `selectedProject` is set → call GET `/qualiphoto?id_project=<id>`
  - Else → call GET `/qualiphoto` without filters
- Pagination: increases `page`; server returns `items` and `total`.
- Refresh: resets to page 1 and reloads.

### Header & Filters UI
- A simple header displays an icon and photo count.
- A second row contains the Project and Zone dropdowns, followed by the "Create" icon button.
- A hint text appears below the filters, prompting the user to select both before creating a photo.

---

## Mobile — Create Modal

File: `components/CreateQualiPhotoModal.tsx`

### Responsibilities
- **Receive filter context**: Opens with the project and zone pre-selected and disabled, based on the gallery screen's filters.
- Capture a photo via the camera.
- **Record a voice note**: Allows the user to record, play back, and re-record an optional voice memo.
- Handles optional date and comment inputs.
- Wraps content in a `KeyboardAvoidingView` to prevent the keyboard from hiding inputs.

### Behavior
- On open: pre-fills `dateTaken` and inherits `selectedProject` and `selectedZone` from the gallery. The project and zone dropdowns are disabled.
- When the comment field is focused, the view automatically scrolls to keep it visible.
- Submit: `POST /api/qualiphoto` with a multipart form containing the photo and optional voice note.
- Success: returns the created payload; modal calls `onSuccess` and resets its state.

---

## Types (client expectations)

- `QualiPhotoItem`: `{ id, id_project, id_zone, photo, commentaire?, date_taken?, project_title?, zone_title?, voice_note? }`
- `QualiProject`: `{ id, title, ... }`
- `QualiZone`: `{ id, title, code, logo? }`

---

## UX Notes & Accessibility
- **Enforced Workflow**: Users must select a project and zone before the "Create" button is enabled. This ensures all new photos have the correct context.
- **Seamless Creation**: The modal inherits the filter context, so users don't have to re-select the project and zone.
- **Keyboard Management**: The create modal automatically adjusts its layout to keep the focused input visible when the keyboard is open.

---

## Quick Reference

- Create: POST `/api/qualiphoto` (multipart: `photo`, `id_zone`, optional `voice_note`, `id_project`, `commentaire`, `date_taken`).
- List: GET `/api/qualiphoto` with `id_project` or `id_zone`, plus pagination.
- Zones by project: GET `/api/projects/:projectId/zones`.
- Mobile files: `app/(tabs)/qualiphoto.tsx`, `components/CreateQualiPhotoModal.tsx`.
- Backend file: `backend/routes/qualiphotoRoutes.js`.

