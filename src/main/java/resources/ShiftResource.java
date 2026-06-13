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
    public List<AssignedShiftDto> list() {
        return shiftService.listAllDto();
    }

    @GET
    @Path("/{id}")
    public AssignedShiftDto get(@PathParam("id") Long id) {
        AssignedShiftDto dto = shiftService.findByIdDto(id);
        if (dto == null) {
            throw new NotFoundException();
        }
        return dto;
    }

    @POST
    public Response create(AddShiftCommand command) {
        AssignedShiftDto dto = shiftService.createDto(command);
        return Response.status(Response.Status.CREATED).entity(dto).build();
    }

    @PUT
    @Path("/{id}")
    public AssignedShiftDto update(@PathParam("id") Long id, UpdateShiftCommand command) {
        command.id = id;
        AssignedShiftDto dto = shiftService.updateDto(command);
        if (dto == null) {
            throw new NotFoundException();
        }
        return dto;
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

        entities.AssignedShift found = shiftService.listAll().stream()
                .filter(s -> s.date.equals(date) && s.type.equals(type))
                .findFirst()
                .orElseThrow(NotFoundException::new);
        shiftService.deleteById(found.id);
        return Response.ok().build();
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
        List<AssignedShiftDto> suggestions = shiftService.suggestAssignments(
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
