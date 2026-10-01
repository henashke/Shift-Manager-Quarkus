package resources;

import auth.RoleConstants;
import commands.LoginCommand;
import commands.SignupCommand;
import io.quarkus.security.AuthenticationFailedException;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;
import services.AuthService;

import java.util.HashMap;
import java.util.Map;

@Path("/api/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    AuthService authService;

    @Inject
    JsonWebToken jwt;

    @POST
    @Path("/signup")
    public Response signup(SignupCommand command) {
        try {
            authService.signup(command);
            Map<String, String> response = new HashMap<>();
            response.put("message", "User created successfully");
            return Response.status(Response.Status.CREATED).entity(response).build();
        } catch (Exception e) {
            if (e.getMessage().contains("already exists")) {
                return Response.status(Response.Status.CONFLICT)
                        .entity("Username already exists").build();
            }
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(e.getMessage()).build();
        }
    }

    @POST
    @Path("/login")
    public Response login(LoginCommand command) {
        try {
            AuthService.AuthResponse authResponse = authService.login(command);
            return Response.ok(authResponse).build(); // todo bad practice to return in in the response body, the token should be in the header
        } catch (AuthenticationFailedException e) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity("Invalid credentials").build();
        }
    }

    @POST
    @Path("/test")
    @RolesAllowed({RoleConstants.ADMIN})
    public Response login(String msg) {
        String username = jwt.getClaim("username");
        return Response.ok("username: %s. Message: %s".formatted(username, msg)).build();
    }
}