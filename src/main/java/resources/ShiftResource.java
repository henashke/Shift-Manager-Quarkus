package resources;

import auth.RoleConstants;
import commands.DeleteShiftsByWeekCommand;
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

import java.util.List;

@Path("/api/shifts")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ShiftResource {

    @Inject
    ShiftResponder shiftResponder;

    @GET
    public List<AssignedShiftDto> list(@QueryParam("weekOffset") Integer weekOffset) {
        return weekOffset == null
                ? shiftResponder.listAll()
                : shiftResponder.listByWeekOffset(weekOffset);
    }

    @POST
    @RolesAllowed({RoleConstants.ADMIN})
    public Response create(List<AssignedShiftDto> dtos) {
        return shiftResponder.createAll(dtos);
    }

    @DELETE
    @RolesAllowed({RoleConstants.ADMIN})
    public Response deleteShift(ShiftDto shift) {
        return shiftResponder.deleteByDateAndType(shift.date, ShiftType.fromHebrew(shift.type));
    }

    @DELETE
    @Path("/week")
    @RolesAllowed({RoleConstants.ADMIN})
    public Response deleteWeek(DeleteShiftsByWeekCommand command) {
        return shiftResponder.deleteShiftsForWeek(command.weekStart);
    }

    @POST
    @Path("/suggest")
    @RolesAllowed({RoleConstants.ADMIN})
    public Response suggest(ShiftSuggestDto dto) throws Exception {
        return shiftResponder.suggest(dto);
    }

    @POST
    @Path("/recalculateAllUsersScores")
    @RolesAllowed({RoleConstants.ADMIN})
    public Response recalculateScores() {
        return shiftResponder.recalculateAllUsersScores();
    }
}
