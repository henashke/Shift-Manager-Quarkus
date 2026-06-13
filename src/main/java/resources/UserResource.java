package resources;

import commands.AddUserCommand;
import commands.UpdateUserCommand;
import dto.UserDto;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import services.UserService;

import java.util.List;

@Path("/api/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserResource {

    @Inject
    UserService userService;

    @GET
    public List<UserDto> list() {
        return userService.listAllDto();
    }

    @GET
    @Path("/{id}")
    public UserDto get(@PathParam("id") Long id) {
        UserDto dto = userService.findByIdDto(id);
        if (dto == null) {
            throw new NotFoundException();
        }
        return dto;
    }

    @POST
    public Response create(AddUserCommand command) {
        UserDto dto = userService.createDto(command);
        return Response.status(Response.Status.CREATED).entity(dto).build();
    }

    @PUT
    @Path("/{id}")
    public UserDto update(@PathParam("id") Long id, UpdateUserCommand command) {
        command.id = id;
        UserDto dto = userService.updateDto(command);
        if (dto == null) {
            throw new NotFoundException();
        }
        return dto;
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        userService.deleteById(id);
        return Response.noContent().build();
    }
}
