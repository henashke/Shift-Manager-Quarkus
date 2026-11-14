package dto.mcp;

import io.quarkus.runtime.annotations.RegisterForReflection;

import java.time.LocalDate;
import java.util.List;

/**
 * A week of the schedule (Sunday to Saturday).
 *
 * @param tables              the week's tables: "regular" plus any extra ones
 * @param emptyRegularSlots   shifts of the regular table with no REGULAR assignee yet, as "date DAY|NIGHT"
 */
@RegisterForReflection
public record McpScheduleDto(LocalDate today, LocalDate weekStart, LocalDate weekEnd, List<String> tables,
                             List<McpShiftDto> shifts, List<String> emptyRegularSlots) {
}
