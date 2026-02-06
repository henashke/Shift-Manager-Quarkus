package resources;

import commands.LoginCommand;
import commands.SignupCommand;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import services.AuthService;

import java.util.HashMap;
import java.util.Map;

@Path("/api/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    AuthService authService;

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
                        .entity(new ErrorResponse("Username already exists")).build();
            }
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(e.getMessage())).build();
        }
    }

    @POST
    @Path("/login")
    public Response login(LoginCommand command) {
        try {
            AuthService.AuthResponse authResponse = authService.login(command);
            return Response.ok(authResponse).build();
        } catch (Exception e) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(new ErrorResponse("Invalid credentials")).build();
        }
    }

    public static class ErrorResponse {
        public String message;

        public ErrorResponse(String message) {
            this.message = message;
        }
    }
}

