package resources;

import auth.RoleConstants;
import commands.DeleteShiftsByWeekCommand;
import commands.UpdateShiftCommand;
import dto.AssignedShiftDto;
import dto.ShiftDto;
import dto.ShiftSuggestDto;
import enums.ShiftType;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import responders.ShiftResponder;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Path("/api/shifts")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ShiftResource {

    @Inject
    ShiftResponder shiftResponder;

    @GET
    public List<AssignedShiftDto> list() {
        return shiftResponder.listAll();
    }

    @GET
    @Path("/{id}")
    public AssignedShiftDto get(@PathParam("id") Long id) {
        AssignedShiftDto dto = shiftResponder.findById(id);
        if (dto == null) throw new NotFoundException();
        return dto;
    }

    @POST
    @RolesAllowed({RoleConstants.ADMIN})
    public Response create(List<AssignedShiftDto> dtos) {
        List<AssignedShiftDto> created = shiftResponder.createBulk(dtos);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed({RoleConstants.ADMIN})
    public AssignedShiftDto update(@PathParam("id") Long id, UpdateShiftCommand command) {
        command.id = id;
        return shiftResponder.update(id, command);
    }

    @DELETE
    @RolesAllowed({RoleConstants.ADMIN})
    public Response deleteShift(ShiftDto shift) {
        shiftResponder.deleteByDateAndType(shift.date, ShiftType.fromHebrew(shift.type));
        return Response.ok().build();
    }

    @DELETE
    @Path("/week")
    @RolesAllowed({RoleConstants.ADMIN})
    public Response deleteWeek(DeleteShiftsByWeekCommand command) {
        shiftResponder.deleteShiftsForWeek(command.weekStart);
        Map<String, Integer> response = new HashMap<>();
        response.put("deleted", 14);
        return Response.ok(response).build();
    }

    @POST
    @Path("/suggest")
    @RolesAllowed({RoleConstants.ADMIN})
    public Response suggest(ShiftSuggestDto dto) throws Exception {
        List<AssignedShiftDto> suggestions = shiftResponder.suggest(dto);
        return Response.ok(suggestions).build();
    }

    @POST
    @Path("/recalculateAllUsersScores")
    @RolesAllowed({RoleConstants.ADMIN})
    public Response recalculateScores() {
        shiftResponder.recalculateAllUsersScores();
        return Response.ok().build();
    }
}
