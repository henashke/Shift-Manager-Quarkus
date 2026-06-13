package responders;

import commands.AddShiftWeightPresetCommand;
import commands.UpdateShiftWeightPresetCommand;
import dto.ShiftWeightPresetDto;
import entities.ShiftWeightPreset;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import mappers.CommandToEntityMapper;
import mappers.ShiftWeightPresetMapper;
import services.BaseService;
import services.ShiftWeightPresetService;
import services.ShiftWeightSettingsService;

import java.util.HashMap;
import java.util.Map;

@ApplicationScoped
public class ShiftWeightPresetResponder extends BaseResponder<ShiftWeightPreset, AddShiftWeightPresetCommand, UpdateShiftWeightPresetCommand, ShiftWeightPresetDto> {

    @Inject
    ShiftWeightPresetService shiftWeightPresetService;

    @Inject
    ShiftWeightPresetMapper shiftWeightPresetMapper;

    @Inject
    ShiftWeightSettingsService shiftWeightSettingsService;

    @Override
    protected BaseService<ShiftWeightPreset> getService() {
        return shiftWeightPresetService;
    }

    @Override
    protected CommandToEntityMapper<ShiftWeightPreset, AddShiftWeightPresetCommand, UpdateShiftWeightPresetCommand, ShiftWeightPresetDto> getMapper() {
        return shiftWeightPresetMapper;
    }

    public Map<String, Object> getSettings() {
        Map<String, Object> settings = new HashMap<>();
        settings.put("currentPreset", "פלוס 60"); // todo if we actually want this, need to add a settings table

        Map<String, ShiftWeightPresetDto> presets = new HashMap<>();
        for (ShiftWeightPreset preset : shiftWeightSettingsService.getAllPresets()) {
            presets.put(preset.name, shiftWeightPresetMapper.mapToDto(preset));
        }
        settings.put("presets", presets);

        return settings;
    }

    public void setCurrentPreset(String presetName) throws Exception {
        shiftWeightSettingsService.setCurrentPreset(presetName);
    }
}
