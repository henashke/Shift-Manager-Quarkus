package mappers;

import commands.AddShiftWeightPresetCommand;
import commands.UpdateShiftWeightPresetCommand;
import dto.ShiftWeightDto;
import dto.ShiftWeightPresetDto;
import entities.ShiftWeight;
import entities.ShiftWeightPreset;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ShiftWeightPresetMapper implements CommandToEntityMapper<ShiftWeightPreset, AddShiftWeightPresetCommand, UpdateShiftWeightPresetCommand, ShiftWeightPresetDto> {

    @Override
    public ShiftWeightPreset mapToEntity(AddShiftWeightPresetCommand addCommand) {
        ShiftWeightPreset preset = new ShiftWeightPreset();
        preset.name = addCommand.name;
        preset.shiftWeights = addCommand.shiftWeights;
        if (preset.shiftWeights != null) {
            preset.shiftWeights.forEach(sw -> sw.preset = preset);
        }
        return preset;
    }

    @Override
    public void updateEntity(ShiftWeightPreset entity, UpdateShiftWeightPresetCommand updateCommand) {
        entity.name = updateCommand.name;
        if (updateCommand.shiftWeights != null) {
            entity.shiftWeights.clear();
            entity.shiftWeights.addAll(updateCommand.shiftWeights);
            entity.shiftWeights.forEach(sw -> sw.preset = entity);
        }
    }

    @Override
    public ShiftWeightPresetDto mapToDto(ShiftWeightPreset entity) {
        ShiftWeightPresetDto dto = new ShiftWeightPresetDto();
        dto.name = entity.name;
        dto.weights = entity.shiftWeights != null
                ? entity.shiftWeights.stream().map(this::mapWeightToDto).toList()
                : java.util.List.of();
        return dto;
    }

    private ShiftWeightDto mapWeightToDto(ShiftWeight sw) {
        ShiftWeightDto dto = new ShiftWeightDto();
        dto.day = sw.day;
        dto.shiftType = sw.shiftType;
        dto.weight = sw.weight;
        return dto;
    }
}
