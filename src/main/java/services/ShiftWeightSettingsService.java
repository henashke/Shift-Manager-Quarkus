package services;

import daos.ShiftWeightPresetDao;
import entities.ShiftWeightPreset;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.List;

@ApplicationScoped
public class ShiftWeightSettingsService {

    @Inject
    ShiftWeightPresetDao shiftWeightPresetDao;

    @ConfigProperty(name = "app.current-preset", defaultValue = "default")
    String currentPreset;

    public ShiftWeightPreset getCurrentPreset() {
        return shiftWeightPresetDao.findByName(currentPreset);
    }

    public void setCurrentPreset(String presetName) throws Exception {
        ShiftWeightPreset preset = shiftWeightPresetDao.findByName(presetName);
        if (preset == null) {
            throw new Exception("Preset not found: " + presetName);
        }
        currentPreset = presetName;
    }

    public List<ShiftWeightPreset> getAllPresets() {
        return shiftWeightPresetDao.listAll();
    }

    public ShiftWeightPreset savePreset(ShiftWeightPreset preset) {
        ShiftWeightPreset existing = shiftWeightPresetDao.findByName(preset.name);
        if (existing != null) {
            existing.weights = preset.weights;
            shiftWeightPresetDao.persist(existing);
            return existing;
        }
        shiftWeightPresetDao.persist(preset);
        return preset;
    }
}

