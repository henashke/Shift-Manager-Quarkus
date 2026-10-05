-- Shadow (כונן צל) and jump (כונן הקפצה) assignments live next to the regular one; every shift has at most one of each
ALTER TABLE assigned_shifts
    ADD COLUMN kind VARCHAR(16) NOT NULL DEFAULT 'REGULAR' CHECK (kind IN ('REGULAR', 'SHADOW', 'JUMP'));
ALTER TABLE assigned_shifts
    ADD CONSTRAINT uq_assigned_shifts_slot UNIQUE (date, type, kind);
