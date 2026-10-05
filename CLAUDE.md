# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (hot reload)
mvn quarkus:dev

# Build
mvn clean package

# Run tests
mvn test # tests aren't relevant yet

# Integration tests
mvn verify

# Build native image (needs GraalVM/Mandrel locally; or add -Dquarkus.native.container-build=true to use Docker)
mvn clean package -Dnative

# Production image (native, what Railway builds)
docker build -t shift-manager .
```

## Prerequisites

- PostgreSQL running on `localhost:5432`, default `postgres` database, user `postgres`, password `postgres`
- `src/main/resources/keys/privateKey.pem` and `publicKey.pem` must exist (RS256 keypair for JWT, gitignored)
- `.env` in the project root with `GEMINI_API_KEY=...` (gitignored; Quarkus loads it in dev mode)
- API available at `http://localhost:8080/api/`, frontend at `http://localhost:8080/`
- Node.js + npm (Quinoa installs and builds the frontend)

## Architecture

**Shift Manager** is a Quarkus 3 REST API (plus its React frontend) for employee shift scheduling. It assigns DAY/NIGHT shifts, tracks user
constraints, and applies weight-based fairness scoring across a week.

### Stack

- **Quarkus 3** + Java 21, JAX-RS REST, Jackson
- **Hibernate ORM Panache** (active record pattern)
- **PostgreSQL** + **Flyway** (auto-migrates on startup from `src/main/resources/db/migration/`)
- **SmallRye JWT** with RS256 for auth, jBCrypt for password hashing
- **Lombok** for boilerplate reduction
- **React** frontend (Create React App, MobX, MUI) in `src/main/webui`, built and served by **Quinoa**. In dev mode
  Quinoa runs the React dev server (port 3000) and proxies it through `:8080`; SPA routes fall back to `index.html`,
  `/api` is excluded. Authenticated frontend calls go through `authFetch` (`src/main/webui/src/api.ts`).

### Domain Entities

| Entity              | Purpose                                                     |
|---------------------|-------------------------------------------------------------|
| `User`              | Employee with hashed password, cumulative score, and role   |
| `AssignedShift`     | Links User → date + ShiftType + ShiftWeightPreset           |
| `Shift`             | Base shift by date and ShiftType (DAY/NIGHT)                |
| `Constraint`        | User's availability for a date: CANT / PREFER / PREFERS_NOT |
| `ShiftWeightPreset` | Named set of per-day-of-week weights for fairness scoring   |
| `ShiftWeight`       | Single weight entry within a preset (day + shift type)      |

### Layer Pattern

Each feature follows the same layered pattern:

```
resources/ (JAX-RS endpoint)
  → responders/ (DTO ↔ entity conversion, owns the mapper)
    → services/ (business logic, entity operations only)
      → daos/ (Panache repository, extends BaseDao<T>)
        → entities/ (JPA entity, extends BaseEntity)
```

**Commands** (`commands/`) are the POST/PUT request bodies.

**Mappers** (`mappers/`, implement `CommandToEntityMapper<T, AC, UC, D>`) handle two conversions:

- `mapToEntity(command)` — command → entity (inbound)
- `mapToDto(entity)` → DTO (outbound)

**Responders** (`responders/`) sit between resources and services. They are the only layer that knows about mappers and
DTOs. `BaseResponder<T, AC, UC, D>` provides generic CRUD methods; concrete responders add domain-specific logic.

**Services** (`services/`, extend `BaseService<T>`) contain business logic and operate exclusively on entities. They
have no knowledge of DTOs or mappers.

**DTOs** (`dto/`) are the API response types. They never expose internal entity fields (e.g., hashed passwords,
back-references).

### General Code Preferences

- Instead of @Inject-ing, use @RequiredArgsConstructor + making the fields private-final for @ApplicationScoped to
  auto-inject them.
- Resource functions should be one-liners. All logic goes in responders/services.
- Production runs as a GraalVM native image. Any class Jackson (de)serializes that isn't a resource method's declared
  parameter/return type (e.g. wrapped in a `Response`, put in a `Map`) needs `@RegisterForReflection`; all DTOs have
  it. Log with `io.quarkus.logging.Log`. Avoid other reflection, and new libraries without a Quarkus extension.

### Auth Flow

- `POST /api/auth/signup`, `/login`, `/refresh` and `/logout` are public
- Login returns a 1-hour access JWT plus a refresh token; all other endpoints require `Authorization: Bearer <token>`
- `POST /api/auth/refresh` exchanges a refresh token (single-use, rotated, stored SHA-256 hashed in `refresh_tokens`)
  for a new pair; `POST /api/auth/logout` revokes it
- Roles are enforced via `@RolesAllowed` on resource methods; role constants in `auth/`

### API Behavior Worth Knowing

- `GET /api/users` returns only non-admin users (admins manage the system and aren't scheduled); the backup export
  still includes admins.
- `GET /api/shifts` and `GET /api/constraints` take `?weekOffset=N` and return a 5-week window around that week
  (`util/WeekWindow`: weeks start on Sunday, computed in the server's time zone). Without it they return the whole
  history, which the frontend never asks for.

### Backup Feature

`GET /api/backup` exports the DB as a zip of JSON files in the old (pre-Quarkus) backup format. Unzipped under
`src/main/resources/backup/<name>/`, `POST /api/backup/generate-sql` turns it into
`src/main/resources/backup/results/<name>/backup.sql`.

## Checking UI Changes in a Browser

Headless Chrome (driven over the DevTools protocol) against the dev server on `:3000` works for screenshots, touch
emulation and profiling. To get past the login without anyone's password, use a throwaway account:

1. `POST /api/auth/signup` with a random name and password.
2. For admin UI, promote it in the database: `update users set role = 'admin' where name = '<name>'`.
3. `POST /api/auth/login`, then put `token`, `refreshToken`, `username` and `role` from the response into
   `localStorage` on the `:3000` origin.
4. Afterwards remove it: `POST /api/auth/logout`, then delete its `refresh_tokens` rows and its `users` row.

Tokens signed locally with the dev key are rejected (401), so use a real login. A non-admin test user appears in the
user list while it exists.
