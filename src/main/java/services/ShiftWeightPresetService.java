package services;

import commands.AddShiftWeightPresetCommand;
import commands.UpdateShiftWeightPresetCommand;
import daos.BaseDao;
import daos.ShiftWeightPresetDao;
import entities.ShiftWeightPreset;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class ShiftWeightPresetService extends BaseService<ShiftWeightPreset, AddShiftWeightPresetCommand, UpdateShiftWeightPresetCommand> {

    @Inject
    ShiftWeightPresetDao shiftWeightPresetDao;

    @Override
    protected BaseDao<ShiftWeightPreset> getDao() {
        return shiftWeightPresetDao;
    }

    @Override
    protected ShiftWeightPreset mapToEntity(AddShiftWeightPresetCommand addCommand) {
        ShiftWeightPreset preset = new ShiftWeightPreset();
        preset.name = addCommand.name;
        preset.shiftWeights = addCommand.shiftWeights;
        if (preset.shiftWeights != null) {
            preset.shiftWeights.forEach(sw -> sw.preset = preset);
        }
        return preset;
    }

    @Override
    protected void updateEntity(ShiftWeightPreset entity, UpdateShiftWeightPresetCommand updateCommand) {
        entity.name = updateCommand.name;
        if (updateCommand.shiftWeights != null) {
            entity.shiftWeights.clear();
            entity.shiftWeights.addAll(updateCommand.shiftWeights);
            entity.shiftWeights.forEach(sw -> sw.preset = entity);
        }
    }
}
