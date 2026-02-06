package services;

import commands.AddUserCommand;
import commands.UpdateUserCommand;
import daos.BaseDao;
import daos.UserDao;
import entities.User;
import mappers.CommandToEntityMapper;
import mappers.UserMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class UserService extends BaseService<User, AddUserCommand, UpdateUserCommand> {

    @Inject
    UserDao userDao;

    @Inject
    UserMapper userMapper;

    @Override
    protected BaseDao<User> getDao() {
        return userDao;
    }

    @Override
    protected CommandToEntityMapper<User, AddUserCommand, UpdateUserCommand> getMapper() {
        return userMapper;
    }
}
