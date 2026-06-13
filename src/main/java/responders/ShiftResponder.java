package responders;

import commands.AddShiftCommand;
import commands.ShiftSuggestCommand;
import commands.UpdateShiftCommand;
import daos.UserDao;
import dto.AssignedShiftDto;
import dto.ShiftSuggestDto;
import entities.AssignedShift;
import enums.ShiftType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.core.Response;
import mappers.DtoToCommandMapper;
import mappers.shift.ShiftDtoToCommandMapper;
import services.BaseService;
import services.ShiftService;

import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class ShiftResponder extends BaseResponder<AssignedShift, AddShiftCommand, UpdateShiftCommand, AssignedShiftDto> {

    @Inject
    ShiftService shiftService;

    @Inject
    ShiftDtoToCommandMapper shiftDtoToCommandMapper;

    @Inject
    UserDao userDao;

    @Override
    protected BaseService<AssignedShift, AddShiftCommand, UpdateShiftCommand> getService() {
        return shiftService;
    }

    @Override
    protected DtoToCommandMapper<AssignedShiftDto, AssignedShift, AddShiftCommand, UpdateShiftCommand> getDtoToCommandMapper() {
        return shiftDtoToCommandMapper;
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

        List<AssignedShift> suggestions = shiftService.suggestAssignments(
                cmd.userIds, cmd.startDate, cmd.endDate);
        return ok(shiftDtoToCommandMapper.mapToDto(suggestions));
    }

    @Transactional
    public Response deleteShiftsForWeek(LocalDate weekStart) {
        shiftService.deleteShiftsForWeek(weekStart);
        return ok();
    }

    @Transactional
    public Response deleteByDateAndType(LocalDate date, ShiftType type) {
        AssignedShift found = shiftService.listAll().stream()
                .filter(s -> s.date.equals(date) && s.type.equals(type))
                .findFirst()
                .orElseThrow(NotFoundException::new);
        shiftService.deleteById(found.id);
        return ok();
    }

    public Response recalculateAllUsersScores() {
        shiftService.recalculateAllUsersScores();
        return ok();
    }
}
