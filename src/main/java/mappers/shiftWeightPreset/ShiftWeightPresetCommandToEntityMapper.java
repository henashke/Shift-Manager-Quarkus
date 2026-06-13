package mappers.shiftWeightPreset;

import commands.AddShiftWeightPresetCommand;
import commands.UpdateShiftWeightPresetCommand;
import entities.ShiftWeightPreset;
import jakarta.enterprise.context.ApplicationScoped;
import mappers.CommandToEntityMapper;

@ApplicationScoped
public class ShiftWeightPresetCommandToEntityMapper implements CommandToEntityMapper<ShiftWeightPreset, AddShiftWeightPresetCommand, UpdateShiftWeightPresetCommand> {

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
}
