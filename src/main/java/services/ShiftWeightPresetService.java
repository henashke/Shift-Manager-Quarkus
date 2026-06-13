package services;

import commands.AddShiftWeightPresetCommand;
import commands.UpdateShiftWeightPresetCommand;
import daos.BaseDao;
import daos.ShiftWeightPresetDao;
import dto.ShiftWeightPresetDto;
import entities.ShiftWeightPreset;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import mappers.CommandToEntityMapper;
import mappers.ShiftWeightPresetMapper;

@ApplicationScoped
public class ShiftWeightPresetService extends BaseService<ShiftWeightPreset, AddShiftWeightPresetCommand, UpdateShiftWeightPresetCommand, ShiftWeightPresetDto> {

    @Inject
    ShiftWeightPresetDao shiftWeightPresetDao;

    @Inject
    ShiftWeightPresetMapper shiftWeightPresetMapper;

    @Override
    protected BaseDao<ShiftWeightPreset> getDao() {
        return shiftWeightPresetDao;
    }

    @Override
    protected CommandToEntityMapper<ShiftWeightPreset, AddShiftWeightPresetCommand, UpdateShiftWeightPresetCommand, ShiftWeightPresetDto> getMapper() {
        return shiftWeightPresetMapper;
    }
}
