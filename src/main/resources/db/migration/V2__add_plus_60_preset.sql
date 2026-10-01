-- Add "פלוס 60" preset with weight 2 for every day and shift type,
-- and assign it to all assigned shifts that have no preset
WITH preset AS (
    INSERT INTO shift_weight_presets (name)
        VALUES ('פלוס 60')
        RETURNING id
),
     weights AS (
         INSERT INTO shift_weights (day, shiftType, weight, preset_id)
             SELECT d.day, s.shift_type, 2, preset.id
             FROM preset
                      CROSS JOIN (VALUES ('SUNDAY'), ('MONDAY'), ('TUESDAY'), ('WEDNESDAY'), ('THURSDAY'), ('FRIDAY'), ('SATURDAY')) AS d(day)
                      CROSS JOIN (VALUES ('DAY'), ('NIGHT')) AS s(shift_type)
     )
UPDATE assigned_shifts
SET preset_id = (SELECT id FROM preset)
WHERE preset_id IS NULL;
