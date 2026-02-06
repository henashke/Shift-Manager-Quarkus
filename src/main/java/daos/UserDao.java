package daos;

import entities.User;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;

@ApplicationScoped
public class UserDao implements BaseDao<User> {

    public Optional<User> findByUsername(String username) {
        return find("name", username).firstResultOptional();
    }
}
