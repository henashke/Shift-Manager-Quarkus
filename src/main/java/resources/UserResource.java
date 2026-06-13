package resources;

import commands.AddUserCommand;
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

    @GET
    @Path("/{id}")
    public UserDto get(@PathParam("id") Long id) {
        UserDto dto = userResponder.findById(id);
        if (dto == null) throw new NotFoundException();
        return dto;
    }

    @POST
    public Response create(AddUserCommand command) {
        UserDto dto = userResponder.create(command);
        return Response.status(Response.Status.CREATED).entity(dto).build();
    }

    @PUT
    @Path("/{username}")
    public UserDto update(@PathParam("username") String username, UserDto dto) {
        return userResponder.updateByUsername(username, dto);
    }

    @DELETE
    @Path("/{username}")
    public Response delete(@PathParam("username") String username) {
        userResponder.deleteByUsername(username);
        return Response.noContent().build();
    }
}
