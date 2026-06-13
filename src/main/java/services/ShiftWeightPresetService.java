package services;

import commands.AddShiftWeightPresetCommand;
import commands.UpdateShiftWeightPresetCommand;
import daos.BaseDao;
import daos.ShiftWeightPresetDao;
import entities.ShiftWeightPreset;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import mappers.shiftWeightPreset.ShiftWeightPresetCommandToEntityMapper;

@ApplicationScoped
public class ShiftWeightPresetService extends BaseService<ShiftWeightPreset, AddShiftWeightPresetCommand, UpdateShiftWeightPresetCommand> {

    @Inject
    ShiftWeightPresetDao dao;

    @Inject
    ShiftWeightPresetCommandToEntityMapper commandToEntityMapper;

    @Override
    protected BaseDao<ShiftWeightPreset> getDao() {
        return dao;
    }

    @Override
    protected ShiftWeightPresetCommandToEntityMapper getMapper() {
        return commandToEntityMapper;
    }
}
