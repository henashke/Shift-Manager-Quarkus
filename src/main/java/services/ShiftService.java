package services;

import commands.AddShiftCommand;
import commands.UpdateShiftCommand;
import daos.AssignedShiftDao;
import daos.BaseDao;
import daos.UserDao;
import entities.AssignedShift;
import entities.User;
import enums.ShiftType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import mappers.AssignedShiftMapper;
import mappers.CommandToEntityMapper;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class ShiftService extends BaseService<AssignedShift, AddShiftCommand, UpdateShiftCommand> {

    @Inject
    AssignedShiftDao assignedShiftDao;

    @Inject
    AssignedShiftMapper assignedShiftMapper;

    @Inject
    UserDao userDao;

    @Inject
    ConstraintService constraintService;

    @Override
    protected BaseDao<AssignedShift> getDao() {
        return assignedShiftDao;
    }

    @Override
    protected CommandToEntityMapper<AssignedShift, AddShiftCommand, UpdateShiftCommand> getMapper() {
        return assignedShiftMapper;
    }

    @Transactional
    public void deleteShiftsForWeek(LocalDate weekStart) {
        LocalDate weekEnd = weekStart.plusDays(6);
        assignedShiftDao.delete("date >= ?1 and date <= ?2", weekStart, weekEnd);
    }

    public List<AssignedShift> getAllShiftsBetween(LocalDate startDate, LocalDate endDate) {
        return assignedShiftDao.find("date >= ?1 and date <= ?2", startDate, endDate).list();
    }

    @Transactional
    public List<AssignedShift> suggestAssignments(List<Long> userIds, LocalDate startDate, LocalDate endDate) throws Exception {
        List<AssignedShift> suggestions = new ArrayList<>();
        List<User> users = new ArrayList<>();
        for (Long userId : userIds) {
            User user = userDao.findById(userId);
            if (user != null) {
                users.add(user);
            }
        }

        if (users.isEmpty()) {
            throw new Exception("No valid users provided");
        }

        ShiftType[] shiftTypes = {ShiftType.DAY, ShiftType.NIGHT};
        LocalDate currentDate = startDate;
        int userIndex = 0;

        while (!currentDate.isAfter(endDate)) {
            for (ShiftType shiftType : shiftTypes) {
                // Find next available user (round-robin with constraint checking)
                int attempts = 0;
                while (attempts < users.size()) {
                    User user = users.get(userIndex % users.size());

                    // Check if user has CANT constraint
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

                if (attempts == users.size()) {
                    // All users have CANT constraints for this shift, skip
                    continue;
                }
            }
            currentDate = currentDate.plusDays(1);
        }

        return suggestions;
    }

    @Transactional
    public void recalculateAllUsersScores() {
        List<User> users = userDao.listAll();
        for (User user : users) {
            int score = 0;
            List<AssignedShift> shifts = assignedShiftDao.find("assignedUser.id", user.id).list();
            for (AssignedShift shift : shifts) {
                // Weight calculation: "לילה" (night) = 2 points, "יום" (day) = 1 point
                if (shift.type.equals(ShiftType.NIGHT)) {
                    score += 2;
                } else {
                    score += 1;
                }
            }
            user.score = score;
            userDao.persist(user);
        }
    }
}
