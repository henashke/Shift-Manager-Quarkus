package mappers;

import commands.AddUserCommand;
import commands.UpdateUserCommand;
import entities.User;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class UserMapper implements CommandToEntityMapper<User, AddUserCommand, UpdateUserCommand> {

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
        entity.name = updateCommand.name;
        entity.password = updateCommand.password;
        entity.score = updateCommand.score;
    }
}
