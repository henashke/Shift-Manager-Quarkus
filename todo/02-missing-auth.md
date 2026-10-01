# 02 — Missing authorization

The old backend required a valid JWT on every route under `/api/users`, `/api/constraints`, `/api/shifts`,
`/api/shift-weight-settings` and `/api/backup`. Some routes were also admin-only. The old behavior wins.

## Step 0 — verify first, before changing anything

The comparison was done by reading the code: these resources have no `@RolesAllowed` / `@Authenticated`, and
`application.properties` has no `quarkus.http.auth.permission.*`. That suggests they're public, but it may be wrong
(e.g. SmallRye JWT config, proactive auth, or something else may already require a token).

- [x] Start the app and call each route below **without** an `Authorization` header, then with a non-admin
  token. Record the actual status codes here before fixing anything:

  | Route | No token → | User token → |
  |---|---|---|
  | `GET /api/users` | 200 ❌ open | 200 |
  | `POST /api/users` | 201 ❌ open | 201 |
  | `PUT /api/users/{username}` | 404 (passed auth) ❌ open | 404 |
  | `DELETE /api/users/{username}` | 204 ❌ open | 204 ❌ (should be admin only) |
  | `GET /api/constraints` | 500 (NPE on missing claim) | 200 |
  | `POST /api/constraints` | 500 (NPE on missing claim) | 201 |
  | `DELETE /api/constraints` | 500 (NPE on missing claim) | 403 |
  | `GET /api/shifts` | 200 ❌ open | 200 |
  | `GET /api/shift-weight-settings` | 200 ❌ open | 200 |
  | `POST /api/shift-weight-settings/preset` | 200 ❌ open | 200 ❌ (should be admin only) |
  | `POST /api/shift-weight-settings/current-preset` | 500 (passed auth) ❌ open | 500 ❌ (should be admin only) |
  | `GET /api/backup` | 500 ❌ open (and broken, see below) | 500 |
  | `POST /api/backup/generate-sql` | 204 ❌ open | 204 ❌ (should be admin only) |

  Verified 2026-10-01. Missing token → the request goes through. An invalid token (`Bearer garbage`) → 401, so the
  token is only checked when one is sent. `POST /api/shifts` (has `@RolesAllowed`) correctly returns 401/403.

- [x] Only fix the routes that actually turn out to be open. (All routes above are open.)
- [x] Unrelated bug found while testing: `GET /api/backup` returns 500 with body
  `resources.BackupResource$ErrorResponse@...` (the error entity isn't serialized as JSON because the method
  `@Produces("application/zip")`). Find the underlying exception too.
  **Fixed:** the cause was a plain `ObjectMapper` (no `LocalDate` support) serializing raw entities. Backups are now
  written in the old backup format (epoch-millis dates, names instead of ids, Hebrew enums), so they round-trip
  through `generate-sql`. Also fixed `BackupSqlGenerator` reading presets from `backups/` instead of `backup/`
  (presets were never imported before).
- [x] `POST /api/backup/generate-sql` with a nonexistent backup dir returns 204 and writes an empty
  `backup/results/<name>/backup.sql`. It should return 404 instead.
  **Fixed:** 404 for a missing backup, 400 for names that aren't plain directory names (also blocks `../` path
  traversal).

## Required access (old behavior)

| Route | Required |
|---|---|
| `POST /api/auth/signup`, `POST /api/auth/login` | public |
| `GET /api/users`, `POST /api/users`, `PUT /api/users/{username}` | any logged-in user |
| `DELETE /api/users/{username}` | admin |
| `GET/POST/DELETE /api/constraints` | any logged-in user (ownership check already in place; see [01 #6](01-frontend-breaking-changes.md)) |
| `GET /api/shifts` | any logged-in user |
| `POST/DELETE /api/shifts`, `/week`, `/suggest`, `/recalculateAllUsersScores` | admin (already has `@RolesAllowed`) |
| `GET /api/shift-weight-settings` | any logged-in user |
| `POST /api/shift-weight-settings/preset`, `/current-preset` | admin |
| `GET /api/backup` | any logged-in user (old behavior). Consider admin, since the zip contains password hashes |
| `POST /api/backup/generate-sql` | new route; admin |

## To do

- [x] Add `@RolesAllowed({RoleConstants.USER, RoleConstants.ADMIN})` (or `@Authenticated`) at class level on
  `UserResource`, `ConstraintResource`, `ShiftResource`, `ShiftWeightPresetResource`, `BackupResource`, and
  `@RolesAllowed(ADMIN)` on the admin-only methods above.
- [x] Make sure 401 (no/invalid token) and 403 (wrong role) are what's returned: the frontend relies on 403 to
  show "unauthorized" messages.
- [ ] Decide whether `POST /api/auth/test` should stay (it's admin-only, so it's harmless).

Verified after the fix: no token → 401 everywhere except signup/login; user token → 403 on admin-only routes;
admin token → allowed.
