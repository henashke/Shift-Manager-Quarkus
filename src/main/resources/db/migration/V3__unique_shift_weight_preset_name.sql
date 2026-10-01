-- Presets are identified by name (upserted by name, looked up by name), so names must be unique
ALTER TABLE shift_weight_presets
    ADD CONSTRAINT uq_shift_weight_presets_name UNIQUE (name);
