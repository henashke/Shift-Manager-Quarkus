-- Extra shift tables for a week (another real schedule next to the regular one, e.g. another team). NULL is the
-- regular table. Each table has its own slots: one assignment per date, day/night, role and table.
ALTER TABLE assigned_shifts
    ADD COLUMN special_table_name VARCHAR(50);
ALTER TABLE assigned_shifts
    DROP CONSTRAINT uq_assigned_shifts_slot;
ALTER TABLE assigned_shifts
    ADD CONSTRAINT uq_assigned_shifts_slot UNIQUE NULLS NOT DISTINCT (date, type, kind, special_table_name);
