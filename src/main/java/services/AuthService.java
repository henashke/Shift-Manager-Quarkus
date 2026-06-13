package services;

import auth.JwtTokenProvider;
import commands.LoginCommand;
import commands.SignupCommand;
import daos.UserDao;
import entities.User;
import io.quarkus.security.AuthenticationFailedException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.mindrot.jbcrypt.BCrypt;

@ApplicationScoped
@RequiredArgsConstructor
public class AuthService {

    @Inject
    UserDao userDao;

    @Inject
    JwtTokenProvider tokenProvider;

    @Transactional
    public void signup(SignupCommand command) throws Exception {
        if (userDao.findByUsername(command.name).isPresent()) {
            throw new Exception("User already exists with this username");
        }

        User user = new User();
        user.name = command.name;
        user.password = BCrypt.hashpw(command.password, BCrypt.gensalt());
        user.role = "user";
        user.score = 0;

        userDao.persist(user);
    }

    public AuthResponse login(LoginCommand command) throws AuthenticationFailedException {
        User user = authenticate(command.name, command.password);
        String token = tokenProvider.generateToken(user.name, user.role);

        return new AuthResponse(
                "Login successful",
                user.name,
                user.role,
                token
        );
    }

    private User authenticate(String username, String password) throws AuthenticationFailedException {
        User user = userDao.findByUsername(username).orElse(null);
        if (user == null) throw new AuthenticationFailedException();
        if (BCrypt.checkpw(password, user.password)) {
            return user;
        } else {
            throw new AuthenticationFailedException();
        }
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

