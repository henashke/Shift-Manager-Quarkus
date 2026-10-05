package services;

import auth.RoleConstants;
import commands.AddShiftCommand;
import commands.UpdateShiftCommand;
import daos.AssignedShiftDao;
import daos.UserDao;
import entities.*;
import enums.ConstraintType;
import enums.Day;
import enums.ShiftKind;
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
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@ApplicationScoped
public class ShiftService extends BaseService<AssignedShift, AddShiftCommand, UpdateShiftCommand> {

    @Inject
    AssignedShiftDao dao;

    @Inject
    UserDao userDao;

    @Inject
    ConstraintService constraintService;

    @Inject
    ShiftWeightSettingsService shiftWeightSettingsService;

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

    /**
     * Overrides all given shifts (each in its table and role: regular, shadow or jump). Validates every shift first, so
     * nothing is written if any assigned user has a CANT constraint on their shift or would fill two roles of one shift
     * in the same table (being in the same shift in two tables is fine).
     */
    public List<AssignedShift> overrideShifts(List<AddShiftCommand> commands) {
        commands.forEach(this::throwIfUserCantWorkShift);
        throwIfUserFillsTwoRoles(commands);
        commands.stream()
                .filter(command -> command.shiftWeightPresetId == null)
                .forEach(command -> command.shiftWeightPresetId = currentPreset().id);
        return commands.stream().map(this::overrideShift).toList();
    }

    private void throwIfUserCantWorkShift(AddShiftCommand command) {
        if (command.userId != null && constraintService.hasCANTConstraint(command.userId, command.date, command.type)) {
            throw new ShiftConstraintViolationException(userDao.findById(command.userId).name);
        }
    }

    // Checks each shift (date + day/night) of each table as it will be after the save: its current roles, with the ones
    // in this save replacing theirs
    private void throwIfUserFillsTwoRoles(List<AddShiftCommand> commands) {
        Map<String, List<AddShiftCommand>> commandsByShift = commands.stream()
                .collect(Collectors.groupingBy(command -> command.date + "|" + command.type + "|"
                        + Objects.requireNonNullElse(command.specialTableName, "")));
        for (List<AddShiftCommand> shiftCommands : commandsByShift.values()) {
            AddShiftCommand first = shiftCommands.get(0);
            Map<ShiftKind, Long> holders = new EnumMap<>(ShiftKind.class);
            for (AssignedShift existing : dao.findByDateAndType(first.date, first.type)) {
                if (existing.assignedUser != null && Objects.equals(existing.specialTableName, first.specialTableName)) {
                    holders.put(existing.kind, existing.assignedUser.id);
                }
            }
            shiftCommands.forEach(command -> holders.put(command.kind, command.userId));

            Set<Long> seen = new HashSet<>();
            for (Long userId : holders.values()) {
                if (userId != null && !seen.add(userId)) {
                    throw new ShiftRoleConflictException(userDao.findById(userId).name);
                }
            }
        }
    }

    public AssignedShift overrideShift(AddShiftCommand command) {
        dao.deleteSlot(command.date, command.type, command.kind, command.specialTableName);
        return super.create(command);
    }

    @Transactional
    public boolean deleteSlot(LocalDate date, ShiftType type, ShiftKind kind, String specialTableName) {
        return dao.deleteSlot(date, type, kind, specialTableName) > 0;
    }

    public List<AssignedShift> listByWeekOffset(int weekOffset) {
        WeekWindow window = WeekWindow.centeredOn(weekOffset);
        return dao.findBetween(window.start(), window.end());
    }

    // Clears one table of the week (null: the regular table)
    @Transactional
    public void deleteShiftsForWeek(LocalDate weekStart, String specialTableName) {
        LocalDate weekEnd = weekStart.plusDays(6);
        dao.deleteBetween(weekStart, weekEnd, specialTableName);
    }

    // Renames an extra table for one week: every shift of it that week
    @Transactional
    public void renameTableForWeek(LocalDate weekStart, String from, String to) {
        if (from.equals(to)) return;
        LocalDate weekEnd = weekStart.plusDays(6);
        if (dao.countInTable(weekStart, weekEnd, to) > 0) throw new ShiftTableNameTakenException(to);
        dao.renameTable(weekStart, weekEnd, from, to);
    }

    @Transactional
    public List<AssignedShift> suggestAssignments(List<Long> userIds, LocalDate startDate, LocalDate endDate,
                                                  String specialTableName) throws Exception {
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
        constraints.addAll(otherAssigneesAsCant(startDate, endDate, specialTableName));

        // Prefer the configured LLM's schedule, but only if it passes validation; otherwise fall back.
        ShiftSuggester suggester = selectSuggester();
        if (suggester != null && suggester.isEnabled()) {
            try {
                List<AssignedShift> llmSuggestions =
                        suggester.suggest(users, constraints, startDate, endDate);
                suggestionValidator.validate(llmSuggestions, users, constraints, startDate, endDate);
                return inTable(withCurrentPresetIfMissing(llmSuggestions), specialTableName);
            } catch (Exception e) {
                Log.warnf(e, "'%s' shift suggestion unusable, falling back to offline algorithm: %s",
                        suggester.name(), e.getMessage());
            }
        }

        List<AssignedShift> offlineSuggestions = suggestAssignmentsOffline(users, constraints, startDate, endDate);
        // Validate the fallback too. It is the last resort, so we only warn rather than fail the request.
        try {
            suggestionValidator.validate(offlineSuggestions, users, constraints, startDate, endDate);
        } catch (ShiftSuggestionValidationException e) {
            Log.warnf("Offline fallback schedule has issues: %s", e.getMessage());
        }
        return inTable(withCurrentPresetIfMissing(offlineSuggestions), specialTableName);
    }

    /**
     * Suggestions only fill the regular role of one table, and whoever holds a shift's shadow or jump role in that
     * table can't take its regular one too (other tables don't matter). Passed to the suggesters as CANT constraints
     * (never saved), so every suggester and the validator respect it without knowing about roles or tables.
     */
    private List<Constraint> otherAssigneesAsCant(LocalDate startDate, LocalDate endDate, String specialTableName) {
        return dao.findBetween(startDate, endDate).stream()
                .filter(shift -> shift.assignedUser != null)
                .filter(shift -> shift.kind != ShiftKind.REGULAR
                        && Objects.equals(shift.specialTableName, specialTableName))
                .map(shift -> {
                    Constraint cant = new Constraint();
                    cant.user = shift.assignedUser;
                    cant.date = shift.date;
                    cant.type = shift.type;
                    cant.constraintType = ConstraintType.CANT;
                    return cant;
                })
                .toList();
    }

    private static List<AssignedShift> inTable(List<AssignedShift> shifts, String specialTableName) {
        shifts.forEach(shift -> shift.specialTableName = specialTableName);
        return shifts;
    }

    /**
     * Every assigned shift needs a preset (the client reads it, and scores are calculated from it). Like the old
     * backend, shifts without one get the current preset.
     */
    private List<AssignedShift> withCurrentPresetIfMissing(List<AssignedShift> shifts) {
        ShiftWeightPreset currentPreset = currentPreset();
        shifts.stream()
                .filter(shift -> shift.shiftWeightPreset == null)
                .forEach(shift -> shift.shiftWeightPreset = currentPreset);
        return shifts;
    }

    private ShiftWeightPreset currentPreset() {
        ShiftWeightPreset currentPreset = shiftWeightSettingsService.getCurrentPreset();
        if (currentPreset == null) {
            throw new IllegalStateException("The current shift weight preset doesn't exist");
        }
        return currentPreset;
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
    private List<AssignedShift> suggestAssignmentsOffline(List<User> users, List<Constraint> constraints,
                                                          LocalDate startDate, LocalDate endDate) {
        Set<String> cantKeys = constraints.stream()
                .filter(constraint -> constraint.constraintType == ConstraintType.CANT)
                .map(constraint -> constraint.user.id + "|" + constraint.date + "|" + constraint.type)
                .collect(Collectors.toSet());
        List<AssignedShift> suggestions = new ArrayList<>();
        ShiftType[] shiftTypes = {ShiftType.DAY, ShiftType.NIGHT};
        LocalDate currentDate = startDate;
        int userIndex = 0;

        while (!currentDate.isAfter(endDate)) {
            for (ShiftType shiftType : shiftTypes) {
                int attempts = 0;
                while (attempts < users.size()) {
                    User user = users.get(userIndex % users.size());

                    if (!cantKeys.contains(user.id + "|" + currentDate + "|" + shiftType)) {
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

    /**
     * Replays all assigned shifts in chronological order. A user's starting score is the average score of the users
     * who already worked at the time of their first shift (instead of 0), so latecomers don't end up far below
     * everyone else. Users with no shifts yet get the current average (admins without shifts stay at 0).
     * Reservists are left out entirely: their shifts don't count toward anyone's score or the averages, and their own
     * score is kept as it is.
     */
    @Transactional
    public void recalculateAllUsersScores() {
        List<AssignedShift> shifts = dao.listAll().stream()
                .filter(shift -> shift.assignedUser != null && !shift.assignedUser.reserve)
                .sorted(Comparator.comparing((AssignedShift shift) -> shift.date).thenComparing(shift -> shift.type))
                .toList();

        // Users who already had their first shift, by id
        Map<Long, Integer> scores = new HashMap<>();
        for (AssignedShift shift : shifts) {
            Long userId = shift.assignedUser.id;
            if (!scores.containsKey(userId)) {
                scores.put(userId, averageScore(scores));
            }
            scores.merge(userId, weightOf(shift), Integer::sum);
        }

        int average = averageScore(scores);
        for (User user : userDao.listAll()) {
            if (user.reserve) continue;
            if (scores.containsKey(user.id)) {
                user.score = scores.get(user.id);
            } else {
                user.score = RoleConstants.ADMIN.equals(user.role) ? 0 : average;
            }
        }
    }

    private static int averageScore(Map<Long, Integer> scores) {
        return (int) Math.round(scores.values().stream().mapToInt(Integer::intValue).average().orElse(0));
    }

    private static int weightOf(AssignedShift shift) {
        Day dayOfWeek = Day.fromDate(shift.date);
        return shift.shiftWeightPreset.shiftWeights.stream()
                .filter(w -> w.day == dayOfWeek && w.shiftType == shift.type)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Malformed Shift weight preset. Could not find weight for shift on %s of type %s".formatted(dayOfWeek, shift.type)))
                .weight;
    }
}
