package services;

import commands.AddShiftCommand;
import commands.UpdateShiftCommand;
import daos.BaseDao;
import daos.ShiftDao;
import entities.Shift;
import mappers.CommandToEntityMapper;
import mappers.ShiftMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class ShiftService extends BaseService<Shift, AddShiftCommand, UpdateShiftCommand> {

    @Inject
    ShiftDao shiftDao;

    @Inject
    ShiftMapper shiftMapper;

    @Override
    protected BaseDao<Shift> getDao() {
        return shiftDao;
    }

    @Override
    protected CommandToEntityMapper<Shift, AddShiftCommand, UpdateShiftCommand> getMapper() {
        return shiftMapper;
    }
}
