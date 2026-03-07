# Admin API Documentation

## Overview

The Admin API provides a simple login endpoint that authenticates using predefined credentials stored in the server's environment variables. On success it returns a token that must be sent with every admin-protected request.

## Base URL

```
http://localhost:3000/api/v1/admin
```

---

## Endpoints

### Admin Login

**POST** `/api/v1/admin/login`

Validates `username` and `password` against the server's environment variables. Returns an API token on success.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "your_admin_username",
  "password": "your_admin_password"
}
```

**Field Validations:**

| Field | Required | Rules |
|-------|----------|-------|
| `username` | ✅ | Non-empty string |
| `password` | ✅ | Non-empty string |

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your_password"}'
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "your-admin-secret-key",
    "message": "Login successful"
  },
  "meta": {
    "timestamp": "2026-03-07T10:00:00.000Z"
  }
}
```

**Error Response — wrong credentials (403):**
```json
{
  "success": false,
  "error": {
    "message": "Invalid admin credentials"
  }
}
```

**Error Response — missing fields (400):**
```json
{
  "success": false,
  "error": {
    "message": "username: Username is required"
  }
}
```

---

## Using the Token

Once you have the token, include it as the `x-admin-key` header on every admin-protected request:

```
x-admin-key: your-admin-secret-key
```

All admin routes (create/update/delete tours, blogs, etc.) require this header. Requests without it or with a wrong key will receive a `403` response.

---

## Complete Endpoint Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/admin/login` | Public | Authenticate and receive admin token |

---

## Error Codes

| Code | Meaning |
|------|---------|
| `400` | Validation error (missing username or password) |
| `403` | Invalid credentials |
| `500` | Internal server error |

---

## Frontend Integration Example

```javascript
const BASE = 'http://localhost:3000/api/v1';

// ── Login and store token ─────────────────────────────────────
async function adminLogin(username, password) {
  const res = await fetch(`${BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const json = await res.json();

  if (!json.success) {
    throw new Error(json.error.message); // 'Invalid admin credentials'
  }

  // Store securely — sessionStorage keeps it alive for the tab only
  sessionStorage.setItem('adminToken', json.data.token);
  return json.data.token;
}

// ── Helper: build admin headers ───────────────────────────────
function adminHeaders() {
  const token = sessionStorage.getItem('adminToken');
  if (!token) throw new Error('Not logged in as admin');
  return {
    'x-admin-key': token,
    'Content-Type': 'application/json',
  };
}

// ── Example: create a tour (admin-only) ───────────────────────
await fetch(`${BASE}/tours`, {
  method: 'POST',
  headers: adminHeaders(),
  body: JSON.stringify({ title: 'New Tour', ... }),
});

// ── Logout: just clear the stored token ──────────────────────
function adminLogout() {
  sessionStorage.removeItem('adminToken');
}
```

---

## Notes

- Credentials (`ADMIN_USERNAME` and `ADMIN_PASSWORD`) are set in the server's `.env` file and never exposed through the API.
- The returned `token` is the server's `ADMIN_SECRET_KEY`. Treat it like a password — do not commit it or log it.
- Use `sessionStorage` rather than `localStorage` so the token is automatically cleared when the browser tab is closed.
- There is no token expiry — to rotate the key, update `ADMIN_SECRET_KEY` in the server environment and log in again.
