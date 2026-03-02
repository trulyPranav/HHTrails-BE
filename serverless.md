# Serverless Status Report

This document audits every function, API endpoint, and infrastructure component in the HHTrails-BE project for serverless compatibility.

---

## Summary

| Category | Serverless-Ready | Notes |
|---|---|---|
| Application runtime (Express server) | ❌ No | Runs as a persistent HTTP server |
| Database (Supabase/PostgreSQL) | ✅ Yes | Managed, serverless-compatible BaaS |
| Authentication (Supabase Auth) | ✅ Yes | Managed auth service |
| API endpoints (controllers) | ❌ No | Bound to the persistent Express process |
| Middleware | ❌ No | Tied to the Express request lifecycle |

**Overall status: ⚠️ Not Serverless**

The backend is built on a traditional **Express.js HTTP server** (`src/index.ts` calls `app.listen(PORT)`), which keeps a persistent Node.js process alive. None of the API endpoints or controller functions run as independent, on-demand serverless functions. The Supabase backend (database + auth) is the only layer that is inherently serverless/managed.

---

## Infrastructure

### Entry Point – `src/index.ts`

| Component | Serverless? | Details |
|---|---|---|
| HTTP server (`app.listen`) | ❌ No | Starts and keeps a persistent TCP listener |
| Graceful shutdown (`SIGTERM`, `SIGINT`) | ❌ No | Server-process lifecycle management |
| Unhandled rejection / exception handlers | ❌ No | Long-lived process concerns |

### Application Setup – `src/app.ts`

> ℹ️ In the tables below, **"❌ No (needs wrapper)"** means the component contains stateless, per-request logic that is inherently compatible with serverless execution, but is currently bound to the Express process and requires a `serverless-http` adapter to run as a serverless function. **"❌ No (needs refactor)"** means additional logic changes are required beyond just the wrapper.

| Component | Serverless? | Details |
|---|---|---|
| Express application instance | ❌ No (needs wrapper) | Persistent in-memory app state; resolved by wrapping with `serverless-http` |
| Helmet middleware | ❌ No (needs wrapper) | Stateless, per-request; logic is fully compatible — only the Express binding needs the wrapper |
| CORS middleware | ❌ No (needs wrapper) | Stateless, per-request; logic is fully compatible — only the Express binding needs the wrapper |
| Rate limiter (`express-rate-limit`) | ❌ No (needs refactor) | Uses in-memory store; **requires** an external store (e.g., Redis/Upstash) for correctness across multiple serverless instances |
| Morgan request logger | ❌ No (needs wrapper) | Stateless, per-request; logic is fully compatible — only the Express binding needs the wrapper |
| Body parser | ❌ No (needs wrapper) | Stateless, per-request; logic is fully compatible — only the Express binding needs the wrapper |
| Root `GET /` endpoint | ❌ No (needs wrapper) | Stateless inline handler; works as-is once wrapped |
| 404 catch-all handler | ❌ No (needs wrapper) | Stateless inline handler; works as-is once wrapped |
| Error handler middleware | ❌ No (needs wrapper) | Stateless error-formatting logic; works as-is once wrapped |

### Configuration – `src/config/`

| File | Serverless? | Details |
|---|---|---|
| `env.ts` | ✅ Compatible | Reads environment variables; works in any runtime |
| `supabase.ts` | ✅ Compatible | Creates Supabase SDK clients; works in serverless with cold-start considerations |

---

## API Endpoints

### Health Check – `GET /api/health`

| Endpoint | Serverless? | Details |
|---|---|---|
| `GET /api/health` | ❌ No | Inline route handler in `src/routes/index.ts`; runs inside persistent Express server |

---

### Auth – `src/routes/v1/auth.routes.ts` → `src/controllers/auth.controller.ts`

| Endpoint | Method | Auth | Serverless? | Details |
|---|---|---|---|---|
| `/api/v1/auth/signup` | POST | Public | ❌ No | `AuthController.signUp` – delegates to Supabase Auth; logic is stateless but runs in Express |
| `/api/v1/auth/signin` | POST | Public | ❌ No | `AuthController.signIn` – delegates to Supabase Auth |
| `/api/v1/auth/google` | POST | Public | ❌ No | `AuthController.googleAuth` – validates Google ID token via Supabase |
| `/api/v1/auth/google/url` | GET | Public | ❌ No | `AuthController.getGoogleAuthUrl` – generates OAuth redirect URL |
| `/api/v1/auth/signout` | POST | Bearer JWT | ❌ No | `AuthController.signOut` – invalidates session via Supabase Admin |
| `/api/v1/auth/me` | GET | Bearer JWT | ❌ No | `AuthController.getCurrentUser` – fetches user from Supabase Admin |
| `/api/v1/auth/refresh` | POST | Public | ❌ No | `AuthController.refreshToken` – refreshes session via Supabase |
| `/api/v1/auth/password/reset-request` | POST | Public | ❌ No | `AuthController.requestPasswordReset` – sends reset email via Supabase |
| `/api/v1/auth/password/reset` | POST | Public | ❌ No | `AuthController.resetPassword` – updates password via Supabase |

---

### Tours – `src/routes/v1/tour.routes.ts` → `src/controllers/tour.controller.ts`

| Endpoint | Method | Auth | Serverless? | Details |
|---|---|---|---|---|
| `/api/v1/tours` | GET | Public | ❌ No | `TourController.getTours` – queries Supabase `tours` table with filters and pagination |
| `/api/v1/tours/:id` | GET | Public | ❌ No | `TourController.getTour` – fetches single tour from Supabase |
| `/api/v1/tours` | POST | Admin key | ❌ No | `TourController.createTour` – inserts tour into Supabase |
| `/api/v1/tours/:id` | PUT | Admin key | ❌ No | `TourController.updateTour` – updates tour in Supabase |
| `/api/v1/tours/:id` | DELETE | Admin key | ❌ No | `TourController.deleteTour` – deletes tour from Supabase |

---

### Tour Details – `src/routes/v1/tour.routes.ts` → `src/controllers/tour.details.controller.ts`

| Endpoint | Method | Auth | Serverless? | Details |
|---|---|---|---|---|
| `/api/v1/tours/:id/details` | GET | Public | ❌ No | `TourDetailsController.getTourDetails` – fetches `tour_details` row |
| `/api/v1/tours/:id/details` | POST | Admin key | ❌ No | `TourDetailsController.createTourDetails` – inserts `tour_details` row |
| `/api/v1/tours/:id/details` | PUT | Admin key | ❌ No | `TourDetailsController.updateTourDetails` – patches `tour_details` row |

---

### Tour Itinerary – `src/routes/v1/tour.routes.ts` → `src/controllers/tour.itinerary.controller.ts`

| Endpoint | Method | Auth | Serverless? | Details |
|---|---|---|---|---|
| `/api/v1/tours/:id/itinerary` | GET | Public | ❌ No | `TourItineraryController.getItinerary` – fetches all itinerary days |
| `/api/v1/tours/:id/itinerary` | POST | Admin key | ❌ No | `TourItineraryController.addItineraryDay` – inserts an itinerary day |
| `/api/v1/tours/:id/itinerary/:dayNumber` | PUT | Admin key | ❌ No | `TourItineraryController.updateItineraryDay` – updates an itinerary day |
| `/api/v1/tours/:id/itinerary/:dayNumber` | DELETE | Admin key | ❌ No | `TourItineraryController.deleteItineraryDay` – removes an itinerary day |

---

### Blogs – `src/routes/v1/blog.routes.ts` → `src/controllers/blog.controller.ts`

| Endpoint | Method | Auth | Serverless? | Details |
|---|---|---|---|---|
| `/api/v1/blogs` | GET | Public | ❌ No | `BlogController.getBlogs` – paginated blog listing from Supabase |
| `/api/v1/blogs/:id` | GET | Public | ❌ No | `BlogController.getBlog` – single blog by ID |
| `/api/v1/blogs` | POST | Admin key | ❌ No | `BlogController.createBlog` – inserts blog into Supabase |
| `/api/v1/blogs/:id` | PUT | Admin key | ❌ No | `BlogController.updateBlog` – patches blog in Supabase |
| `/api/v1/blogs/:id` | DELETE | Admin key | ❌ No | `BlogController.deleteBlog` – deletes blog from Supabase |

---

### Saved Tours – `src/routes/v1/saved.tours.routes.ts` → `src/controllers/saved.tours.controller.ts`

| Endpoint | Method | Auth | Serverless? | Details |
|---|---|---|---|---|
| `/api/v1/saved-tours` | GET | Bearer JWT | ❌ No | `SavedToursController.getSavedTours` – fetches user's saved tours from Supabase |
| `/api/v1/saved-tours/:tourId` | POST | Bearer JWT | ❌ No | `SavedToursController.saveTour` – inserts into `saved_tours` table |
| `/api/v1/saved-tours/:tourId` | DELETE | Bearer JWT | ❌ No | `SavedToursController.removeSavedTour` – removes from `saved_tours` table |

---

### API Docs – `src/routes/v1/docs.routes.ts`

| Endpoint | Method | Auth | Serverless? | Details |
|---|---|---|---|---|
| `/api/v1/docs` | GET | Public | ❌ No | Returns inline JSON API documentation; runs inside persistent Express server |

---

## Middleware

> ℹ️ All middleware below contains **stateless, per-request logic** that is inherently compatible with serverless execution. The "❌ No" status reflects that these are currently wired into the Express middleware pipeline and run inside the persistent server process. Once the app is wrapped with `serverless-http`, no changes to the logic inside these files are required.

| Middleware | File | Serverless? | Details |
|---|---|---|---|
| `authenticate` | `src/middleware/auth.ts` | ❌ No (needs wrapper) | Validates JWT via Supabase Admin; stateless per-request logic — fully portable to serverless |
| `requireAdmin` | `src/middleware/admin.ts` | ❌ No (needs wrapper) | Checks admin secret key from env; stateless per-request logic — fully portable to serverless |
| `validate` | `src/middleware/validator.ts` | ❌ No (needs wrapper) | Runs Zod schema validation; stateless per-request logic — fully portable to serverless |
| `errorHandler` | `src/middleware/errorHandler.ts` | ❌ No (needs wrapper) | Centralised Express error handler; stateless per-request logic — fully portable to serverless |

---

## Utility Functions

| File | Serverless? | Details |
|---|---|---|
| `src/utils/errors.ts` | ✅ Compatible | Pure TypeScript error classes; no runtime coupling |
| `src/utils/response.ts` | ✅ Compatible | Pure helper for formatting HTTP responses; no runtime coupling |

---

## Validators

All Zod validator schemas under `src/validators/` are pure data-definition modules with no side-effects or runtime coupling. They are ✅ **serverless-compatible** as-is.

| File | Serverless? |
|---|---|
| `src/validators/auth.validator.ts` | ✅ Compatible |
| `src/validators/tour.validator.ts` | ✅ Compatible |
| `src/validators/tour.details.validator.ts` | ✅ Compatible |
| `src/validators/tour.itinerary.validator.ts` | ✅ Compatible |
| `src/validators/blog.validator.ts` | ✅ Compatible |
| `src/validators/saved.tours.validator.ts` | ✅ Compatible |

---

## Database (Supabase)

| Component | Serverless? | Details |
|---|---|---|
| Supabase PostgreSQL | ✅ Yes | Managed, serverless-compatible database |
| Supabase Auth | ✅ Yes | Managed auth; no persistent process required on the app side |
| Supabase Row-Level Security (RLS) | ✅ Yes | Enforced at the database layer |
| Supabase migrations (`supabase/migrations/`) | ✅ Yes | Schema-only SQL files; not runtime code |

---

## Recommendations for Full Serverless Migration

The controller and middleware logic is already **stateless** — all state lives in Supabase. The primary barrier to serverless deployment is the persistent `app.listen()` in `src/index.ts`. Migrating involves:

1. **Wrap the Express app** with [`serverless-http`](https://github.com/dougmoscrop/serverless-http) to export it as a Lambda/Vercel/Netlify handler instead of calling `app.listen()`.

   ```ts
   // src/handler.ts (new file)
   import serverless from 'serverless-http';
   import app from './app';
   export const handler = serverless(app);
   ```

2. **Replace the in-memory rate limiter** with an external store (e.g., Redis via Upstash) that persists across cold starts and function instances.

3. **Deploy to a serverless platform** such as:
   - **Vercel** (zero-config for Node.js, recommended for this stack)
   - **AWS Lambda** with API Gateway
   - **Netlify Functions**
   - **Google Cloud Functions / Cloud Run**

4. **Ensure environment variables** are configured in the platform's secrets manager (the current `src/config/env.ts` is already compatible).

5. **Cold-start considerations**: The Supabase client is created at module load time (`src/config/supabase.ts`), which is fine — clients are reused across warm invocations.

No logic changes are required in controllers, middleware, validators, or utility modules; only the entry point and rate-limiter store need updating.
