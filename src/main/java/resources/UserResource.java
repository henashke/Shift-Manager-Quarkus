package resources;

import auth.JwtClaims;
import auth.RoleConstants;
import commands.SetReserveCommand;
import commands.SetRoleCommand;
import dto.UserDto;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;
import responders.UserResponder;

import java.util.List;

@Path("/api/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed({RoleConstants.USER, RoleConstants.ADMIN})
public class UserResource {

    @Inject
    UserResponder userResponder;

    @Inject
    JsonWebToken jwt;

    @GET
    public List<UserDto> list() {
        return userResponder.listSchedulable();
    }

    @POST
    @RolesAllowed({RoleConstants.ADMIN})
    public Response create(UserDto dto) {
        return userResponder.create(dto);
    }

    @PUT
    @Path("/{username}")
    @RolesAllowed({RoleConstants.ADMIN})
    public Response update(@PathParam("username") String username, UserDto dto) {
        return userResponder.updateByUsername(username, dto);
    }

    @PUT
    @Path("/{username}/reserve")
    @RolesAllowed({RoleConstants.ADMIN})
    public Response setReserve(@PathParam("username") String username, SetReserveCommand command) {
        return userResponder.setReserve(username, command);
    }

    @PUT
    @Path("/{username}/role")
    @RolesAllowed({RoleConstants.ADMIN})
    public Response setRole(@PathParam("username") String username, SetRoleCommand command) {
        return userResponder.setRole(username, command, jwt.getClaim(JwtClaims.USERNAME));
    }

    @DELETE
    @Path("/{username}")
    @RolesAllowed({RoleConstants.ADMIN})
    public Response delete(@PathParam("username") String username) {
        return userResponder.deleteByUsername(username);
    }
}
