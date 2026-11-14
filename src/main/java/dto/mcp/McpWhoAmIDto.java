package dto.mcp;

import io.quarkus.runtime.annotations.RegisterForReflection;

import java.time.LocalDate;

@RegisterForReflection
public record McpWhoAmIDto(String username, String role, boolean reserve, LocalDate today, String todayDayOfWeek,
                           LocalDate currentWeekStart) {
}
