package dto.mcp;

import com.fasterxml.jackson.annotation.JsonInclude;
import enums.ShiftKind;
import enums.ShiftType;
import io.quarkus.runtime.annotations.RegisterForReflection;

import java.time.LocalDate;

/**
 * One assignment: who holds a role (REGULAR, SHADOW or JUMP) in a shift (date + DAY/NIGHT) of a table.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@RegisterForReflection
public record McpShiftDto(LocalDate date, String dayOfWeek, ShiftType shift, ShiftKind role, String person,
                          String table) {
}
