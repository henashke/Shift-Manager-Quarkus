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

# Build native image
mvn clean package -Dnative
```

## Prerequisites

- PostgreSQL running on `localhost:5432`, database `shift-manager`, user `postgres`, password `admin`
- `src/main/resources/privateKey.pem` and `publicKey.pem` must exist (RS256 keypair for JWT)
- API available at `http://localhost:8080/api/`

## Architecture

**Shift Manager** is a Quarkus 3 REST API for employee shift scheduling. It assigns DAY/NIGHT shifts, tracks user
constraints, and applies weight-based fairness scoring across a week.

### Stack

- **Quarkus 3** + Java 21, JAX-RS REST, Jackson
- **Hibernate ORM Panache** (active record pattern)
- **PostgreSQL** + **Flyway** (auto-migrates on startup from `src/main/resources/db/migration/`)
- **SmallRye JWT** with RS256 for auth, jBCrypt for password hashing
- **Lombok** for boilerplate reduction

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
  → services/ (business logic)
    → daos/ (Panache repository, extends BaseDao<T>)
      → entities/ (JPA entity, extends BaseEntity)
```

**Commands** (`commands/`) are the POST/PUT request bodies. **Mappers** (`mappers/`, implement
`CommandToEntityMapper<C,E>`) convert commands to entities. **DTOs** (`dto/`) are used for structured responses (e.g.,
`AssignedShiftDto`).

### Auth Flow

- `POST /api/auth/signup` and `POST /api/auth/login` are public
- Login returns a JWT; all other endpoints require `Authorization: Bearer <token>`
- Roles are enforced via `@RolesAllowed` on resource methods; role constants in `auth/`

### Backup Feature

`BackupResource` / `BackupService` can export the current DB state to JSON files (under `src/main/resources/backups/`)
and generate Flyway SQL migration files from those snapshots.
