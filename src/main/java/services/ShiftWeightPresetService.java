package services;

import commands.AddShiftWeightPresetCommand;
import commands.UpdateShiftWeightPresetCommand;
import daos.BaseDao;
import daos.ShiftWeightPresetDao;
import entities.ShiftWeightPreset;
import mappers.CommandToEntityMapper;
import mappers.ShiftWeightPresetMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class ShiftWeightPresetService extends BaseService<ShiftWeightPreset, AddShiftWeightPresetCommand, UpdateShiftWeightPresetCommand> {

    @Inject
    ShiftWeightPresetDao shiftWeightPresetDao;

    @Inject
    ShiftWeightPresetMapper shiftWeightPresetMapper;

    @Override
    protected BaseDao<ShiftWeightPreset> getDao() {
        return shiftWeightPresetDao;
    }

    @Override
    protected CommandToEntityMapper<ShiftWeightPreset, AddShiftWeightPresetCommand, UpdateShiftWeightPresetCommand> getMapper() {
        return shiftWeightPresetMapper;
    }
}
