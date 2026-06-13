package resources;

import commands.AddShiftCommand;
import commands.DeleteShiftsByWeekCommand;
import commands.ShiftSuggestCommand;
import commands.UpdateShiftCommand;
import dto.AssignedShiftDto;
import enums.ShiftType;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import responders.ShiftResponder;

import java.time.LocalDate;
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
        if (dto == null) {
            throw new NotFoundException();
        }
        return dto;
    }

    @POST
    public Response create(AddShiftCommand command) {
        AssignedShiftDto dto = shiftResponder.create(command);
        return Response.status(Response.Status.CREATED).entity(dto).build();
    }

    @PUT
    @Path("/{id}")
    public AssignedShiftDto update(@PathParam("id") Long id, UpdateShiftCommand command) {
        command.id = id;
        return shiftResponder.update(id, command);
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        shiftResponder.deleteById(id);
        return Response.noContent().build();
    }

    @DELETE
    public Response deleteShift(Map<String, String> payload) {
        LocalDate date = LocalDate.parse(payload.get("date"));
        ShiftType type = ShiftType.valueOf(payload.get("type"));
        shiftResponder.deleteByDateAndType(date, type);
        return Response.ok().build();
    }

    @DELETE
    @Path("/week")
    public Response deleteWeek(DeleteShiftsByWeekCommand command) {
        shiftResponder.deleteShiftsForWeek(command.weekStart);
        Map<String, Integer> response = new HashMap<>();
        response.put("deleted", 14);
        return Response.ok(response).build();
    }

    @POST
    @Path("/suggest")
    public Response suggest(ShiftSuggestCommand command) throws Exception {
        List<AssignedShiftDto> suggestions = shiftResponder.suggest(command);
        return Response.ok(suggestions).build();
    }

    @POST
    @Path("/recalculateAllUsersScores")
    public Response recalculateScores() {
        shiftResponder.recalculateAllUsersScores();
        return Response.ok().build();
    }
}
