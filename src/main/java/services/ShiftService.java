package services;

import commands.AddShiftCommand;
import commands.UpdateShiftCommand;
import daos.AssignedShiftDao;
import daos.UserDao;
import entities.AssignedShift;
import entities.ShiftWeight;
import entities.ShiftWeightPreset;
import entities.User;
import enums.Day;
import enums.ShiftType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import mappers.CommandToEntityMapper;
import mappers.shift.ShiftCommandToEntityMapper;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class ShiftService extends BaseService<AssignedShift, AddShiftCommand, UpdateShiftCommand> {

    @Inject
    AssignedShiftDao dao;

    @Inject
    UserDao userDao;

    @Inject
    ConstraintService constraintService;

    @Inject
    ShiftCommandToEntityMapper commandToEntityMapper;

    @Override
    protected AssignedShiftDao getDao() {
        return dao;
    }

    @Override
    protected CommandToEntityMapper<AssignedShift, AddShiftCommand, UpdateShiftCommand> getMapper() {
        return commandToEntityMapper;
    }

    @Transactional
    public void deleteShiftsForWeek(LocalDate weekStart) {
        LocalDate weekEnd = weekStart.plusDays(6);
        dao.deleteBetween(weekStart, weekEnd);
    }

    @Transactional
    public List<AssignedShift> suggestAssignments(List<Long> userIds, LocalDate startDate, LocalDate endDate) throws Exception {
        List<AssignedShift> suggestions = new ArrayList<>();
        List<User> users = new ArrayList<>();
        for (Long userId : userIds) {
            User user = userDao.findById(userId);
            if (user != null) users.add(user);
        }

        if (users.isEmpty()) {
            throw new Exception("No valid users provided");
        }

        ShiftType[] shiftTypes = {ShiftType.DAY, ShiftType.NIGHT};
        LocalDate currentDate = startDate;
        int userIndex = 0;

        while (!currentDate.isAfter(endDate)) {
            for (ShiftType shiftType : shiftTypes) {
                int attempts = 0;
                while (attempts < users.size()) {
                    User user = users.get(userIndex % users.size());

                    if (!constraintService.hasCANTConstraint(user.id, currentDate, shiftType)) {
                        AssignedShift shift = new AssignedShift();
                        shift.date = currentDate;
                        shift.type = shiftType;
                        shift.assignedUser = user;
                        suggestions.add(shift);
                        userIndex++;
                        break;
                    }

                    userIndex++;
                    attempts++;
                }
            }
            currentDate = currentDate.plusDays(1);
        }

        return suggestions;
    } //todo doesn't work

    @Transactional
    public void recalculateAllUsersScores() {
        List<User> users = userDao.listAll();
        for (User user : users) {
            int score = 0;
            List<AssignedShift> shifts = dao.find("assignedUser.id", user.id).list();
            for (AssignedShift shift : shifts) {
                ShiftWeightPreset shiftWeightPreset = shift.shiftWeightPreset;
                Day dayOfWeak = Day.fromDate(shift.date);
                ShiftType shiftType = shift.type;
                Optional<ShiftWeight> shiftWeight = shiftWeightPreset.shiftWeights
                        .stream()
                        .filter(w -> w.day == dayOfWeak && w.shiftType == shiftType)
                        .findFirst();
                if (shiftWeight.isEmpty()) {
                    throw new RuntimeException("Malformed Shift weight preset. Could not find weight for shift on %s of type %s".formatted(dayOfWeak, shiftType));
                }
                int scoreToAdd = shiftWeight.get().weight;
                score += scoreToAdd;
            }
            user.score = score;
            userDao.persist(user);
        }
    }
}
