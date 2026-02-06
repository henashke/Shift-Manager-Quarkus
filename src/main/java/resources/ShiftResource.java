package resources;

import commands.AddShiftCommand;
import commands.DeleteShiftsByWeekCommand;
import commands.ShiftSuggestCommand;
import commands.UpdateShiftCommand;
import entities.AssignedShift;
import enums.ShiftType;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import services.ShiftService;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Path("/api/shifts")
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

    @DELETE
    public Response deleteShift(Map<String, String> payload) {
        LocalDate date = LocalDate.parse(payload.get("date"));
        ShiftType type = ShiftType.valueOf(payload.get("type"));

        List<AssignedShift> shifts = shiftService.findAll();
        for (AssignedShift shift : shifts) {
            if (shift.date.equals(date) && shift.type.equals(type)) {
                shiftService.deleteById(shift.id);
                return Response.ok().build();
            }
        }
        throw new NotFoundException();
    }

    @DELETE
    @Path("/week")
    public Response deleteWeek(DeleteShiftsByWeekCommand command) {
        shiftService.deleteShiftsForWeek(command.weekStart);
        Map<String, Integer> response = new HashMap<>();
        response.put("deleted", 14);
        return Response.ok(response).build();
    }

    @POST
    @Path("/suggest")
    public Response suggest(ShiftSuggestCommand command) throws Exception {
        List<AssignedShift> suggestions = shiftService.suggestAssignments(
                command.userIds, command.startDate, command.endDate);
        return Response.ok(suggestions).build();
    }

    @POST
    @Path("/recalculateAllUsersScores")
    public Response recalculateScores() {
        shiftService.recalculateAllUsersScores();
        return Response.ok().build();
    }
}
