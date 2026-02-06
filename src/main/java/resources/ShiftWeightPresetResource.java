package resources;

import commands.AddShiftWeightPresetCommand;
import commands.SetCurrentPresetCommand;
import entities.ShiftWeightPreset;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import services.ShiftWeightPresetService;
import services.ShiftWeightSettingsService;

import java.util.HashMap;
import java.util.Map;

@Path("/api/shift-weight-settings")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ShiftWeightPresetResource {

    @Inject
    ShiftWeightPresetService shiftWeightPresetService;

    @Inject
    ShiftWeightSettingsService shiftWeightSettingsService;

    @GET
    public Map<String, Object> getSettings() {
        Map<String, Object> settings = new HashMap<>();
        settings.put("currentPreset", "default");

        Map<String, ShiftWeightPreset> presets = new HashMap<>();
        for (ShiftWeightPreset preset : shiftWeightSettingsService.getAllPresets()) {
            presets.put(preset.name, preset);
        }
        settings.put("presets", presets);

        return settings;
    }

    @POST
    @Path("/preset")
    public Response savePreset(AddShiftWeightPresetCommand command) {
        ShiftWeightPreset preset = shiftWeightPresetService.create(command);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Presets saved");
        return Response.ok(response).build();
    }

    @POST
    @Path("/current-preset")
    public Response setCurrentPreset(SetCurrentPresetCommand command) throws Exception {
        shiftWeightSettingsService.setCurrentPreset(command.currentPreset);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Current preset set");
        return Response.ok(response).build();
    }

    // Legacy endpoints for compatibility
    @GET
    @Path("/{id}")
    public ShiftWeightPreset get(@PathParam("id") Long id) {
        ShiftWeightPreset preset = shiftWeightPresetService.findById(id);
        if (preset == null) {
            throw new NotFoundException();
        }
        return preset;
    }


    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        shiftWeightPresetService.deleteById(id);
        return Response.noContent().build();
    }
}
