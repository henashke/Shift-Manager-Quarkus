-- Reservists (מילואים): still users and schedulable, but only included in suggestions when chosen
ALTER TABLE users
    ADD COLUMN reserve BOOLEAN NOT NULL DEFAULT FALSE;

-- Being an admin is a permission, separate from being scheduled. Accounts that are never scheduled (the built-in system
-- admin) are marked here; today those are exactly the existing admins
ALTER TABLE users
    ADD COLUMN schedulable BOOLEAN NOT NULL DEFAULT TRUE;
UPDATE users
SET schedulable = FALSE
WHERE role = 'admin';
