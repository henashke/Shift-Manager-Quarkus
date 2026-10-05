# 01 — User management

Three admin and account features. Items 1 and 3 ship together (branch `reserves-and-admins`); item 2 gets its own
branch.

## Decision: being an admin is a permission, not "not schedulable"

`GET /api/users` used to hide every admin, so the built-in system admin account didn't count as a schedulable user.
With admins able to promote users, that would make promoted users vanish from the list, the tray and suggestions, and
they couldn't be demoted from the UI. So the two are separated:

- A new `users.schedulable` flag (default true). The list, tray and suggestions show schedulable users only.
- The migration sets it to false for accounts that are admins today (the built-in system account).
- Admins promoted from now on stay schedulable and stay in the list.

## 1. Reserves (מילואים)

An admin can mark a user as a reservist. Reservists are still users and can be scheduled, but only when chosen.

- **Backend**
  - [x] Flyway `V5`: `users.reserve boolean not null default false` (and `users.schedulable`, above).
  - [x] `User.reserve`; `UserDto` exposes `reserve` (and `role`, for item 3).
  - [x] `PUT /api/users/{username}/reserve` with `{"reserve": true|false}`, admin only.
  - [x] `GET /api/users` lists schedulable users (replaces the admin filter).
- **Frontend**
  - [x] The user list shows regular users first, then reservists in their own group labelled "מילואים", right below.
        Same on phones inside the users tray.
  - [x] Admins get "העבר למילואים" / "החזר לכוננים קבועים" in a user's menu; other users don't see it.
  - [x] The suggest-assignments dialog lists reservists separately and leaves them unchecked by default.
  - [x] The user info dialog shows when a user is a reservist.

## 2. Change your own username and password (separate branch)

- **Backend**
  - [ ] An authenticated route for the current user (from the JWT, never a path parameter) to change their username
        and/or password. Changing the password requires the current password; store it with jBCrypt as at signup.
  - [ ] Renaming must keep everything linked to the user (shifts, constraints, refresh tokens) and reject a name
        that's already taken (409 with `{"error": ...}`).
  - [ ] After a rename or password change, issue a new token pair (the old access token carries the old name), and
        revoke the user's other refresh tokens on a password change.
- **Frontend**
  - [ ] An "account" entry in the avatar menu opening a dialog (built on `CommonDialog`, `DialogTextField`) for the
        new username, current password and new password (twice).
  - [ ] Store the new tokens and username on success; show the server's error on failure.

## 3. Make users admins

- **Backend**
  - [x] `PUT /api/users/{username}/role` with `{"role": "admin"|"user"}`, admin only; reject other values (400).
  - [x] An admin can't demote themselves, and the last admin can't be demoted (409), so nobody gets locked out.
        (Self-demotion is tested; the last-admin case wasn't, since the system admin account is always an admin.)
  - [x] A role change applies from the user's next token (login or refresh, at most an hour).
- **Frontend**
  - [x] Admins get "הפוך למנהל" / "הסר הרשאות מנהל" in a user's menu (not on themselves).
  - [x] Admins are marked in the user info dialog.
