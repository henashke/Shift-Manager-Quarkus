package util;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

/**
 * A date range spanning a 5-week window centered on the week {@code weekOffset} weeks from the
 * current week: the two weeks prior, the centered week, and the two weeks after. Weeks start on
 * Sunday (matching {@link enums.Day}).
 * <p>
 * For example, offset 0 spans two weeks ago through two weeks ahead, and offset 2 spans this week
 * through four weeks ahead.
 */
public record WeekWindow(LocalDate start, LocalDate end) {

    public static WeekWindow centeredOn(int weekOffset) {
        LocalDate centerWeekStart = LocalDate.now()
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.SUNDAY))
                .plusWeeks(weekOffset);
        return new WeekWindow(centerWeekStart.minusWeeks(2), centerWeekStart.plusWeeks(2).plusDays(6));
    }
}
