package dto.mcp;

import io.quarkus.runtime.annotations.RegisterForReflection;

import java.time.LocalDate;
import java.util.List;

@RegisterForReflection
public record McpConstraintsDto(LocalDate weekStart, LocalDate weekEnd, List<McpConstraintDto> constraints) {
}
