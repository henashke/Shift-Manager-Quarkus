package responders;

import auth.RoleConstants;
import commands.AddConstraintCommand;
import commands.AddShiftCommand;
import commands.DeleteConstraintCommand;
import daos.UserDao;
import dto.ErrorDto;
import dto.StatsDto;
import dto.mcp.*;
import entities.AssignedShift;
import entities.Constraint;
import entities.User;
import enums.ConstraintType;
import enums.ShiftKind;
import enums.ShiftType;
import io.quarkiverse.mcp.server.ToolCallException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;
import lombok.RequiredArgsConstructor;
import services.*;
import util.ShiftTableNames;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.function.Supplier;

/**
 * The logic behind the MCP tools (see mcp.ShiftManagerTools): the same operations as the REST API, with the same
 * permission rules, in a shape that's easy for a model to read (English names, ISO dates, one flat list per answer).
 * Failures become tool errors with a message the model can relay or act on.
 */
@ApplicationScoped
@RequiredArgsConstructor
public class McpResponder {

    // What a missing table name means; also how the regular table is reported
    public static final String REGULAR_TABLE = "regular";
    private static final int MAX_RANGE_DAYS = 120;

    private final UserDao userDao;
    private final ShiftService shiftService;
    private final ConstraintService constraintService;
    private final StatsResponder statsResponder;
    private final ShiftWeightPresetResponder shiftWeightPresetResponder;

    public McpWhoAmIDto whoAmI(McpCaller caller) {
        User user = requireUser(caller.username());
        LocalDate today = LocalDate.now();
        return new McpWhoAmIDto(user.name, user.role, user.reserve, today, dayName(today), weekStart(today));
    }

    @Transactional
    public McpMyShiftsDto myShifts(McpCaller caller, String from, String to) {
        LocalDate today = LocalDate.now();
        LocalDate start = from == null ? today : parseDate(from, "from");
        LocalDate end = to == null ? start.plusDays(13) : parseDate(to, "to");
        requireRange(start, end);
        List<McpShiftDto> shifts = shiftService.listBetween(start, end).stream()
                .filter(shift -> shift.assignedUser != null && shift.assignedUser.name.equals(caller.username()))
                .sorted(SHIFT_ORDER)
                .map(McpResponder::toDto)
                .toList();
        return new McpMyShiftsDto(caller.username(), today, start, end, shifts);
    }

    @Transactional
    public McpScheduleDto schedule(String date, String table) {
        LocalDate start = weekStart(date == null ? LocalDate.now() : parseDate(date, "date"));
        LocalDate end = start.plusDays(6);
        String onlyTable = table == null ? null : tableName(table);

        List<AssignedShift> week = shiftService.listBetween(start, end);
        List<AssignedShift> shown = week.stream()
                .filter(shift -> table == null || Objects.equals(shift.specialTableName, onlyTable))
                .sorted(SHIFT_ORDER)
                .toList();

        Set<String> tables = new LinkedHashSet<>(List.of(REGULAR_TABLE));
        week.stream().map(shift -> shift.specialTableName).filter(Objects::nonNull).sorted().forEach(tables::add);

        Set<String> filledRegular = new HashSet<>();
        week.stream()
                .filter(shift -> shift.specialTableName == null && shift.kind == ShiftKind.REGULAR && shift.assignedUser != null)
                .forEach(shift -> filledRegular.add(shift.date + " " + shift.type));
        List<String> empty = new ArrayList<>();
        for (LocalDate day = start; !day.isAfter(end); day = day.plusDays(1)) {
            for (ShiftType type : ShiftType.values()) {
                String slot = day + " " + type;
                if (!filledRegular.contains(slot)) empty.add(slot);
            }
        }
        return new McpScheduleDto(LocalDate.now(), start, end, List.copyOf(tables),
                shown.stream().map(McpResponder::toDto).toList(), empty);
    }

    public McpUsersDto users() {
        return new McpUsersDto(userDao.listSchedulable().stream()
                .sorted(Comparator.comparing(user -> user.name.toLowerCase()))
                .map(user -> new McpUserDto(user.name, user.role, user.reserve, user.score))
                .toList());
    }

    @Transactional
    public McpConstraintsDto constraints(McpCaller caller, String date, String person) {
        LocalDate start = weekStart(date == null ? LocalDate.now() : parseDate(date, "date"));
        LocalDate end = start.plusDays(6);
        String who = person == null && !caller.admin() ? caller.username() : person;
        if (who != null) requireSelfOrAdmin(caller, who, "see");

        List<Constraint> constraints = who == null
                ? constraintService.listBetween(start, end)
                : constraintService.findByUserIdBetween(requireUser(who).id, start, end);
        return new McpConstraintsDto(start, end, constraints.stream()
                .sorted(Comparator.comparing((Constraint c) -> c.date).thenComparing(c -> c.type)
                        .thenComparing(c -> c.user.name))
                .map(c -> new McpConstraintDto(c.user.name, c.date, dayName(c.date), c.type, c.constraintType))
                .toList());
    }

    @Transactional
    public String setConstraint(McpCaller caller, String date, ShiftType shift, ConstraintType constraint, String person) {
        String who = person == null ? caller.username() : person;
        requireSelfOrAdmin(caller, who, "change");
        requireNonNull(shift, "shift");
        requireNonNull(constraint, "constraint");
        LocalDate day = parseDate(date, "date");

        AddConstraintCommand command = new AddConstraintCommand();
        command.userId = requireUser(who).id;
        command.date = day;
        command.type = shift;
        command.constraintType = constraint;
        constraintService.replace(command);
        return "Saved: %s %s %s %s (%s).".formatted(who, constraint, day, shift, dayName(day));
    }

    @Transactional
    public String removeConstraint(McpCaller caller, String date, ShiftType shift, String person) {
        String who = person == null ? caller.username() : person;
        requireSelfOrAdmin(caller, who, "change");
        requireNonNull(shift, "shift");
        LocalDate day = parseDate(date, "date");
        DeleteConstraintCommand command = new DeleteConstraintCommand();
        command.userId = requireUser(who).id;
        command.date = day;
        command.type = shift;
        constraintService.delete(command);
        return "Removed %s's constraint on %s %s, if there was one.".formatted(who, day, shift);
    }

    public StatsDto stats() {
        return statsResponder.stats();
    }

    public Map<String, Object> weightPresets() {
        return shiftWeightPresetResponder.getSettings();
    }

    @Transactional
    public McpShiftsDto suggest(McpCaller caller, String date, List<String> people, String table) {
        requireAdmin(caller);
        LocalDate start = weekStart(parseDate(date, "weekStart"));
        List<Long> userIds = people == null || people.isEmpty()
                ? userDao.listSchedulable().stream().filter(user -> !user.reserve).map(user -> user.id).toList()
                : people.stream().map(name -> requireUser(name).id).toList();
        try {
            return new McpShiftsDto("A proposal only: nothing is saved until assign_shifts is called with it.",
                    shiftService.suggestAssignments(userIds, start, start.plusDays(6), tableName(table)).stream()
                            .sorted(SHIFT_ORDER)
                            .map(McpResponder::toDto)
                            .toList());
        } catch (ToolCallException | WebApplicationException e) {
            throw e;
        } catch (Exception e) {
            throw new ToolCallException("Couldn't suggest a schedule: " + e.getMessage());
        }
    }

    @Transactional
    public McpShiftsDto assign(McpCaller caller, List<McpAssignmentInput> assignments, String table) {
        requireAdmin(caller);
        if (assignments == null || assignments.isEmpty()) throw new ToolCallException("No assignments given");
        String tableName = tableName(table);
        List<AddShiftCommand> commands = assignments.stream().map(assignment -> {
            requireNonNull(assignment.shift(), "shift");
            AddShiftCommand command = new AddShiftCommand();
            command.date = parseDate(assignment.date(), "date");
            command.type = assignment.shift();
            command.kind = ShiftKind.orRegular(assignment.role());
            command.specialTableName = tableName;
            command.userId = requireUser(assignment.person()).id;
            return command;
        }).toList();
        try {
            return new McpShiftsDto("Saved.",
                    shiftService.overrideShifts(commands).stream().sorted(SHIFT_ORDER).map(McpResponder::toDto).toList());
        } catch (ShiftConstraintViolationException | ShiftRoleConflictException e) {
            throw new ToolCallException("Nothing was saved: " + e.getMessage());
        }
    }

    public String unassign(McpCaller caller, String date, ShiftType shift, ShiftKind role, String table) {
        requireAdmin(caller);
        requireNonNull(shift, "shift");
        LocalDate day = parseDate(date, "date");
        ShiftKind kind = ShiftKind.orRegular(role);
        boolean deleted = shiftService.deleteSlot(day, shift, kind, tableName(table));
        return deleted ? "Cleared the %s role of %s %s.".formatted(kind, day, shift)
                : "Nobody was assigned to the %s role of %s %s.".formatted(kind, day, shift);
    }

    public String clearWeek(McpCaller caller, String date, String table) {
        requireAdmin(caller);
        LocalDate start = weekStart(parseDate(date, "date"));
        String tableName = tableName(table);
        shiftService.deleteShiftsForWeek(start, tableName);
        return "Cleared every shift of the %s table for the week %s to %s."
                .formatted(tableName == null ? REGULAR_TABLE : tableName, start, start.plusDays(6));
    }

    public String renameTable(McpCaller caller, String date, String from, String to) {
        requireAdmin(caller);
        LocalDate start = weekStart(parseDate(date, "date"));
        String fromName = tableName(from);
        String toName = tableName(to);
        if (fromName == null || toName == null) throw new ToolCallException("The regular table can't be renamed");
        try {
            shiftService.renameTableForWeek(start, fromName, toName);
        } catch (ShiftTableNameTakenException e) {
            throw new ToolCallException(e.getMessage());
        }
        return "Renamed table \"%s\" to \"%s\" for the week of %s.".formatted(fromName, toName, start);
    }

    public String recalculateScores(McpCaller caller) {
        requireAdmin(caller);
        shiftService.recalculateAllUsersScores();
        return "Recalculated every user's score.";
    }

    /**
     * Runs a tool, turning the REST layer's errors (e.g. a bad table name) into tool errors with their message.
     */
    public <T> T run(Supplier<T> tool) {
        try {
            return tool.get();
        } catch (WebApplicationException e) {
            Object entity = e.getResponse().getEntity();
            throw new ToolCallException(entity instanceof ErrorDto error ? error.error : e.getMessage());
        } catch (IllegalArgumentException e) {
            throw new ToolCallException(e.getMessage());
        }
    }

    private static final Comparator<AssignedShift> SHIFT_ORDER = Comparator
            .comparing((AssignedShift shift) -> shift.date)
            .thenComparing(shift -> shift.type)
            .thenComparing(shift -> Objects.requireNonNullElse(shift.specialTableName, ""))
            .thenComparing(shift -> shift.kind);

    private static McpShiftDto toDto(AssignedShift shift) {
        return new McpShiftDto(shift.date, dayName(shift.date), shift.type, shift.kind,
                shift.assignedUser == null ? null : shift.assignedUser.name,
                shift.specialTableName == null ? REGULAR_TABLE : shift.specialTableName);
    }

    // null for the regular table, by whatever name the model calls it
    private static String tableName(String table) {
        if (table == null || table.isBlank() || table.trim().equalsIgnoreCase(REGULAR_TABLE)) return null;
        return ShiftTableNames.normalize(table);
    }

    private static LocalDate weekStart(LocalDate date) {
        return date.with(TemporalAdjusters.previousOrSame(DayOfWeek.SUNDAY));
    }

    private static String dayName(LocalDate date) {
        return date.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
    }

    private static LocalDate parseDate(String value, String argument) {
        if (value == null || value.isBlank()) throw new ToolCallException(argument + " is required (YYYY-MM-DD)");
        try {
            return LocalDate.parse(value.trim());
        } catch (DateTimeParseException e) {
            throw new ToolCallException(argument + " must be a date in YYYY-MM-DD format, got: " + value);
        }
    }

    private static void requireRange(LocalDate start, LocalDate end) {
        if (end.isBefore(start)) throw new ToolCallException("'to' is before 'from'");
        if (ChronoUnit.DAYS.between(start, end) > MAX_RANGE_DAYS) {
            throw new ToolCallException("The range can be at most " + MAX_RANGE_DAYS + " days");
        }
    }

    private static void requireNonNull(Object value, String argument) {
        if (value == null) throw new ToolCallException(argument + " is required");
    }

    private User requireUser(String name) {
        if (name == null || name.isBlank()) throw new ToolCallException("A person's name is required");
        return userDao.findByUsername(name.trim()).orElseThrow(() ->
                new ToolCallException("No user named \"" + name + "\". Call list_users for the exact names."));
    }

    private static void requireAdmin(McpCaller caller) {
        if (!caller.admin()) throw new ToolCallException("Only admins (" + RoleConstants.ADMIN + " role) can do this");
    }

    private static void requireSelfOrAdmin(McpCaller caller, String person, String action) {
        if (!caller.admin() && !person.trim().equals(caller.username())) {
            throw new ToolCallException("Only admins can " + action + " other people's constraints");
        }
    }
}
