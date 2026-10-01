package resources;

import auth.RoleConstants;
import commands.SetCurrentPresetCommand;
import dto.ShiftWeightPresetDto;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import responders.ShiftWeightPresetResponder;

import java.util.Map;

@Path("/api/shift-weight-settings")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed({RoleConstants.USER, RoleConstants.ADMIN})
public class ShiftWeightPresetResource {

    @Inject
    ShiftWeightPresetResponder shiftWeightPresetResponder;

    @GET
    public Map<String, Object> getSettings() {
        return shiftWeightPresetResponder.getSettings();
    }

    @POST
    @Path("/preset")
    @RolesAllowed({RoleConstants.ADMIN})
    public Response savePreset(ShiftWeightPresetDto shiftWeightPresetDto) {
        return shiftWeightPresetResponder.saveByName(shiftWeightPresetDto);
    }

    @POST
    @Path("/current-preset")
    @RolesAllowed({RoleConstants.ADMIN})
    public Response setCurrentPreset(SetCurrentPresetCommand command) throws Exception {
        return shiftWeightPresetResponder.setCurrentPreset(command.currentPreset);
    }
}