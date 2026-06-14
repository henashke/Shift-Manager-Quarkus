package services;

import commands.AddShiftCommand;
import commands.UpdateShiftCommand;
import daos.AssignedShiftDao;
import daos.UserDao;
import entities.*;
import enums.Day;
import enums.ShiftType;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import mappers.CommandToEntityMapper;
import mappers.shift.ShiftCommandToEntityMapper;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import util.WeekWindow;

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
    Instance<ShiftSuggester> suggesters;

    @ConfigProperty(name = "suggestion.provider", defaultValue = "ollama")
    String suggestionProvider;

    @Inject
    ShiftSuggestionValidator suggestionValidator;

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

    public AssignedShift overrideShift(AddShiftCommand command) {
        getDao().deleteByDateAndType(command.date, command.type);
        return super.create(command);
    }

    public List<AssignedShift> listByWeekOffset(int weekOffset) {
        WeekWindow window = WeekWindow.centeredOn(weekOffset);
        return dao.findBetween(window.start(), window.end());
    }

    @Transactional
    public void deleteShiftsForWeek(LocalDate weekStart) {
        LocalDate weekEnd = weekStart.plusDays(6);
        dao.deleteBetween(weekStart, weekEnd);
    }

    @Transactional
    public List<AssignedShift> suggestAssignments(List<Long> userIds, LocalDate startDate, LocalDate endDate) throws Exception {
        List<User> users = new ArrayList<>();
        for (Long userId : userIds) {
            User user = userDao.findById(userId);
            if (user != null) users.add(user);
        }

        if (users.isEmpty()) {
            throw new Exception("No valid users provided");
        }

        List<Constraint> constraints = new ArrayList<>();
        for (User user : users) {
            constraints.addAll(constraintService.findByUserIdBetween(user.id, startDate, endDate));
        }

        // Prefer the configured LLM's schedule, but only if it passes validation; otherwise fall back.
        ShiftSuggester suggester = selectSuggester();
        if (suggester != null && suggester.isEnabled()) {
            try {
                List<AssignedShift> llmSuggestions =
                        suggester.suggest(users, constraints, startDate, endDate);
                suggestionValidator.validate(llmSuggestions, users, constraints, startDate, endDate);
                return llmSuggestions;
            } catch (Exception e) {
                Log.warnf(e, "'%s' shift suggestion unusable, falling back to offline algorithm: %s",
                        suggester.name(), e.getMessage());
            }
        }

        List<AssignedShift> offlineSuggestions = suggestAssignmentsOffline(users, startDate, endDate);
        // Validate the fallback too. It is the last resort, so we only warn rather than fail the request.
        try {
            suggestionValidator.validate(offlineSuggestions, users, constraints, startDate, endDate);
        } catch (ShiftSuggestionValidationException e) {
            Log.warnf("Offline fallback schedule has issues: %s", e.getMessage());
        }
        return offlineSuggestions;
    }

    /**
     * Picks the {@link ShiftSuggester} whose {@link ShiftSuggester#name()} matches {@code suggestion.provider}.
     */
    private ShiftSuggester selectSuggester() {
        for (ShiftSuggester candidate : suggesters) {
            if (candidate.name().equalsIgnoreCase(suggestionProvider)) {
                return candidate;
            }
        }
        Log.warnf("No shift suggestion provider named '%s' found; using offline algorithm", suggestionProvider);
        return null;
    }

    /**
     * Deterministic round-robin fallback used when the LLM is disabled or unreachable.
     * Cycles through the users, skipping any with a CANT constraint for the slot.
     */
    private List<AssignedShift> suggestAssignmentsOffline(List<User> users, LocalDate startDate, LocalDate endDate) {
        List<AssignedShift> suggestions = new ArrayList<>();
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
