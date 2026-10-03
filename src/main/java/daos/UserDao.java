package daos;

import auth.RoleConstants;
import entities.User;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class UserDao implements BaseDao<User> {

    public Optional<User> findByUsername(String username) {
        return find("name", username).firstResultOptional();
    }

    public List<User> listNonAdmins() {
        return list("role is null or role <> ?1", RoleConstants.ADMIN);
    }

    public void deleteByUsername(String username) {
        delete("name", username);
    }
}
