package resources;

import commands.AddUserCommand;
import commands.UpdateUserCommand;
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
        if (dto == null) {
            throw new NotFoundException();
        }
        return dto;
    }

    @POST
    public Response create(AddUserCommand command) {
        UserDto dto = userResponder.create(command);
        return Response.status(Response.Status.CREATED).entity(dto).build();
    }

    @PUT
    @Path("/{id}")
    public UserDto update(@PathParam("id") Long id, UpdateUserCommand command) {
        command.id = id;
        return userResponder.update(id, command);
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        userResponder.deleteById(id);
        return Response.noContent().build();
    }
}
