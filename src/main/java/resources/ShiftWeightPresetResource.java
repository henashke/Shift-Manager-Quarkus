package resources;

import commands.SetCurrentPresetCommand;
import dto.ShiftWeightPresetDto;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import responders.ShiftWeightPresetResponder;

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
    public Response savePreset(ShiftWeightPresetDto shiftWeightPresetDto) {
        return shiftWeightPresetResponder.create(shiftWeightPresetDto);
    }

    @POST
    @Path("/current-preset")
    public Response setCurrentPreset(SetCurrentPresetCommand command) throws Exception {
        return shiftWeightPresetResponder.setCurrentPreset(command.currentPreset);
    }
}