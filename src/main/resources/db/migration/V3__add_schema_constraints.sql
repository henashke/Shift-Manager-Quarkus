-- Add CHECK constraints for enum validation

-- Add CHECK constraint to constraints table for constraint_type
ALTER TABLE constraints
    ADD CONSTRAINT check_constraint_type
    CHECK (constraint_type IN ('CANT', 'PREFER'));

-- Add CHECK constraint to constraints table for shift_type
ALTER TABLE constraints
    ADD CONSTRAINT check_shift_type
    CHECK (shift_type IN ('DAY', 'NIGHT'));

-- Add CHECK constraint to shift_weights table for day
ALTER TABLE shift_weights
    ADD CONSTRAINT check_day
    CHECK (day IN ('SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'));

-- Add CHECK constraint to shift_weights table for shiftType
ALTER TABLE shift_weights
    ADD CONSTRAINT check_shift_weights_type
    CHECK (shiftType IN ('DAY', 'NIGHT'));

