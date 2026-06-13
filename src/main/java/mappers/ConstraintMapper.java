package mappers;

import commands.AddConstraintCommand;
import commands.UpdateConstraintCommand;
import daos.ConstraintDao;
import daos.UserDao;
import dto.ConstraintDto;
import dto.ShiftDto;
import entities.Constraint;
import entities.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.NotFoundException;

import java.util.List;

@ApplicationScoped
public class ConstraintMapper implements CommandToEntityMapper<Constraint, AddConstraintCommand, UpdateConstraintCommand, ConstraintDto> {

    @Inject
    ConstraintDao constraintDao;
    @Inject
    UserDao userDao;

    @Override
    public Constraint mapToEntity(AddConstraintCommand addCommand) {
        User user = userDao.findById(addCommand.userId);
        if (user == null) throw new NotFoundException("User not found");

        Constraint existing = constraintDao.findByUserIdAndDateAndType(addCommand.userId, addCommand.date, addCommand.type);
        if (existing != null) {
            existing.constraintType = addCommand.constraintType;
            return existing;
        }

        Constraint constraint = new Constraint();
        constraint.user = user;
        constraint.date = addCommand.date;
        constraint.type = addCommand.type;
        constraint.constraintType = addCommand.constraintType;
        constraintDao.persist(constraint);
        return constraint;
    }

    @Override
    public void updateEntity(Constraint entity, UpdateConstraintCommand updateCommand) {
        throw new UnsupportedOperationException("Can't update a constraint, only create or delete");
    }

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

    public List<ConstraintDto> mapToDto(List<Constraint> entities) {
        return entities.stream().map(this::mapToDto).toList();
    }
}
