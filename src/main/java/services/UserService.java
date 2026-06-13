package services;

import commands.AddUserCommand;
import commands.UpdateUserCommand;
import daos.BaseDao;
import daos.UserDao;
import entities.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import mappers.CommandToEntityMapper;
import mappers.user.UserCommandToEntityMapper;

@ApplicationScoped
public class UserService extends BaseService<User, AddUserCommand, UpdateUserCommand> {

    @Inject
    UserDao dao;

    @Inject
    UserCommandToEntityMapper commandToEntityMapper;

    @Override
    protected BaseDao<User> getDao() {
        return dao;
    }

    @Override
    protected CommandToEntityMapper<User, AddUserCommand, UpdateUserCommand> getMapper() {
        return commandToEntityMapper;
    }

    public User findByUsername(String username) {
        return dao.findByUsername(username).orElse(null);
    }

    @Transactional
    public void deleteByUsername(String username) {
        dao.deleteByUsername(username);
    }
}
