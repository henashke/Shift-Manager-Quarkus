package services;

import commands.AddUserCommand;
import daos.BaseDao;
import daos.UserDao;
import entities.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import mappers.CommandToEntityMapper;
import mappers.UserMapper;

@ApplicationScoped
public class UserService extends BaseService<User, AddUserCommand> {

    @Inject
    UserDao userDao;

    @Inject
    UserMapper userMapper;

    @Override
    protected BaseDao<User> getDao() {
        return userDao;
    }

    @Override
    protected CommandToEntityMapper<User, AddUserCommand, ?, ?> getMapper() {
        return userMapper;
    }

    public User findByUsername(String username) {
        return userDao.findByUsername(username).orElse(null);
    }

    @Transactional
    public void deleteByUsername(String username) {
        userDao.findByUsername(username).ifPresent(u -> userDao.deleteById(u.id));
    }
}
