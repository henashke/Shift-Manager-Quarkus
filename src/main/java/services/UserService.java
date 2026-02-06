package services;

import commands.AddUserCommand;
import commands.UpdateUserCommand;
import daos.BaseDao;
import daos.UserDao;
import entities.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class UserService extends BaseService<User, AddUserCommand, UpdateUserCommand> {

    @Inject
    UserDao userDao;

    @Override
    protected BaseDao<User> getDao() {
        return userDao;
    }

    @Override
    protected User mapToEntity(AddUserCommand addCommand) {
        User user = new User();
        user.name = addCommand.name;
        user.password = addCommand.password;
        user.score = addCommand.score;
        return user;
    }

    @Override
    protected void updateEntity(User entity, UpdateUserCommand updateCommand) {
        entity.name = updateCommand.name;
        entity.password = updateCommand.password;
        entity.score = updateCommand.score;
    }
}
