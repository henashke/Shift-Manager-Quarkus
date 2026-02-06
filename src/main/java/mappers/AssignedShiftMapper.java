package mappers;

import commands.AddShiftCommand;
import commands.UpdateShiftCommand;
import daos.ShiftWeightPresetDao;
import daos.UserDao;
import entities.AssignedShift;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class AssignedShiftMapper implements CommandToEntityMapper<AssignedShift, AddShiftCommand, UpdateShiftCommand> {

    @Inject
    ShiftWeightPresetDao shiftWeightPresetDao;

    @Inject
    UserDao userDao;

    @Override
    public AssignedShift mapToEntity(AddShiftCommand addCommand) {
        AssignedShift shift = new AssignedShift();
        mapFields(shift, addCommand.date, addCommand.type, addCommand.userId, addCommand.shiftWeightPresetId);
        return shift;
    }

    @Override
    public void updateEntity(AssignedShift entity, UpdateShiftCommand updateCommand) {
        if (updateCommand.userId != null) {
            entity.assignedUser = userDao.findById(updateCommand.userId);
        } else {
            entity.assignedUser = null;
        }

        if (updateCommand.shiftWeightPresetId != null) {
            entity.shiftWeightPreset = shiftWeightPresetDao.findById(updateCommand.shiftWeightPresetId);
        } else {
            entity.shiftWeightPreset = null;
        }
    }

    private void mapFields(AssignedShift entity, java.time.LocalDate date, enums.ShiftType type, Long userId, Long presetId) {
        entity.date = date;
        entity.type = type;

        if (userId != null) {
            entity.assignedUser = userDao.findById(userId);
        } else {
            entity.assignedUser = null;
        }

        if (presetId != null) {
            entity.shiftWeightPreset = shiftWeightPresetDao.findById(presetId);
        } else {
            entity.shiftWeightPreset = null;
        }
    }
}
