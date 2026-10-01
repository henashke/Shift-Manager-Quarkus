# 02 — Missing authorization

The old backend required a valid JWT on every route under `/api/users`, `/api/constraints`, `/api/shifts`,
`/api/shift-weight-settings` and `/api/backup`. Some routes were also admin-only. The old behavior wins.

## Step 0 — verify first, before changing anything

The comparison was done by reading the code: these resources have no `@RolesAllowed` / `@Authenticated`, and
`application.properties` has no `quarkus.http.auth.permission.*`. That suggests they're public, but it may be wrong
(e.g. SmallRye JWT config, proactive auth, or something else may already require a token).

- [ ] Start the app and call each route below **without** an `Authorization` header, then with a non-admin
  token. Record the actual status codes here before fixing anything:

  | Route | No token → | User token → |
  |---|---|---|
  | `GET /api/users` | | |
  | `POST /api/users` | | |
  | `PUT /api/users/{username}` | | |
  | `DELETE /api/users/{username}` | | |
  | `GET /api/constraints` | | |
  | `POST /api/constraints` | | |
  | `DELETE /api/constraints` | | |
  | `GET /api/shifts` | | |
  | `GET /api/shift-weight-settings` | | |
  | `POST /api/shift-weight-settings/preset` | | |
  | `POST /api/shift-weight-settings/current-preset` | | |
  | `GET /api/backup` | | |
  | `POST /api/backup/generate-sql` | | |

- [ ] Only fix the routes that actually turn out to be open.

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

- [ ] Add `@RolesAllowed({RoleConstants.USER, RoleConstants.ADMIN})` (or `@Authenticated`) at class level on
  `UserResource`, `ConstraintResource`, `ShiftResource`, `ShiftWeightPresetResource`, `BackupResource`, and
  `@RolesAllowed(ADMIN)` on the admin-only methods above.
- [ ] Make sure 401 (no/invalid token) and 403 (wrong role) are what's returned: the frontend relies on 403 to
  show "unauthorized" messages.
- [ ] Decide whether `POST /api/auth/test` should stay.
