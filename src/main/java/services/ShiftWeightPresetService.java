package services;

import commands.AddShiftWeightPresetCommand;
import daos.BaseDao;
import daos.ShiftWeightPresetDao;
import entities.ShiftWeightPreset;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import mappers.CommandToEntityMapper;
import mappers.ShiftWeightPresetMapper;

@ApplicationScoped
public class ShiftWeightPresetService extends BaseService<ShiftWeightPreset, AddShiftWeightPresetCommand> {

    @Inject
    ShiftWeightPresetDao shiftWeightPresetDao;

    @Inject
    ShiftWeightPresetMapper shiftWeightPresetMapper;

    @Override
    protected BaseDao<ShiftWeightPreset> getDao() {
        return shiftWeightPresetDao;
    }

    @Override
    protected CommandToEntityMapper<ShiftWeightPreset, AddShiftWeightPresetCommand, ?, ?> getMapper() {
        return shiftWeightPresetMapper;
    }
}
