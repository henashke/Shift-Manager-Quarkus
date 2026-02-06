package resources;

import commands.AddShiftCommand;
import entities.Shift;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import services.ShiftService;
import java.util.List;

@Path("/shifts")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ShiftResource {

    @Inject
    ShiftService shiftService;

    @GET
    public List<Shift> list() {
        return shiftService.listAll();
    }

    @GET
    @Path("/{id}")
    public Shift get(@PathParam("id") Long id) {
        Shift shift = shiftService.findById(id);
        if (shift == null) {
            throw new NotFoundException();
        }
        return shift;
    }

    @POST
    public Response create(AddShiftCommand command) {
        Shift shift = shiftService.create(command);
        return Response.status(Response.Status.CREATED).entity(shift).build();
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        shiftService.deleteById(id);
        return Response.noContent().build();
    }
}
