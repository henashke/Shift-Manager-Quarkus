package resources;

import dto.UserDto;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import responders.UserResponder;

import java.util.List;

@Path("/api/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserResource {

    @Inject
    UserResponder userResponder;

    @GET
    public List<UserDto> list() {
        return userResponder.listAll();
    }

    @POST
    public Response create(UserDto dto) {
        return userResponder.create(dto);
    }

    @PUT
    @Path("/{username}")
    public Response update(@PathParam("username") String username, UserDto dto) { // TODO change password feature
        return userResponder.updateByUsername(username, dto);
    }

    @DELETE
    @Path("/{username}")
    public Response delete(@PathParam("username") String username) {
        return userResponder.deleteByUsername(username);
    }
}
