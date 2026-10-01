package mappers.shiftWeightPreset;

import commands.AddShiftWeightPresetCommand;
import commands.UpdateShiftWeightPresetCommand;
import dto.ShiftWeightDto;
import dto.ShiftWeightPresetDto;
import entities.ShiftWeight;
import entities.ShiftWeightPreset;
import enums.ShiftType;
import jakarta.enterprise.context.ApplicationScoped;
import mappers.DtoToCommandMapper;

import java.util.List;

@ApplicationScoped
public class ShiftWeightPresetDtoToCommandMapper implements DtoToCommandMapper<ShiftWeightPresetDto, ShiftWeightPreset, AddShiftWeightPresetCommand, UpdateShiftWeightPresetCommand> {

    @Override
    public AddShiftWeightPresetCommand mapToAddCommand(ShiftWeightPresetDto dto) {
        AddShiftWeightPresetCommand cmd = new AddShiftWeightPresetCommand();
        cmd.name = dto.name;
        cmd.shiftWeights = dtoToShiftWeights(dto.weights);
        return cmd;
    }

    @Override
    public UpdateShiftWeightPresetCommand mapToUpdateCommand(ShiftWeightPresetDto dto) {
        UpdateShiftWeightPresetCommand cmd = new UpdateShiftWeightPresetCommand();
        cmd.name = dto.name;
        cmd.shiftWeights = dtoToShiftWeights(dto.weights);
        return cmd;
    }

    @Override
    public ShiftWeightPresetDto mapToDto(ShiftWeightPreset entity) {
        ShiftWeightPresetDto dto = new ShiftWeightPresetDto();
        dto.name = entity.name;
        dto.weights = entity.shiftWeights != null
                ? entity.shiftWeights.stream().map(this::mapWeightToDto).toList()
                : List.of();
        return dto;
    }

    private List<ShiftWeight> dtoToShiftWeights(List<ShiftWeightDto> dtos) {
        if (dtos == null) return null;
        return dtos.stream().map(w -> {
            ShiftWeight sw = new ShiftWeight();
            sw.day = w.day;
            sw.shiftType = ShiftType.fromHebrew(w.shiftType);
            sw.weight = w.weight;
            return sw;
        }).toList();
    }

    private ShiftWeightDto mapWeightToDto(ShiftWeight sw) {
        ShiftWeightDto dto = new ShiftWeightDto();
        dto.day = sw.day;
        dto.shiftType = sw.shiftType.getHebrewRepresentation();
        dto.weight = sw.weight;
        return dto;
    }
}
