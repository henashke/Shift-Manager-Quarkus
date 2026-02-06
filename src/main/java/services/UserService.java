package services;

import commands.AddUserCommand;
import commands.UpdateUserCommand;
import daos.BaseDao;
import daos.UserDao;
import entities.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import mappers.CommandToEntityMapper;
import mappers.UserMapper;
import org.mindrot.jbcrypt.BCrypt;

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

    public boolean authenticate(String username, String password) {
        return userDao.findByUsername(username)
                .map(user -> BCrypt.checkpw(password, user.password))
                .orElse(false);
    }
}
