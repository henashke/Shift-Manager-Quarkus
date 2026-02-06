package services;

import commands.AddShiftCommand;
import commands.UpdateShiftCommand;
import daos.AssignedShiftDao;
import daos.BaseDao;
import entities.AssignedShift;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import mappers.AssignedShiftMapper;
import mappers.CommandToEntityMapper;

@ApplicationScoped
public class ShiftService extends BaseService<AssignedShift, AddShiftCommand, UpdateShiftCommand> {

    @Inject
    AssignedShiftDao assignedShiftDao;

    @Inject
    AssignedShiftMapper assignedShiftMapper;

    @Override
    protected BaseDao<AssignedShift> getDao() {
        return assignedShiftDao;
    }

    @Override
    protected CommandToEntityMapper<AssignedShift, AddShiftCommand, UpdateShiftCommand> getMapper() {
        return assignedShiftMapper;
    }
}
