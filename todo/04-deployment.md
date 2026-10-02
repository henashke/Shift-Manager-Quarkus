# 04 — Deploying with Docker (e.g. Railway)

## Summary

1. **Commit a safe `application.properties`** that reads environment-specific values and secrets from env vars.
2. **Generate a JWT keypair** and keep the private key out of git.
3. **Create the Railway project:** a PostgreSQL service plus the app service, which builds from the `Dockerfile`.
4. **Set the app's variables:** DB connection, port, JWT keys and (optionally) Gemini.
5. **Deploy:** Flyway creates the schema on the first start.
6. **Import the data:** truncate the tables, then run the generated `backup.sql` with `psql`.
7. **Smoke-test:** log in, open every page, check the logs.

The `Dockerfile` builds a GraalVM native executable (Mandrel builder, `ubi9-quarkus-micro-image` runtime). Tested
locally on 2026-10-02 against a fresh Postgres: the image builds, migrates the schema, serves every page (including SPA
refresh) and API route, issues and refreshes tokens, rejects requests without a token, downloads a backup, and reaches
Gemini over HTTPS. It starts in ~0.1s and uses ~55MB of RAM.

---

## 1. Commit a safe `application.properties`

**Why:** `src/main/resources/application.properties` is gitignored, so a build from the repo (which is what Railway
does) has no config at all. Some settings are read when the app is built, so env vars alone can't replace them:
`quarkus.datasource.db-kind`, and `quarkus.quinoa.*` (without `enable-spa-routing`, `/settings` etc. return 404 on
refresh).

**Also:** a local `docker build` currently copies the local, gitignored `application.properties` into the image,
including the real `gemini.api-key`. Don't push an image built that way anywhere.

- [ ] Commit an `application.properties` without secrets, along these lines:
  ```properties
  quarkus.http.port=${PORT:8080}
  quarkus.datasource.db-kind=postgresql
  quarkus.datasource.jdbc.url=${DB_JDBC_URL:jdbc:postgresql://localhost:5432/}
  quarkus.datasource.username=${DB_USERNAME:postgres}
  quarkus.datasource.password=${DB_PASSWORD:postgres}
  quarkus.flyway.migrate-at-start=true
  %dev.quarkus.http.cors.enabled=true
  %dev.quarkus.http.cors.origins=*
  quarkus.quinoa.build-dir=build
  quarkus.quinoa.dev-server.port=3000
  quarkus.quinoa.enable-spa-routing=true
  quarkus.quinoa.ignored-path-prefixes=/api
  auth.refresh-token.lifespan-days=30
  mp.jwt.verify.issuer=my-app
  ```
- [ ] Move local-only values (e.g. the Gemini key) to env vars or a gitignored `.env` (Quarkus reads `.env` in dev),
  remove `application.properties` from `.gitignore`, and delete `example_application.properties` (or keep it
  in sync).
- [ ] Rotate the Gemini API key if it was ever shared or committed anywhere.
- [ ] Remove the deprecated `quarkus.hibernate-orm.database.generation=none` (logs a warning; `none` is the default).

## 2. JWT keypair

**Why:** in `quarkus:dev`, Quarkus generates a signing key automatically. A packaged app has none, so login fails with
`SRJWT05009`.

- [ ] Generate one:
  ```bash
  openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out privateKey.pem
  openssl pkey -in privateKey.pem -pubout -out publicKey.pem
  ```
- [ ] Store both in a password manager / Railway variables only. Never commit `privateKey.pem`.
- [ ] Rotating the keypair invalidates all access tokens; users then get a new one via their refresh token (refresh
  tokens are stored in the DB and don't depend on the keypair).

## 3. Railway project

- [ ] Create a project, add a **PostgreSQL** service.
- [ ] Add the app service from the GitHub repo. Railway detects the `Dockerfile` and builds with it (Quinoa downloads
  Node during the build; no extra setup).
- [ ] The native build is the heavy part: locally it peaked at ~3GB of RAM and took a few minutes (the
  `native-image` step itself ~1-2 min). If Railway's build fails with an out-of-memory / exit code 137 error, cap
  the build's heap by adding `-Dquarkus.native.native-image-xmx=3g` to the `mvnw package` line in the `Dockerfile`.
- [ ] Generate a public domain for the app service (Settings → Networking).

## 4. App service variables

Quarkus maps env vars to config automatically (`quarkus.datasource.jdbc.url` → `QUARKUS_DATASOURCE_JDBC_URL`), so
these override the local defaults in the committed `application.properties`:

| Variable | Value |
|---|---|
| `QUARKUS_DATASOURCE_JDBC_URL` | `jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}` |
| `QUARKUS_DATASOURCE_USERNAME` | `${{Postgres.PGUSER}}` |
| `QUARKUS_DATASOURCE_PASSWORD` | `${{Postgres.PGPASSWORD}}` |
| `SMALLRYE_JWT_SIGN_KEY` | contents of `privateKey.pem` (the whole PEM, inline; tested) |
| `MP_JWT_VERIFY_PUBLICKEY` | contents of `publicKey.pem` (tested) |
| `GEMINI_API_KEY` | the (rotated) key. **Required:** the app doesn't start without it |

`PORT` is set by Railway automatically; `quarkus.http.port=${PORT:8080}` picks it up. The JWT issuer defaults to
`my-app` on both the signing and the verifying side, so it needs no variable.

Don't use Railway's `DATABASE_URL`: it's in `postgres://user:pass@host/db` form, which JDBC doesn't accept.

**AI shift suggestions** use Gemini by default (`suggestion.provider=gemini`, `gemini.enabled=true`). If the call
fails, suggestions fall back to the built-in scheduler. To run without Gemini, set `GEMINI_ENABLED=false` (and any
dummy `GEMINI_API_KEY`).

## 5. Deploy

- [ ] Deploy and check the logs for `Migrating schema "public" to version "4 - refresh tokens"` and
  `started in ...`.

## 6. Import the data

The migrations insert the "פלוס 60" preset, and `backup.sql` inserts rows with explicit ids, so the tables must be
emptied first or the import fails.

- [ ] Generate the SQL locally (from the latest backup: `GET /api/backup`, unzip under
  `src/main/resources/backup/<name>/`, then `POST /api/backup/generate-sql` with body `<name>`).
- [ ] Get the public connection string from the Railway PostgreSQL service (Connect → Public Network), then:
  ```bash
  psql "<public connection url>" -v ON_ERROR_STOP=1 \
    -c "TRUNCATE assigned_shifts, constraints, shift_weights, shift_weight_presets, users RESTART IDENTITY;"
  psql "<public connection url>" -v ON_ERROR_STOP=1 -f src/main/resources/backup/results/<name>/backup.sql
  ```
- [ ] Users and shifts referencing users that aren't in the backup's `users.json` are skipped (same as locally).

## 7. Smoke test

- [ ] Log in, open `/`, `/constraints`, `/settings`, and refresh the browser on each (SPA routing).
- [ ] `GET /api/backup` downloads a zip (as a logged-in user).
- [ ] Logs have no `ERROR`s.

## Good to know

- **Current preset resets:** it's kept in memory, so it resets to "פלוס 60" on every redeploy or restart
  (accepted, see 03 #1).
- **`generate-sql` is local-only:** it reads and writes under `src/main/resources/backup/`, which doesn't exist in
  the container. Use it locally only.
- **Image size:** ~190MB (native executable on a micro base; the earlier JVM image was ~560MB).
- **`GEMINI_API_KEY` must be set** (even to a dummy value when Gemini is disabled): `gemini.api-key=${GEMINI_API_KEY}`
  has no default, so the app refuses to start without it.
- **Backups stay out of the image:** `.dockerignore` excludes `src/main/resources/backup*`, so backup snapshots (with
  password hashes) never end up in an image.
