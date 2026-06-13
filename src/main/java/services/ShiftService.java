package services;

import daos.AssignedShiftDao;
import daos.BaseDao;
import daos.UserDao;
import entities.AssignedShift;
import entities.User;
import enums.ShiftType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class ShiftService extends BaseService<AssignedShift> {

    @Inject
    AssignedShiftDao assignedShiftDao;

    @Inject
    UserDao userDao;

    @Inject
    ConstraintService constraintService;

    @Override
    protected BaseDao<AssignedShift> getDao() {
        return assignedShiftDao;
    }

    @Transactional
    public void deleteShiftsForWeek(LocalDate weekStart) {
        LocalDate weekEnd = weekStart.plusDays(6);
        assignedShiftDao.delete("date >= ?1 and date <= ?2", weekStart, weekEnd);
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
    }

    @Transactional
    public void recalculateAllUsersScores() {
        List<User> users = userDao.listAll();
        for (User user : users) {
            int score = 0;
            List<AssignedShift> shifts = assignedShiftDao.find("assignedUser.id", user.id).list();
            for (AssignedShift shift : shifts) {
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
