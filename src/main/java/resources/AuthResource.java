package resources;

import auth.RoleConstants;
import commands.LoginCommand;
import commands.SignupCommand;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;
import responders.AuthResponder;

@Path("/api/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    AuthResponder authResponder;

    @Inject
    JsonWebToken jwt;

    @POST
    @Path("/signup")
    public Response signup(SignupCommand command) {
        return authResponder.signup(command);
    }

    @POST
    @Path("/login")
    public Response login(LoginCommand command) {
        return authResponder.login(command);
    }

    @POST
    @Path("/test")
    @RolesAllowed({RoleConstants.ADMIN})
    public Response login(String msg) {
        String username = jwt.getClaim("username");
        return Response.ok("username: %s. Message: %s".formatted(username, msg)).build();
    }
}