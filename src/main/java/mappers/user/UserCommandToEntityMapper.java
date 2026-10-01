package mappers.user;

import commands.AddUserCommand;
import commands.UpdateUserCommand;
import entities.User;
import jakarta.enterprise.context.ApplicationScoped;
import mappers.CommandToEntityMapper;

@ApplicationScoped
public class UserCommandToEntityMapper implements CommandToEntityMapper<User, AddUserCommand, UpdateUserCommand> {

    @Override
    public User mapToEntity(AddUserCommand addCommand) {
        User user = new User();
        user.name = addCommand.name;
        user.password = addCommand.password;
        user.score = addCommand.score;
        return user;
    }

    @Override
    public void updateEntity(User entity, UpdateUserCommand updateCommand) {
        // Partial update: only fields present in the request are applied. Password is never changed here.
        if (updateCommand.name != null) entity.name = updateCommand.name;
        if (updateCommand.score != null) entity.score = updateCommand.score;
    }
}
