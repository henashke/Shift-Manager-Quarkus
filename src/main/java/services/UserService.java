package services;

import auth.RoleConstants;
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

import java.util.List;

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

    // The people who get scheduled: everyone except accounts marked as not schedulable (the built-in system admin)
    public List<User> listSchedulable() {
        return dao.listSchedulable();
    }

    @Transactional
    public void setReserve(User user, boolean reserve) {
        user.reserve = reserve;
    }

    // Nobody can remove their own admin access, and the last admin can't be demoted, so the system can't be locked out
    @Transactional
    public void setRole(User user, String role, String actingUsername) {
        if (RoleConstants.USER.equals(role) && RoleConstants.ADMIN.equals(user.role)) {
            if (user.name.equals(actingUsername)) {
                throw new UserRoleChangeException("לא ניתן להסיר את הרשאות המנהל של עצמך");
            }
            if (dao.countAdmins() <= 1) {
                throw new UserRoleChangeException("חייב להישאר לפחות מנהל אחד");
            }
        }
        user.role = role;
    }

    public User findByUsername(String username) {
        return dao.findByUsername(username).orElse(null);
    }

    @Transactional
    public void deleteByUsername(String username) {
        dao.deleteByUsername(username);
    }
}
