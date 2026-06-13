package mappers.constraint;

import commands.AddConstraintCommand;
import commands.UpdateConstraintCommand;
import daos.ConstraintDao;
import daos.UserDao;
import entities.Constraint;
import entities.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.NotFoundException;
import mappers.CommandToEntityMapper;

@ApplicationScoped
public class ConstraintCommandToEntityMapper implements CommandToEntityMapper<Constraint, AddConstraintCommand, UpdateConstraintCommand> {

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
        return constraint;
    }

    @Override
    public void updateEntity(Constraint entity, UpdateConstraintCommand updateCommand) {
        throw new UnsupportedOperationException("Constraints cannot be updated, only created or deleted");
    }
}
