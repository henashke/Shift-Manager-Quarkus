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
import java.util.Objects;
import java.util.function.BiPredicate;

@Path("/api/constraints")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ConstraintResource {

    @Inject
    ConstraintResponder constraintResponder;

    @Inject
    JsonWebToken jwt;

    @GET
    public List<ConstraintDto> listConstraints(@QueryParam("weekOffset") Integer weekOffset) {
        String username = jwt.getClaim(JwtClaims.USERNAME);
        boolean isAdmin = jwt.getGroups().contains(RoleConstants.ADMIN);
        return constraintResponder.listByUser(username, isAdmin, weekOffset);
    }

    @POST
    public Response createConstraints(List<ConstraintDto> dtos) {
        throwIfTriedToPerformActionOnOtherUser(dtos, (payload, username) ->
                payload.stream().anyMatch(constraint -> !Objects.equals(constraint.userId, username)));
        return constraintResponder.createAll(dtos);
    }

    @DELETE
    public Response deleteConstraint(DeleteConstraintDto dto) {
        throwIfTriedToPerformActionOnOtherUser(dto, (payload, username) ->
                !Objects.equals(payload.userId, username));
        return constraintResponder.delete(dto);
    }

    private <T> void throwIfTriedToPerformActionOnOtherUser(T payload, BiPredicate<T, String> isOtherUserPresentInPayload) {
        String username = jwt.getClaim(JwtClaims.USERNAME);
        boolean isAdmin = jwt.getGroups().contains(RoleConstants.ADMIN);
        boolean constraintForOtherUserExists = isOtherUserPresentInPayload.test(payload, username);

        if (!isAdmin && constraintForOtherUserExists) {
            throw new BadRequestException("Creating requests for other users is not allowed.");
        }
    }
}