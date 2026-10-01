# 01 — Frontend-breaking changes

Differences from the old Vert.x backend (`../Shift-Manager/backend`) that break the current frontend
(`../Shift-Manager/frontend`). Unless stated otherwise, restore the old behavior.

## 1. `PUT /api/users/{username}` wipes the user's password

- **Problem:** `UserCommandToEntityMapper.updateEntity` copies `name`, `password` and `score` from the command.
  `UserDtoToCommandMapper.mapToUpdateCommand` never sets `password`, so every update sets it to `null`, and the
  user can no longer log in. A missing `score` is also nulled.
- **Old behavior:** only `name` and `score` are updated, and only when present in the request body.
- **To do:**
  - [ ] In `updateEntity`, only apply fields that are non-null in the command.
  - [ ] Never touch `password` from this route (password change is a separate, future feature).
  - [ ] Keep 404 when the user doesn't exist.

## 2. `POST /api/shift-weight-settings/preset` duplicates presets instead of upserting

- **Problem:** `ShiftWeightPresetResource.savePreset` → `BaseResponder.create` always inserts a new row. The
  frontend uses this route to edit existing presets, so names get duplicated, and
  `ShiftWeightPresetDao.findByName(...).firstResult()` returns an arbitrary one.
- **Old behavior:** a preset with the same name is replaced.
- **To do:**
  - [ ] Make the route upsert by name: replace the weights of the existing preset, or create one if none exists.
    `ShiftWeightSettingsService.savePreset` already does this but is unused; route through it or move the logic
    into `ShiftWeightPresetService`.
  - [ ] When replacing weights, use the orphan-removal-friendly path (`clear()` + `addAll()` and set
    `sw.preset`, like `ShiftWeightPresetCommandToEntityMapper.updateEntity`) rather than reassigning the list.
  - [ ] Consider a unique constraint on `shift_weight_presets.name` (new Flyway migration). Clean up existing
    duplicates first, if any.

## 3. `POST /api/shifts` doesn't check CANT constraints

- **Problem:** `ShiftService.overrideShift` deletes and inserts without checking constraints.
- **Old behavior:** if any assigned user has a `CANT` constraint on that date and shift type, reject the whole
  request with
  `400 {"error": "יש ל\"<username>\" אילוץ במשמרת הזו"}`. The frontend displays `data.error`.
- **To do:**
  - [ ] Before saving, check every shift with `ConstraintService.hasCANTConstraint`. If any fails, return the 400
    above and save nothing; validate everything first, before any delete/insert.

## 4. `POST /api/shifts` rejects shifts with no assigned user

- **Decision:** keep the new behavior (400 `User not found: ...`). Nothing to do.

## 5. Error bodies aren't `{"error": "..."}` (auth)

- **Problem:** `AuthResource` returns plain-text bodies. `LoginSignup.tsx` calls `res.json()` before checking
  the status, so the user sees a JSON parse error instead of the message.
- **Old behavior:**
  | Case                         | Status | Body                                              |
  |------------------------------|--------|---------------------------------------------------|
  | Signup/login missing or blank name/password | 400 | `{"error": "Username and password are required"}` |
  | Signup, username exists      | 409    | `{"error": "Username already exists"}`            |
  | Login, bad credentials       | 401    | `{"error": "Invalid username or password"}`       |
  | Unexpected error             | 500    | `{"error": "<message>"}`                          |
- **To do:**
  - [ ] Return the bodies above. Move the logic out of `AuthResource` into a responder so the resource
    methods are one-liners.
  - [ ] Add the blank name/password validation to signup and login. Today a null password causes an NPE in
    BCrypt, then another NPE on `e.getMessage().contains(...)`.
  - [ ] Optionally add a shared `{"error": ...}` error body (e.g. an `ExceptionMapper`) so other routes are
    consistent too.

## 6. Constraint permission errors return 400 instead of 403

- **Problem:** `ConstraintResource.throwIfTriedToPerformActionOnOtherUser` throws `BadRequestException`. The
  frontend checks for `403` to show its "not allowed" message.
- **Old behavior:** `403` when a non-admin creates or deletes constraints for another user.
- **To do:**
  - [ ] Throw `ForbiddenException` (403) instead.
