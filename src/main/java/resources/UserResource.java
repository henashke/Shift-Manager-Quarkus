package resources;

import commands.AddUserCommand;
import commands.UpdateUserCommand;
import entities.User;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import services.UserService;
import java.util.List;

@Path("/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserResource {

    @Inject
    UserService userService;

    @GET
    public List<User> list() {
        return userService.listAll();
    }

    @GET
    @Path("/{id}")
    public User get(@PathParam("id") Long id) {
        User user = userService.findById(id);
        if (user == null) {
            throw new NotFoundException();
        }
        return user;
    }

    @POST
    public Response create(AddUserCommand command) {
        User user = userService.create(command);
        return Response.status(Response.Status.CREATED).entity(user).build();
    }

    @PUT
    @Path("/{id}")
    public User update(@PathParam("id") Long id, UpdateUserCommand command) {
        command.id = id;
        User user = userService.update(command);
        if (user == null) {
            throw new NotFoundException();
        }
        return user;
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        userService.deleteById(id);
        return Response.noContent().build();
    }
}
