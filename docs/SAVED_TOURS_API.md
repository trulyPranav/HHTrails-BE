# Saved Tours API Documentation

## Overview

Authenticated users can save tours to their personal list and remove them at any time. The saved list returns full tour objects so no second request is needed to render tour cards.

## Base URL

```
http://localhost:3000/api/v1/saved-tours
```

## Authentication

**All endpoints require a valid user JWT** obtained from signing in via the Auth API.

```
Authorization: Bearer <user_access_token>
```

---

## Endpoints

### 1. Get Saved Tours (Authenticated)

**GET** `/api/v1/saved-tours`

Returns all tours saved by the currently authenticated user, ordered by most recently saved first. Each entry includes the full tour object — no second request needed.

**Headers:**
```
Authorization: Bearer <user_access_token>
```

**Example Request:**
```bash
curl http://localhost:3000/api/v1/saved-tours \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "savedTours": [
      {
        "savedId": "uuid",
        "savedAt": "2026-03-01T10:00:00.000Z",
        "tour": {
          "id": "uuid",
          "title": "Spiti Valley Circuit",
          "description": null,
          "region": "Spiti",
          "types": ["Photography", "Village"],
          "season": "Summer",
          "durationDays": 9,
          "durationNights": 8,
          "photoUrl": "https://example.com/spiti.jpg",
          "isCustom": false,
          "isDescriptionFilled": true,
          "createdAt": "2026-02-20T08:00:00.000Z",
          "updatedAt": "2026-02-25T12:00:00.000Z"
        }
      },
      {
        "savedId": "uuid",
        "savedAt": "2026-02-28T15:30:00.000Z",
        "tour": {
          "id": "uuid",
          "title": "Kashmir Great Lakes",
          "description": null,
          "region": "Kashmir",
          "types": ["Heritage", "Cultural"],
          "season": "Summer",
          "durationDays": 7,
          "durationNights": 6,
          "photoUrl": "https://example.com/kashmir.jpg",
          "isCustom": false,
          "isDescriptionFilled": false,
          "createdAt": "2026-02-18T08:00:00.000Z",
          "updatedAt": "2026-02-18T08:00:00.000Z"
        }
      }
    ]
  },
  "meta": {
    "timestamp": "2026-03-01T10:00:00.000Z"
  }
}
```

> Returns `savedTours: []` if the user has no saved tours.

**Error Response (401) — Missing or invalid token:**
```json
{
  "success": false,
  "error": {
    "message": "No valid authorization token provided"
  }
}
```

---

### 2. Save a Tour (Authenticated)

**POST** `/api/v1/saved-tours/:tourId`

Save a tour to the authenticated user's list.

**Headers:**
```
Authorization: Bearer <user_access_token>
```

**URL Parameter:**
- `tourId` — UUID of the tour to save

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/v1/saved-tours/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "savedId": "uuid",
    "tourId": "123e4567-e89b-12d3-a456-426614174000",
    "savedAt": "2026-03-01T10:00:00.000Z"
  },
  "meta": {
    "timestamp": "2026-03-01T10:00:00.000Z"
  }
}
```

**Error Response (404) — Tour does not exist:**
```json
{
  "success": false,
  "error": {
    "message": "Tour not found"
  }
}
```

**Error Response (409) — Already saved:**
```json
{
  "success": false,
  "error": {
    "message": "Tour is already saved"
  }
}
```

---

### 3. Remove a Saved Tour (Authenticated)

**DELETE** `/api/v1/saved-tours/:tourId`

Remove a tour from the authenticated user's saved list.

**Headers:**
```
Authorization: Bearer <user_access_token>
```

**URL Parameter:**
- `tourId` — UUID of the tour to unsave

**Example Request:**
```bash
curl -X DELETE http://localhost:3000/api/v1/saved-tours/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Tour removed from saved list"
  },
  "meta": {
    "timestamp": "2026-03-01T10:00:00.000Z"
  }
}
```

**Error Response (404) — Tour was not in the saved list:**
```json
{
  "success": false,
  "error": {
    "message": "Saved tour not found"
  }
}
```

---

## Complete Endpoint Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/saved-tours` | User JWT | Get all saved tours with full tour data |
| `POST` | `/api/v1/saved-tours/:tourId` | User JWT | Save a tour |
| `DELETE` | `/api/v1/saved-tours/:tourId` | User JWT | Remove a saved tour |

---

## Error Codes

| Code | Meaning |
|------|---------|
| `400` | Validation error (invalid UUID format) |
| `401` | Missing or expired user token |
| `404` | Tour not found / tour was not saved |
| `409` | Tour is already saved |
| `500` | Internal server error |
| `503` | Service unavailable (database connectivity issue) |

---

## Database Migration

Run the following file in your Supabase SQL Editor:

```
supabase/migrations/005_saved_tours.sql
```

The migration creates:
- `saved_tours` table with `user_id` and `tour_id` foreign keys
- Unique constraint on `(user_id, tour_id)` — a user cannot save the same tour twice
- Index on `user_id` for fast lookup
- RLS policies — users can only read, insert, and delete their own rows
- Cascade deletes — removing a tour or a user automatically removes all related saved rows

---

## Frontend Integration Example

```javascript
const BASE = 'http://localhost:3000/api/v1/saved-tours';

// The access token comes from your auth sign-in response
const token = localStorage.getItem('access_token'); // or from your auth state

const authHeaders = {
  'Authorization': `Bearer ${token}`,
};

// ── Fetch saved tours (e.g. on profile / wishlist page) ───────
const res = await fetch(BASE, { headers: authHeaders });
const { data: { savedTours } } = await res.json();
// Each item has savedId, savedAt, and the full tour object

// ── Check if a specific tour is saved ─────────────────────────
const isSaved = savedTours.some(s => s.tour.id === tourId);

// ── Save a tour (e.g. clicking the bookmark icon) ─────────────
const res = await fetch(`${BASE}/${tourId}`, {
  method: 'POST',
  headers: authHeaders,
});

if (res.status === 409) {
  console.log('Already saved');
}

// ── Remove a saved tour (e.g. clicking the bookmark icon again)
const res = await fetch(`${BASE}/${tourId}`, {
  method: 'DELETE',
  headers: authHeaders,
});
```

---

## Notes

- The user token is the Supabase **access token** returned by the sign-in endpoints (`/api/v1/auth/login` or `/api/v1/auth/google`). It expires after 1 hour — use the refresh token flow to get a new one.
- `savedId` is the UUID of the `saved_tours` row itself (useful if you ever need to reference it directly). `tourId` inside the `tour` object is the actual tour UUID.
- Deleting a tour (admin action) automatically removes it from **all** users' saved lists via the database cascade — no extra cleanup needed.
- All timestamps are ISO 8601 UTC.
