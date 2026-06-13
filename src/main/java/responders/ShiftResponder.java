package responders;

import commands.AddShiftCommand;
import commands.ShiftSuggestCommand;
import commands.UpdateShiftCommand;
import daos.ShiftWeightPresetDao;
import daos.UserDao;
import dto.AssignedShiftDto;
import dto.ShiftSuggestDto;
import entities.AssignedShift;
import entities.ShiftWeightPreset;
import entities.User;
import enums.ShiftType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
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

    @Inject
    UserDao userDao;

    @Inject
    ShiftWeightPresetDao shiftWeightPresetDao;

    @Override
    protected BaseService<AssignedShift> getService() {
        return shiftService;
    }

    @Override
    protected CommandToEntityMapper<AssignedShift, AddShiftCommand, UpdateShiftCommand, AssignedShiftDto> getMapper() {
        return assignedShiftMapper;
    }

    @Transactional
    public List<AssignedShiftDto> createBulk(List<AssignedShiftDto> dtos) {
        return dtos.stream().map(dto -> create(toAddCommand(dto))).toList();
    }

    @Transactional
    public List<AssignedShiftDto> suggest(ShiftSuggestDto dto) throws Exception {
        ShiftSuggestCommand cmd = new ShiftSuggestCommand();
        cmd.userIds = dto.userIds.stream()
                .map(name -> userDao.findByUsername(name)
                        .map(u -> u.id)
                        .orElseThrow(() -> new BadRequestException("User not found: " + name)))
                .toList();
        cmd.startDate = dto.startDate;
        cmd.endDate = dto.endDate;

        List<AssignedShift> suggestions = shiftService.suggestAssignments(
                cmd.userIds, cmd.startDate, cmd.endDate);
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

    private AddShiftCommand toAddCommand(AssignedShiftDto dto) {
        User user = userDao.findByUsername(dto.assignedUsername)
                .orElseThrow(() -> new BadRequestException("User not found: " + dto.assignedUsername));
        ShiftWeightPreset preset = dto.preset != null
                ? shiftWeightPresetDao.findByName(dto.preset.name)
                : null;

        AddShiftCommand cmd = new AddShiftCommand();
        cmd.date = dto.date;
        cmd.type = ShiftType.fromHebrew(dto.type);
        cmd.userId = user.id;
        cmd.shiftWeightPresetId = preset != null ? preset.id : null;
        return cmd;
    }
}
