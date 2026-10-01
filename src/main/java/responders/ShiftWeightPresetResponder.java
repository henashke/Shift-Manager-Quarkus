package responders;

import commands.AddShiftWeightPresetCommand;
import commands.UpdateShiftWeightPresetCommand;
import dto.ShiftWeightPresetDto;
import entities.ShiftWeightPreset;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.core.Response;
import mappers.DtoToCommandMapper;
import mappers.shiftWeightPreset.ShiftWeightPresetDtoToCommandMapper;
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
    ShiftWeightPresetDtoToCommandMapper shiftWeightPresetDtoToCommandMapper;

    @Inject
    ShiftWeightSettingsService shiftWeightSettingsService;

    @Override
    protected BaseService<ShiftWeightPreset, AddShiftWeightPresetCommand, UpdateShiftWeightPresetCommand> getService() {
        return shiftWeightPresetService;
    }

    @Override
    protected DtoToCommandMapper<ShiftWeightPresetDto, ShiftWeightPreset, AddShiftWeightPresetCommand, UpdateShiftWeightPresetCommand> getDtoToCommandMapper() {
        return shiftWeightPresetDtoToCommandMapper;
    }

    public Map<String, Object> getSettings() {
        Map<String, Object> settings = new HashMap<>();
        ShiftWeightPreset currentPreset = shiftWeightSettingsService.getCurrentPreset();
        settings.put("currentPresetObject", currentPreset != null ? shiftWeightPresetDtoToCommandMapper.mapToDto(currentPreset) : null);

        Map<String, ShiftWeightPresetDto> presets = new HashMap<>();
        for (ShiftWeightPreset preset : shiftWeightSettingsService.getAllPresets()) {
            presets.put(preset.name, shiftWeightPresetDtoToCommandMapper.mapToDto(preset));
        }
        settings.put("presets", presets);

        return settings;
    }

    /**
     * Upsert by name: replaces the weights of an existing preset with the same name, otherwise creates it.
     */
    @Transactional
    public Response saveByName(ShiftWeightPresetDto dto) {
        ShiftWeightPreset existing = shiftWeightPresetService.findByName(dto.name);
        ShiftWeightPreset saved = existing == null
                ? shiftWeightPresetService.create(shiftWeightPresetDtoToCommandMapper.mapToAddCommand(dto))
                : shiftWeightPresetService.update(existing.id, shiftWeightPresetDtoToCommandMapper.mapToUpdateCommand(dto));
        return ok(shiftWeightPresetDtoToCommandMapper.mapToDto(saved));
    }

    public Response setCurrentPreset(String presetName) throws Exception {
        shiftWeightSettingsService.setCurrentPreset(presetName);
        return Response.ok().build();
    }
}
