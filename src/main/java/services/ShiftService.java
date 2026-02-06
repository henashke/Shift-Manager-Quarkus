package services;

import commands.AddShiftCommand;
import commands.UpdateShiftCommand;
import daos.BaseDao;
import daos.ShiftDao;
import entities.Shift;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class ShiftService extends BaseService<Shift, AddShiftCommand, UpdateShiftCommand> {

    @Inject
    ShiftDao shiftDao;

    @Override
    protected BaseDao<Shift> getDao() {
        return shiftDao;
    }

    @Override
    protected Shift mapToEntity(AddShiftCommand addCommand) {
        Shift shift = new Shift();
        shift.date = addCommand.date;
        shift.type = addCommand.type;
        return shift;
    }

    @Override
    protected void updateEntity(Shift entity, UpdateShiftCommand updateCommand) {
        entity.date = updateCommand.date;
        entity.type = updateCommand.type;
    }
}
