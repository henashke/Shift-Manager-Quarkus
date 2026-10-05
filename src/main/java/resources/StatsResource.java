package resources;

import auth.RoleConstants;
import dto.StatsDto;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import responders.StatsResponder;

@Path("/api/stats")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({RoleConstants.USER, RoleConstants.ADMIN})
public class StatsResource {

    @Inject
    StatsResponder statsResponder;

    @GET
    public StatsDto stats() {
        return statsResponder.stats();
    }
}
