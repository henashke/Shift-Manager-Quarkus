package services;

import daos.AssignedShiftDao;
import daos.UserDao;
import entities.AssignedShift;
import entities.User;
import enums.Day;
import enums.ShiftKind;
import enums.ShiftType;
import jakarta.enterprise.context.ApplicationScoped;
import lombok.RequiredArgsConstructor;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Predicate;
import java.util.stream.Collectors;

/**
 * Shift statistics for the stats page. Counts regular assignments in every table, up to and including today (scheduled
 * future shifts aren't counted yet); shadow and jump are counted separately.
 */
@ApplicationScoped
@RequiredArgsConstructor
public class StatsService {

    static final int RECENT_DAYS = 30;

    private final AssignedShiftDao shiftDao;
    private final UserDao userDao;

    // recent: the last RECENT_DAYS days, ending today
    public record UserStats(User user, LocalDate firstShift, long daysSinceFirstShift, int thisYear,
                            int allTime, int recent, int day, int night, int weekend, int shadow, int jump) {
    }

    public List<UserStats> userStats() {
        LocalDate today = LocalDate.now();
        LocalDate recentStart = today.minusDays(RECENT_DAYS - 1);
        LocalDate yearStart = today.withDayOfYear(1);

        Map<Long, List<AssignedShift>> doneByUser = shiftDao.listAll().stream()
                .filter(shift -> shift.assignedUser != null && shift.date != null && !shift.date.isAfter(today))
                .collect(Collectors.groupingBy(shift -> shift.assignedUser.id));

        return userDao.listSchedulable().stream()
                .sorted(Comparator.comparing(user -> user.name.toLowerCase()))
                .map(user -> userStats(user, doneByUser.getOrDefault(user.id, List.of()), today, recentStart,
                        yearStart))
                .toList();
    }

    private static UserStats userStats(User user, List<AssignedShift> shifts, LocalDate today, LocalDate recentStart,
                                       LocalDate yearStart) {
        List<AssignedShift> regular = shifts.stream().filter(shift -> shift.kind == ShiftKind.REGULAR).toList();
        Optional<LocalDate> firstShift = regular.stream().map(shift -> shift.date).min(LocalDate::compareTo);
        return new UserStats(
                user,
                firstShift.orElse(null),
                firstShift.map(first -> ChronoUnit.DAYS.between(first, today)).orElse(0L),
                count(regular, shift -> !shift.date.isBefore(yearStart)),
                regular.size(),
                count(regular, shift -> !shift.date.isBefore(recentStart)),
                count(regular, shift -> shift.type == ShiftType.DAY),
                count(regular, shift -> shift.type == ShiftType.NIGHT),
                count(regular, shift -> isWeekend(shift.date)),
                count(shifts, shift -> shift.kind == ShiftKind.SHADOW),
                count(shifts, shift -> shift.kind == ShiftKind.JUMP));
    }

    private static int count(List<AssignedShift> shifts, Predicate<AssignedShift> predicate) {
        return (int) shifts.stream().filter(predicate).count();
    }

    // Friday and Saturday
    private static boolean isWeekend(LocalDate date) {
        Day day = Day.fromDate(date);
        return day == Day.FRIDAY || day == Day.SATURDAY;
    }
}
