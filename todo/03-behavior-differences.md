# 03 — Behavior differences

## 1. Current preset isn't persisted

- **Decision:** fine as is (in memory, resets to "פלוס 60" on restart). Nothing to do.

## 2. Token expiry: 1 hour (old: 48 hours) → add refresh tokens

- **Decision:** keep the access token at 1 hour and add refresh tokens.
- **Note:** this only removes the "logged out every hour" annoyance if the **frontend** uses the refresh token.
  Today `AuthStore.isTokenExpired()` reads `exp` and logs the user out. Backend changes alone won't help, so the
  frontend has to change too (it'll live in this repo eventually, see #3).
- **To do (backend):**
  - [x] On login, also issue a long-lived refresh token (e.g. 30 days). Prefer an opaque random token stored
    hashed in a new `refresh_tokens` table (user_id, token_hash, expires_at, revoked) over a JWT, so it can be
    revoked. Add a Flyway migration. **Done:** `V4__refresh_tokens.sql`; used/revoked tokens are deleted rather than
    flagged, so there's no `revoked` column. Lifespan: `auth.refresh-token.lifespan-days` (default 30).
  - [x] `POST /api/auth/refresh` (public): body `{refreshToken}` → new access token, and rotate the refresh token
    (invalidate the old one and return a new one). Return 401 `{"error": ...}` when it's invalid, expired or
    revoked.
  - [x] `POST /api/auth/logout`: revoke the refresh token.
  - [x] Keep the login response backward compatible: `{message, username, role, token}` + new `refreshToken`.
  - [x] Revoke a user's refresh tokens when the user is deleted (`ON DELETE CASCADE`).
- **To do (frontend):**
  - [x] Store `refreshToken` with the other auth data.
  - [x] When the access token is expired or about to expire (or on a 401), call `/api/auth/refresh` once, retry
    the request, and only log out if the refresh fails. **Done:** `src/main/webui/src/api.ts` (`authFetch`), used by
    all stores; tested in `api.test.ts`. Parallel requests share one refresh; tabs pick up each other's tokens.

## 3. Frontend is no longer served by the backend

- **Decision:** at the end of the work, serve the client from this server too.
- **To do:**
  - [x] Bring the frontend build into this project (e.g. Quinoa extension, or copy the build output to
    `src/main/resources/META-INF/resources`). **Done:** frontend source moved to `src/main/webui`, served by
    Quinoa 2.8.2.
  - [x] SPA fallback: unknown non-`/api` paths return `index.html` (old: `StaticHandler` + `last()` fallback in
    `MainVerticle`).
  - [x] Point the frontend's `config.API_BASE_URL` at the same origin (`/api`); revisit the
    `quarkus.http.cors.origins=*` setting once same-origin. **Done:** CORS is now dev-profile only; the React dev
    server proxies `/api` to `localhost:8080` when opened directly.

## 4. Constraint visibility for admins

- **Decision:** the new role-based check is better. Nothing to do.

## Found along the way

- [ ] A packaged (non-dev) build can't sign JWTs: `src/main/resources/privateKey.pem` / `publicKey.pem` don't exist
  and no key location is configured (dev mode generates keys automatically). Login fails with `SRJWT05009`.
  Generate a keypair and configure `smallrye.jwt.sign.key.location` / `mp.jwt.verify.publickey.location` (keep the
  private key out of git) before deploying.
