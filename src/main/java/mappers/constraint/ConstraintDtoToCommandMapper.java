package mappers.constraint;

import commands.AddConstraintCommand;
import commands.UpdateConstraintCommand;
import daos.UserDao;
import dto.ConstraintDto;
import dto.ShiftDto;
import entities.Constraint;
import entities.User;
import enums.ConstraintType;
import enums.ShiftType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.NotFoundException;
import mappers.DtoToCommandMapper;

@ApplicationScoped
public class ConstraintDtoToCommandMapper implements DtoToCommandMapper<ConstraintDto, Constraint, AddConstraintCommand, UpdateConstraintCommand> {

    @Inject
    UserDao userDao;

    @Override
    public AddConstraintCommand mapToAddCommand(ConstraintDto dto) {
        User user = userDao.findByUsername(dto.userId)
                .orElseThrow(() -> new NotFoundException("User not found: " + dto.userId));
        AddConstraintCommand cmd = new AddConstraintCommand();
        cmd.userId = user.id;
        cmd.date = dto.shift.date;
        cmd.type = ShiftType.fromHebrew(dto.shift.type);
        cmd.constraintType = ConstraintType.fromValue(dto.constraintType);
        return cmd;
    }

    @Override
    public UpdateConstraintCommand mapToUpdateCommand(ConstraintDto dto) {
        throw new UnsupportedOperationException("Constraints cannot be updated, only created or deleted");
    }

    @Override
    public ConstraintDto mapToDto(Constraint entity) {
        ConstraintDto dto = new ConstraintDto();
        dto.userId = entity.user.name;
        ShiftDto shiftDto = new ShiftDto();
        shiftDto.date = entity.date;
        shiftDto.type = entity.type.getHebrewRepresentation();
        dto.shift = shiftDto;
        dto.constraintType = entity.constraintType.getHebrewRepresentation();
        return dto;
    }
}
