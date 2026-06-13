package services;

import daos.BaseDao;
import daos.UserDao;
import entities.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class UserService extends BaseService<User> {

    @Inject
    UserDao userDao;

    @Override
    protected BaseDao<User> getDao() {
        return userDao;
    }

    public User findByUsername(String username) {
        return userDao.findByUsername(username).orElse(null);
    }

    @Transactional
    public void deleteByUsername(String username) {
        userDao.findByUsername(username).ifPresent(u -> userDao.deleteById(u.id));
    }
}
