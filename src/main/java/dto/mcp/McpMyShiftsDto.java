package dto.mcp;

import io.quarkus.runtime.annotations.RegisterForReflection;

import java.time.LocalDate;
import java.util.List;

@RegisterForReflection
public record McpMyShiftsDto(String username, LocalDate today, LocalDate from, LocalDate to, List<McpShiftDto> shifts) {
}
