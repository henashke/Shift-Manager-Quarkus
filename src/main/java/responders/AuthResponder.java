package responders;

import commands.LoginCommand;
import commands.RefreshTokenCommand;
import commands.SignupCommand;
import io.quarkus.security.AuthenticationFailedException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import services.AuthService;
import services.UserAlreadyExistsException;

import java.util.Map;

import static responders.ErrorResponses.error;

@ApplicationScoped
@RequiredArgsConstructor
public class AuthResponder {

    private final AuthService authService;

    public Response signup(SignupCommand command) {
        try {
            authService.signup(command);
            return Response.status(Response.Status.CREATED)
                    .entity(Map.of("message", "User created successfully"))
                    .build();
        } catch (IllegalArgumentException e) {
            return error(Response.Status.BAD_REQUEST, e.getMessage());
        } catch (UserAlreadyExistsException e) {
            return error(Response.Status.CONFLICT, "Username already exists");
        } catch (Exception e) {
            return error(Response.Status.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    public Response login(LoginCommand command) {
        try {
            return Response.ok(authService.login(command)).build(); // todo bad practice to return in in the response body, the token should be in the header
        } catch (IllegalArgumentException e) {
            return error(Response.Status.BAD_REQUEST, e.getMessage());
        } catch (AuthenticationFailedException e) {
            return error(Response.Status.UNAUTHORIZED, "Invalid username or password");
        } catch (Exception e) {
            return error(Response.Status.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    public Response refresh(RefreshTokenCommand command) {
        try {
            return Response.ok(authService.refresh(command)).build();
        } catch (AuthenticationFailedException e) {
            return error(Response.Status.UNAUTHORIZED, "Invalid or expired refresh token");
        } catch (Exception e) {
            return error(Response.Status.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    public Response logout(RefreshTokenCommand command) {
        authService.logout(command);
        return Response.noContent().build();
    }
}
