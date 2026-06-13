package services;

import commands.AddUserCommand;
import commands.UpdateUserCommand;
import daos.BaseDao;
import daos.UserDao;
import dto.UserDto;
import entities.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import mappers.CommandToEntityMapper;
import mappers.UserMapper;

@ApplicationScoped
public class UserService extends BaseService<User, AddUserCommand, UpdateUserCommand, UserDto> {

    @Inject
    UserDao userDao;

    @Inject
    UserMapper userMapper;

    @Override
    protected BaseDao<User> getDao() {
        return userDao;
    }

    @Override
    protected CommandToEntityMapper<User, AddUserCommand, UpdateUserCommand, UserDto> getMapper() {
        return userMapper;
    }

}
