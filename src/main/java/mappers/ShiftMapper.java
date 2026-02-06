package mappers;

import commands.AddShiftCommand;
import commands.UpdateShiftCommand;
import entities.Shift;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ShiftMapper implements CommandToEntityMapper<Shift, AddShiftCommand, UpdateShiftCommand> {

    @Override
    public Shift mapToEntity(AddShiftCommand addCommand) {
        Shift shift = new Shift();
        shift.date = addCommand.date;
        shift.type = addCommand.type;
        return shift;
    }

    @Override
    public void updateEntity(Shift entity, UpdateShiftCommand updateCommand) {
        entity.date = updateCommand.date;
        entity.type = updateCommand.type;
    }
}
