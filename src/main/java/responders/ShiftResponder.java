package responders;

import commands.AddShiftCommand;
import commands.ShiftSuggestCommand;
import commands.UpdateShiftCommand;
import dto.AssignedShiftDto;
import entities.AssignedShift;
import enums.ShiftType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import mappers.AssignedShiftMapper;
import mappers.CommandToEntityMapper;
import services.BaseService;
import services.ShiftService;

import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class ShiftResponder extends BaseResponder<AssignedShift, AddShiftCommand, UpdateShiftCommand, AssignedShiftDto> {

    @Inject
    ShiftService shiftService;

    @Inject
    AssignedShiftMapper assignedShiftMapper;

    @Override
    protected BaseService<AssignedShift> getService() {
        return shiftService;
    }

    @Override
    protected CommandToEntityMapper<AssignedShift, AddShiftCommand, UpdateShiftCommand, AssignedShiftDto> getMapper() {
        return assignedShiftMapper;
    }

    @Transactional
    public List<AssignedShiftDto> suggest(ShiftSuggestCommand command) throws Exception {
        List<AssignedShift> suggestions = shiftService.suggestAssignments(
                command.userIds, command.startDate, command.endDate);
        return assignedShiftMapper.mapToDto(suggestions);
    }

    @Transactional
    public void deleteShiftsForWeek(LocalDate weekStart) {
        shiftService.deleteShiftsForWeek(weekStart);
    }

    @Transactional
    public void deleteByDateAndType(LocalDate date, ShiftType type) {
        AssignedShift found = shiftService.listAll().stream()
                .filter(s -> s.date.equals(date) && s.type.equals(type))
                .findFirst()
                .orElseThrow(NotFoundException::new);
        shiftService.deleteById(found.id);
    }

    public void recalculateAllUsersScores() {
        shiftService.recalculateAllUsersScores();
    }
}
