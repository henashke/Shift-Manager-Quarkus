package mappers.shift;

import commands.AddShiftCommand;
import commands.UpdateShiftCommand;
import daos.ShiftWeightPresetDao;
import daos.UserDao;
import entities.AssignedShift;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import mappers.CommandToEntityMapper;

@ApplicationScoped
public class ShiftCommandToEntityMapper implements CommandToEntityMapper<AssignedShift, AddShiftCommand, UpdateShiftCommand> {

    @Inject
    UserDao userDao;

    @Inject
    ShiftWeightPresetDao shiftWeightPresetDao;

    @Override
    public AssignedShift mapToEntity(AddShiftCommand addCommand) {
        AssignedShift shift = new AssignedShift();
        shift.date = addCommand.date;
        shift.type = addCommand.type;
        shift.assignedUser = addCommand.userId != null ? userDao.findById(addCommand.userId) : null;
        shift.shiftWeightPreset = addCommand.shiftWeightPresetId != null
                ? shiftWeightPresetDao.findById(addCommand.shiftWeightPresetId) : null;
        return shift;
    }

    @Override
    public void updateEntity(AssignedShift entity, UpdateShiftCommand updateCommand) {
        entity.assignedUser = updateCommand.userId != null ? userDao.findById(updateCommand.userId) : null;
        entity.shiftWeightPreset = updateCommand.shiftWeightPresetId != null
                ? shiftWeightPresetDao.findById(updateCommand.shiftWeightPresetId) : null;
    }
}
