# 03 — Behavior differences

## 1. Current preset isn't persisted

- **Decision:** fine as is (in memory, resets to "פלוס 60" on restart). Nothing to do.

## 2. Token expiry: 1 hour (old: 48 hours) → add refresh tokens

- **Decision:** keep the access token at 1 hour and add refresh tokens.
- **Note:** this only removes the "logged out every hour" annoyance if the **frontend** uses the refresh token.
  Today `AuthStore.isTokenExpired()` reads `exp` and logs the user out. Backend changes alone won't help, so the
  frontend has to change too (it'll live in this repo eventually, see #3).
- **To do (backend):**
  - [ ] On login, also issue a long-lived refresh token (e.g. 30 days). Prefer an opaque random token stored
    hashed in a new `refresh_tokens` table (user_id, token_hash, expires_at, revoked) over a JWT, so it can be
    revoked. Add a Flyway migration.
  - [ ] `POST /api/auth/refresh` (public): body `{refreshToken}` → new access token, and rotate the refresh token
    (invalidate the old one and return a new one). Return 401 `{"error": ...}` when it's invalid, expired or
    revoked.
  - [ ] `POST /api/auth/logout`: revoke the refresh token.
  - [ ] Keep the login response backward compatible: `{message, username, role, token}` + new `refreshToken`.
  - [ ] Revoke a user's refresh tokens when the user is deleted.
- **To do (frontend):**
  - [ ] Store `refreshToken` with the other auth data.
  - [ ] When the access token is expired or about to expire (or on a 401), call `/api/auth/refresh` once, retry
    the request, and only log out if the refresh fails.

## 3. Frontend is no longer served by the backend

- **Decision:** at the end of the work, serve the client from this server too.
- **To do:**
  - [ ] Bring the frontend build into this project (e.g. Quinoa extension, or copy the build output to
    `src/main/resources/META-INF/resources`).
  - [ ] SPA fallback: unknown non-`/api` paths return `index.html` (old: `StaticHandler` + `last()` fallback in
    `MainVerticle`).
  - [ ] Point the frontend's `config.API_BASE_URL` at the same origin (`/api`); revisit the
    `quarkus.http.cors.origins=*` setting once same-origin.

## 4. Constraint visibility for admins

- **Decision:** the new role-based check is better. Nothing to do.
