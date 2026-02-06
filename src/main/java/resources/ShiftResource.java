package resources;

import commands.AddShiftCommand;
import commands.UpdateShiftCommand;
import entities.AssignedShift;
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
    public List<AssignedShift> list() {
        return shiftService.listAll();
    }

    @GET
    @Path("/{id}")
    public AssignedShift get(@PathParam("id") Long id) {
        AssignedShift shift = shiftService.findById(id);
        if (shift == null) {
            throw new NotFoundException();
        }
        return shift;
    }

    @POST
    public Response create(AddShiftCommand command) {
        AssignedShift shift = shiftService.create(command);
        return Response.status(Response.Status.CREATED).entity(shift).build();
    }

    @PUT
    @Path("/{id}")
    public AssignedShift update(@PathParam("id") Long id, UpdateShiftCommand command) {
        command.id = id;
        AssignedShift updated = shiftService.update(command);
        if (updated == null) {
            throw new NotFoundException();
        }
        return updated;
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        shiftService.deleteById(id);
        return Response.noContent().build();
    }
}
