package dto.mcp;

import enums.ConstraintType;
import enums.ShiftType;
import io.quarkus.runtime.annotations.RegisterForReflection;

import java.time.LocalDate;

@RegisterForReflection
public record McpConstraintDto(String person, LocalDate date, String dayOfWeek, ShiftType shift,
                               ConstraintType constraint) {
}
