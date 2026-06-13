package services;

import daos.BaseDao;
import daos.UserDao;
import entities.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class UserService extends BaseService<User> {

    @Inject
    UserDao userDao;

    @Override
    protected BaseDao<User> getDao() {
        return userDao;
    }
}
