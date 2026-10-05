package responders;

import commands.AddShiftCommand;
import commands.DeleteShiftsByWeekCommand;
import commands.RenameShiftTableCommand;
import commands.ShiftSuggestCommand;
import commands.UpdateShiftCommand;
import daos.UserDao;
import dto.AssignedShiftDto;
import dto.ShiftDto;
import dto.ShiftSuggestDto;
import entities.AssignedShift;
import enums.ShiftKind;
import enums.ShiftType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.core.Response;
import mappers.DtoToCommandMapper;
import mappers.shift.ShiftDtoToCommandMapper;
import services.ShiftConstraintViolationException;
import services.ShiftRoleConflictException;
import services.ShiftService;
import services.ShiftTableNameTakenException;
import util.ShiftTableNames;

import java.util.List;

import static responders.ErrorResponses.error;

@ApplicationScoped
public class ShiftResponder extends BaseResponder<AssignedShift, AddShiftCommand, UpdateShiftCommand, AssignedShiftDto> {

    @Inject
    ShiftService service;

    @Inject
    ShiftDtoToCommandMapper shiftDtoToCommandMapper;

    @Inject
    UserDao userDao;

    @Override
    protected ShiftService getService() {
        return service;
    }

    @Override
    protected DtoToCommandMapper<AssignedShiftDto, AssignedShift, AddShiftCommand, UpdateShiftCommand> getDtoToCommandMapper() {
        return shiftDtoToCommandMapper;
    }

    public List<AssignedShiftDto> listByWeekOffset(int weekOffset) {
        return shiftDtoToCommandMapper.mapToDto(service.listByWeekOffset(weekOffset));
    }

    @Override
    @Transactional
    public Response createAll(List<AssignedShiftDto> dtos) {
        List<AddShiftCommand> commands = dtos.stream()
                .map(shiftDtoToCommandMapper::mapToAddCommand)
                .toList();
        try {
            return ok(shiftDtoToCommandMapper.mapToDto(service.overrideShifts(commands)));
        } catch (ShiftConstraintViolationException | ShiftRoleConflictException e) {
            // Rethrown (not returned) so the transaction is rolled back
            throw new BadRequestException(error(Response.Status.BAD_REQUEST, e.getMessage()));
        }
    }

    @Transactional
    public Response suggest(ShiftSuggestDto dto) throws Exception {
        ShiftSuggestCommand cmd = new ShiftSuggestCommand();
        cmd.userIds = dto.userIds.stream()
                .map(name -> userDao.findByUsername(name)
                        .map(u -> u.id)
                        .orElseThrow(() -> new jakarta.ws.rs.BadRequestException("User not found: " + name)))
                .toList();
        cmd.startDate = dto.startDate;
        cmd.endDate = dto.endDate;

        List<AssignedShift> suggestions = service.suggestAssignments(
                cmd.userIds, cmd.startDate, cmd.endDate, ShiftTableNames.normalize(dto.specialTableName));
        return ok(shiftDtoToCommandMapper.mapToDto(suggestions));
    }

    @Transactional
    public Response deleteShiftsForWeek(DeleteShiftsByWeekCommand command) {
        service.deleteShiftsForWeek(command.weekStart, ShiftTableNames.normalize(command.specialTableName));
        return ok();
    }

    public Response renameTableForWeek(RenameShiftTableCommand command) {
        String from = ShiftTableNames.normalize(command.from);
        String to = ShiftTableNames.normalize(command.to);
        if (command.weekStart == null || from == null || to == null) {
            return error(Response.Status.BAD_REQUEST, "weekStart, from and to are required, and the regular table can't be renamed");
        }
        try {
            service.renameTableForWeek(command.weekStart, from, to);
            return ok();
        } catch (ShiftTableNameTakenException e) {
            return error(Response.Status.CONFLICT, e.getMessage());
        }
    }

    public Response deleteSlot(ShiftDto shift) {
        boolean deleted = service.deleteSlot(shift.date, ShiftType.fromHebrew(shift.type), ShiftKind.orRegular(shift.kind),
                ShiftTableNames.normalize(shift.specialTableName));
        if (!deleted) throw new NotFoundException();
        return ok();
    }

    public Response recalculateAllUsersScores() {
        service.recalculateAllUsersScores();
        return ok();
    }
}
