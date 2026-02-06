package services;

import commands.LoginCommand;
import commands.SignupCommand;
import daos.UserDao;
import entities.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.mindrot.jbcrypt.BCrypt;

@ApplicationScoped
public class AuthService {

    @Inject
    UserDao userDao;

    @Inject
    JwtTokenProvider tokenProvider;

    public User signup(SignupCommand command) throws Exception {
        // Check if user already exists
        if (userDao.findByUsername(command.name).isPresent()) {
            throw new Exception("User already exists");
        }

        // Create new user with hashed password
        User user = new User();
        user.name = command.name;
        user.password = BCrypt.hashpw(command.password, BCrypt.gensalt());
        user.role = "user";
        user.score = 0;

        userDao.persist(user);
        return user;
    }

    public AuthResponse login(LoginCommand command) throws Exception {
        User user = userDao.findByUsername(command.name)
                .orElseThrow(() -> new Exception("Invalid credentials"));

        if (!BCrypt.checkpw(command.password, user.password)) {
            throw new Exception("Invalid credentials");
        }

        String token = tokenProvider.generateToken(user.name, user.role);
        return new AuthResponse(
                "Login successful",
                user.name,
                user.role,
                token
        );
    }

    public static class AuthResponse {
        public String message;
        public String username;
        public String role;
        public String token;

        public AuthResponse(String message, String username, String role, String token) {
            this.message = message;
            this.username = username;
            this.role = role;
            this.token = token;
        }
    }
}

