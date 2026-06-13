package resources;

import commands.AddShiftWeightPresetCommand;
import commands.SetCurrentPresetCommand;
import dto.ShiftWeightPresetDto;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import mappers.ShiftWeightPresetMapper;
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

    @Inject
    ShiftWeightPresetMapper shiftWeightPresetMapper;

    @GET
    public Map<String, Object> getSettings() {
        Map<String, Object> settings = new HashMap<>();
        settings.put("currentPreset", "פלוס 60"); // todo if we actually want this, need to add a settings table

        Map<String, ShiftWeightPresetDto> presets = new HashMap<>();
        for (entities.ShiftWeightPreset preset : shiftWeightSettingsService.getAllPresets()) {
            presets.put(preset.name, shiftWeightPresetMapper.mapToDto(preset));
        }
        settings.put("presets", presets);

        return settings;
    }

    @POST
    @Path("/preset")
    public Response savePreset(AddShiftWeightPresetCommand command) {
        shiftWeightPresetService.createDto(command);
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

    @GET
    @Path("/{id}")
    public ShiftWeightPresetDto get(@PathParam("id") Long id) {
        ShiftWeightPresetDto dto = shiftWeightPresetService.findByIdDto(id);
        if (dto == null) {
            throw new NotFoundException();
        }
        return dto;
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        shiftWeightPresetService.deleteById(id);
        return Response.noContent().build();
    }
}
