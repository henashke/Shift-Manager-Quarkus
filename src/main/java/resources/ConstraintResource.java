package resources;

import auth.JwtClaims;
import auth.RoleConstants;
import dto.ConstraintDto;
import dto.DeleteConstraintDto;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;
import responders.ConstraintResponder;

import java.util.List;

@Path("/api/constraints")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ConstraintResource {

    @Inject
    ConstraintResponder constraintResponder;

    @Inject
    JsonWebToken jwt;

    @GET
    public List<ConstraintDto> listConstraints() {
        String username = jwt.getClaim(JwtClaims.USERNAME);
        boolean isAdmin = jwt.getGroups().contains(RoleConstants.ADMIN);
        return constraintResponder.listByUser(username, isAdmin);
    }

    @GET
    @Path("/user/{userId}")
    public List<ConstraintDto> getConstraintsByUser(@PathParam("userId") Long userId) {
        return constraintResponder.findByUserId(userId);
    }

    @POST
    public Response createConstraints(List<ConstraintDto> dtos) {
        return constraintResponder.create(dtos);
    }

    @DELETE
    public Response deleteConstraint(DeleteConstraintDto dto) {
        return constraintResponder.delete(dto);
    }

    public static class ErrorResponse {
        public String message;

        public ErrorResponse(String message) {
            this.message = message;
        }
    }
}
