package resources;

import commands.ConstraintCommand;
import commands.DeleteConstraintCommand;
import entities.Constraint;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import services.ConstraintService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Path("/api/constraints")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ConstraintResource {

    @Inject
    ConstraintService constraintService;

    @GET
    public List<Constraint> listConstraints() {
        return constraintService.findAll();
    }

    @GET
    @Path("/user/{userId}")
    public List<Constraint> getConstraintsByUser(@PathParam("userId") Long userId) {
        return constraintService.findByUserId(userId);
    }

    @POST
    public Response createConstraints(Object payload) {
        try {
            if (payload instanceof java.util.List) {
                List<ConstraintCommand> commands = (List<ConstraintCommand>) payload;
                for (ConstraintCommand command : commands) {
                    constraintService.create(command);
                }
            } else if (payload instanceof ConstraintCommand) {
                constraintService.create((ConstraintCommand) payload);
            }
            Map<String, String> response = new HashMap<>();
            response.put("message", "Constraint(s) created successfully");
            return Response.status(Response.Status.CREATED).entity(response).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(e.getMessage())).build();
        }
    }

    @DELETE
    public Response deleteConstraint(DeleteConstraintCommand command) {
        try {
            constraintService.delete(command);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Constraint deleted successfully");
            return Response.ok(response).build();
        } catch (Exception e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(new ErrorResponse(e.getMessage())).build();
        }
    }

    public static class ErrorResponse {
        public String message;

        public ErrorResponse(String message) {
            this.message = message;
        }
    }
}


