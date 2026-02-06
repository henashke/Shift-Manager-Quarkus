package resources;

import commands.AddShiftWeightPresetCommand;
import entities.ShiftWeightPreset;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import services.ShiftWeightPresetService;
import java.util.List;

@Path("/shift-weight-presets")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ShiftWeightPresetResource {

    @Inject
    ShiftWeightPresetService shiftWeightPresetService;

    @GET
    public List<ShiftWeightPreset> list() {
        return shiftWeightPresetService.listAll();
    }

    @GET
    @Path("/{id}")
    public ShiftWeightPreset get(@PathParam("id") Long id) {
        ShiftWeightPreset preset = shiftWeightPresetService.findById(id);
        if (preset == null) {
            throw new NotFoundException();
        }
        return preset;
    }

    @POST
    public Response create(AddShiftWeightPresetCommand command) {
        ShiftWeightPreset preset = shiftWeightPresetService.create(command);
        return Response.status(Response.Status.CREATED).entity(preset).build();
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        shiftWeightPresetService.deleteById(id);
        return Response.noContent().build();
    }
}
