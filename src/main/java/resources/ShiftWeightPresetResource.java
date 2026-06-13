package resources;

import commands.AddShiftWeightPresetCommand;
import commands.SetCurrentPresetCommand;
import dto.ShiftWeightPresetDto;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import responders.ShiftWeightPresetResponder;

import java.util.HashMap;
import java.util.Map;

@Path("/api/shift-weight-settings")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ShiftWeightPresetResource {

    @Inject
    ShiftWeightPresetResponder shiftWeightPresetResponder;

    @GET
    public Map<String, Object> getSettings() {
        return shiftWeightPresetResponder.getSettings();
    }

    @POST
    @Path("/preset")
    public Response savePreset(AddShiftWeightPresetCommand command) {
        shiftWeightPresetResponder.create(command);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Presets saved");
        return Response.ok(response).build();
    }

    @POST
    @Path("/current-preset")
    public Response setCurrentPreset(SetCurrentPresetCommand command) throws Exception {
        shiftWeightPresetResponder.setCurrentPreset(command.currentPreset);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Current preset set");
        return Response.ok(response).build();
    }

    @GET
    @Path("/{id}")
    public ShiftWeightPresetDto get(@PathParam("id") Long id) {
        ShiftWeightPresetDto dto = shiftWeightPresetResponder.findById(id);
        if (dto == null) {
            throw new NotFoundException();
        }
        return dto;
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        shiftWeightPresetResponder.deleteById(id);
        return Response.noContent().build();
    }
}
